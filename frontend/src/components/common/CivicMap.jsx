import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Loader, Navigation } from 'lucide-react';

// Leaflet specific imports (dynamic or static)
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Premium Pulsing SVG Icons for Leaflet
const createCustomLeafletIcon = (color = '#c6a227') => {
  return new L.DivIcon({
    html: `
      <div style="
        position: relative;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          position: absolute;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: ${color};
          border: 2.5px solid #ffffff;
          box-shadow: 0 2px 6px rgba(0,0,0,0.4);
          z-index: 2;
        "></div>
        <div style="
          position: absolute;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: ${color};
          opacity: 0.35;
          animation: map-pulse 1.6s infinite;
          z-index: 1;
        "></div>
        <div style="
          position: absolute;
          bottom: -2px;
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 10px solid ${color};
          z-index: 2;
          transform: translateY(8px);
        "></div>
      </div>
      <style>
        @keyframes map-pulse {
          0% { transform: scale(0.4); opacity: 0.9; }
          80%, 100% { transform: scale(1.8); opacity: 0; }
        }
      </style>
    `,
    className: 'custom-gps-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 24],
    popupAnchor: [0, -24]
  });
};

// Priority colors matching government design system
const getPriorityColor = (priority) => {
  switch (priority?.toUpperCase()) {
    case 'CRITICAL': return '#b71c1c'; // Red
    case 'HIGH': return '#f97316'; // Orange
    case 'MEDIUM': return '#eab308'; // Yellow
    case 'LOW': return '#1976d2'; // Blue
    default: return '#c6a227'; // Gold
  }
};

// Global Script Loader Promise for Google Maps
let googlePromise = null;
const loadGoogleMaps = (apiKey) => {
  if (googlePromise) return googlePromise;
  googlePromise = new Promise((resolve, reject) => {
    if (window.google && window.google.maps) {
      resolve(window.google.maps);
      return;
    }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google.maps);
    script.onerror = (err) => reject(err);
    document.head.appendChild(script);
  });
  return googlePromise;
};

// Dynamic helper components for React Leaflet
function ChangeMapView({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
}

function MapEvents({ onClick, interactive }) {
  useMapEvents({
    click(e) {
      if (interactive && onClick) {
        onClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

/**
 * Premium Hybrid CivicMap Component
 */
const CivicMap = ({
  center = [12.9716, 77.5946], // Default Bengaluru
  zoom = 13,
  interactive = false,
  markers = [],
  activeMarkerId = null,
  onLocationSelect = null,
  onMarkerClick = null,
  height = '400px',
  className = '',
}) => {
  const [mapMode, setMapMode] = useState('loading'); // 'loading', 'google', 'leaflet'
  const [currentCenter, setCurrentCenter] = useState(center);
  const [selectedCoords, setSelectedCoords] = useState(interactive ? center : null);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLocating, setIsLocating] = useState(false);

  const googleKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const hasGoogleKey = googleKey && googleKey !== '' && googleKey !== 'YOUR_GOOGLE_MAPS_API_KEY' && googleKey !== 'YOUR_API_KEY_HERE';

  // Refs for Google Maps
  const googleMapDivRef = useRef(null);
  const googleMapInstanceRef = useRef(null);
  const googleMarkerRef = useRef(null);
  const googleMarkersRef = useRef({});

  // Detect mode
  useEffect(() => {
    if (hasGoogleKey) {
      loadGoogleMaps(googleKey)
        .then(() => {
          setMapMode('google');
        })
        .catch((err) => {
          console.warn('Failed to load Google Maps JS API, falling back to Leaflet:', err);
          setMapMode('leaflet');
        });
    } else {
      setMapMode('leaflet');
    }
  }, [hasGoogleKey, googleKey]);

  // Sync center prop shifts
  useEffect(() => {
    if (center && center[0] && center[1]) {
      setCurrentCenter(center);
      if (interactive) {
        setSelectedCoords(center);
      }
    }
  }, [center, interactive]);

  // Initial geocoding for pre-selected interactive location
  useEffect(() => {
    if (interactive && selectedCoords) {
      performReverseGeocode(selectedCoords[0], selectedCoords[1]);
    }
  }, []);

  // Geocoding and reverse geocoding controllers
  const performReverseGeocode = async (lat, lng) => {
    if (mapMode === 'google' && window.google) {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === 'OK' && results[0]) {
          const addr = results[0].formatted_address;
          setSelectedAddress(addr);
          if (onLocationSelect) onLocationSelect(lat, lng, addr);
        } else {
          const fallbackAddr = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
          setSelectedAddress(fallbackAddr);
          if (onLocationSelect) onLocationSelect(lat, lng, fallbackAddr);
        }
      });
    } else {
      // Leaflet Nominatim OSM Fallback
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
        );
        const data = await response.json();
        const addr = data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        setSelectedAddress(addr);
        if (onLocationSelect) onLocationSelect(lat, lng, addr);
      } catch (e) {
        const fallbackAddr = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        setSelectedAddress(fallbackAddr);
        if (onLocationSelect) onLocationSelect(lat, lng, fallbackAddr);
      }
    }
  };

  // Triggered on interactive clicking or pin dragging
  const handleMapSelection = (lat, lng) => {
    setSelectedCoords([lat, lng]);
    setCurrentCenter([lat, lng]);
    performReverseGeocode(lat, lng);
  };

  // Locates the user's live position via the browser Geolocation API
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        handleMapSelection(latitude, longitude);
        setIsLocating(false);
      },
      (error) => {
        console.warn('Geolocation access failed:', error);
        setIsLocating(false);
        alert('Could not retrieve your location. Setting default center.');
      },
      { enableHighAccuracy: true, timeout: 6000 }
    );
  };

  // Search autocomplete / query functions
  const handleSearchChange = async (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (!val || val.length < 3) {
      setSuggestions([]);
      return;
    }

    if (mapMode === 'google' && window.google) {
      const autocompleteService = new window.google.maps.places.AutocompleteService();
      autocompleteService.getPlacePredictions(
        { input: val, componentRestrictions: { country: 'in' } },
        (predictions, status) => {
          if (status === 'OK' && predictions) {
            setSuggestions(
              predictions.map((p) => ({
                label: p.description,
                id: p.place_id,
                source: 'google',
              }))
            );
          }
        }
      );
    } else {
      // OSM Nominatim query
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(val)}&countrycodes=in&limit=5`
        );
        const data = await response.json();
        setSuggestions(
          data.map((item) => ({
            label: item.display_name,
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
            source: 'osm',
          }))
        );
      } catch (err) {
        console.warn('Autocomplete fetch failed:', err);
      }
    }
  };

  const handleSelectSuggestion = async (sugg) => {
    setSearchQuery(sugg.label);
    setSuggestions([]);
    setIsSearching(true);

    if (sugg.source === 'google' && window.google) {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ placeId: sugg.id }, (results, status) => {
        setIsSearching(false);
        if (status === 'OK' && results[0]) {
          const loc = results[0].geometry.location;
          const lat = loc.lat();
          const lng = loc.lng();
          const addr = results[0].formatted_address;
          
          setSelectedCoords([lat, lng]);
          setCurrentCenter([lat, lng]);
          setSelectedAddress(addr);
          if (onLocationSelect) onLocationSelect(lat, lng, addr);
        }
      });
    } else {
      // OSM selection
      setIsSearching(false);
      const lat = sugg.lat;
      const lng = sugg.lng;
      setSelectedCoords([lat, lng]);
      setCurrentCenter([lat, lng]);
      setSelectedAddress(sugg.label);
      if (onLocationSelect) onLocationSelect(lat, lng, sugg.label);
    }
  };

  // Google Maps setup, rendering, and synchronization hook
  useEffect(() => {
    if (mapMode !== 'google' || !googleMapDivRef.current || !window.google) return;

    // Initialize Map Instance
    const mapInstance = new window.google.maps.Map(googleMapDivRef.current, {
      center: { lat: currentCenter[0], lng: currentCenter[1] },
      zoom: zoom,
      styles: [
        {
          featureType: 'administrative',
          elementType: 'labels.text.fill',
          stylers: [{ color: '#1a3a5c' }],
        },
        {
          featureType: 'water',
          elementType: 'geometry',
          stylers: [{ color: '#d0d7e3' }],
        },
      ],
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
    });
    googleMapInstanceRef.current = mapInstance;

    // Interactive picker mode
    if (interactive && selectedCoords) {
      const markerInstance = new window.google.maps.Marker({
        position: { lat: selectedCoords[0], lng: selectedCoords[1] },
        map: mapInstance,
        draggable: true,
        animation: window.google.maps.Animation.DROP,
        title: 'Selected Complaint Location',
      });
      googleMarkerRef.current = markerInstance;

      // Handle marker drag completion
      markerInstance.addListener('dragend', () => {
        const newPos = markerInstance.getPosition();
        handleMapSelection(newPos.lat(), newPos.lng());
      });

      // Handle map clicks
      mapInstance.addListener('click', (e) => {
        const clickedLat = e.latLng.lat();
        const clickedLng = e.latLng.lng();
        markerInstance.setPosition({ lat: clickedLat, lng: clickedLng });
        handleMapSelection(clickedLat, clickedLng);
      });
    }

    // Interactive Markers Rendering
    if (!interactive && markers.length > 0) {
      googleMarkersRef.current = {};
      markers.forEach((m) => {
        const markerColor = getPriorityColor(m.priority);
        const pinIcon = {
          path: 'M12,2C8.13,2,5,5.13,5,9c0,5.25,7,13,7,13s7-7.75,7-13C19,5.13,15.87,2,12,2z M12,11.5c-1.38,0-2.5-1.12-2.5-2.5s1.12-2.5,2.5-2.5 s2.5,1.12,2.5,2.5S13.38,11.5,12,11.5z',
          fillColor: markerColor,
          fillOpacity: 1.0,
          strokeColor: '#FFFFFF',
          strokeWeight: 2,
          scale: 1.5,
          anchor: new window.google.maps.Point(12, 22),
        };

        const mapMarker = new window.google.maps.Marker({
          position: { lat: m.latitude, lng: m.longitude },
          map: mapInstance,
          icon: pinIcon,
          title: m.title || `Incident #${m.id}`,
        });

        // Click actions
        mapMarker.addListener('click', () => {
          if (onMarkerClick) onMarkerClick(m.id);
          
          // Open dynamic info window
          const infoWindow = new window.google.maps.InfoWindow({
            content: `
              <div style="font-family: Inter, sans-serif; padding: 6px 10px; color: #0a2342;">
                <div style="font-weight: 700; font-size: 14px; margin-bottom: 2px;">#CP-${m.id}</div>
                <div style="font-size: 12px; font-weight: 600; color: ${markerColor}; margin-bottom: 6px;">
                  ${m.priority} • ${m.status}
                </div>
                <div style="font-size: 12px; max-width: 200px; color: #5a6a7e; margin-bottom: 6px;">
                  ${m.title}
                </div>
                <div style="font-size: 10px; color: #8896a6;">${m.address || 'Address not listed'}</div>
              </div>
            `,
          });
          infoWindow.open(mapInstance, mapMarker);
        });

        googleMarkersRef.current[m.id] = mapMarker;
      });
    }
  }, [mapMode]);

  // Sync active marker selection focus in Google Maps
  useEffect(() => {
    if (mapMode === 'google' && activeMarkerId && googleMarkersRef.current[activeMarkerId]) {
      const activeMarker = googleMarkersRef.current[activeMarkerId];
      const instance = googleMapInstanceRef.current;
      if (instance && activeMarker) {
        instance.panTo(activeMarker.getPosition());
        instance.setZoom(15);
        window.google.maps.event.trigger(activeMarker, 'click');
      }
    }
  }, [activeMarkerId, mapMode]);

  return (
    <div className={`relative flex flex-col w-full h-full border border-[#d0d7e3] rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 ${className}`}>
      
      {/* Dynamic Overlay Search Component (Visible only when Interactive is True) */}
      {interactive && (
        <div className="absolute top-4 left-4 right-4 z-[9999] flex flex-col gap-1 max-w-md">
          <div className="flex items-center gap-2 px-3 py-2.5 bg-white/95 backdrop-blur-md border border-[#d0d7e3] rounded-xl shadow-lg">
            <Search className="w-5 h-5 text-[#5a6a7e] flex-shrink-0" />
            <input
              type="text"
              placeholder="Search ward or location in India..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full text-sm font-medium text-[#0d1b2a] bg-transparent border-none outline-none placeholder-[#8896a6]"
            />
            {isSearching && <Loader className="w-4 h-4 text-[#c6a227] animate-spin" />}
            <button
              type="button"
              onClick={handleGetLocation}
              disabled={isLocating}
              className="p-1 text-[#0a2342] hover:text-[#c6a227] hover:bg-[#f8f9fc] rounded-lg transition-colors flex-shrink-0"
              title="Get My Live Location"
            >
              <Navigation className={`w-5 h-5 ${isLocating ? 'animate-pulse text-[#c6a227]' : ''}`} />
            </button>
          </div>

          {/* Autocomplete list suggestions */}
          {suggestions.length > 0 && (
            <div className="flex flex-col max-h-56 bg-white/95 backdrop-blur-md border border-[#d0d7e3] rounded-xl shadow-xl overflow-y-auto animate-fade-in">
              {suggestions.map((sugg, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectSuggestion(sugg)}
                  className="flex items-start gap-2.5 px-3 py-2.5 text-left text-xs font-semibold text-[#0d1b2a] hover:bg-[#c6a227]/10 border-b border-[#eef1f6] last:border-none transition-colors"
                >
                  <MapPin className="w-4 h-4 text-[#c6a227] flex-shrink-0 mt-0.5" />
                  <span>{sugg.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Render Loader State */}
      {mapMode === 'loading' && (
        <div style={{ height }} className="flex flex-col items-center justify-center bg-[#f8f9fc] gap-3">
          <Loader className="w-8 h-8 text-[#0a2342] animate-spin" />
          <span className="text-xs font-bold text-[#5a6a7e] uppercase tracking-wider">
            Initializing Live Telemetry Mapping...
          </span>
        </div>
      )}

      {/* Google Maps Container */}
      {mapMode === 'google' && (
        <div ref={googleMapDivRef} style={{ height }} className="w-full bg-[#f8f9fc]" />
      )}

      {/* Leaflet + OpenStreetMap + nominatim Fallback Mode */}
      {mapMode === 'leaflet' && (
        <div style={{ height, zIndex: 1 }} className="w-full relative">
          <MapContainer
            center={currentCenter}
            zoom={zoom}
            scrollWheelZoom={true}
            style={{ height: '100%', width: '100%' }}
          >
            {/* Minimalist CartoDB Light basemap tiles for high-fidelity aesthetics */}
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />
            
            {/* Handle dynamic center panning updates */}
            <ChangeMapView center={currentCenter} />
            
            {/* Map click listener */}
            <MapEvents onClick={handleMapSelection} interactive={interactive} />

            {/* Interactive single draggable complaint pin */}
            {interactive && selectedCoords && (
              <Marker
                position={selectedCoords}
                draggable={true}
                icon={createCustomLeafletIcon('#c6a227')}
                eventHandlers={{
                  dragend: (e) => {
                    const marker = e.target;
                    const position = marker.getLatLng();
                    handleMapSelection(position.lat, position.lng);
                  },
                }}
              >
                <Popup className="gov-popup">
                  <div className="font-sans text-xs p-1">
                    <p className="font-bold text-[#0a2342] mb-1">Incident Report Pin</p>
                    <p className="text-[#5a6a7e]">{selectedAddress || 'Geocoding active location...'}</p>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Non-interactive Complaint Queue markers */}
            {!interactive && markers.length > 0 &&
              markers.map((m) => {
                const isSelected = activeMarkerId === m.id;
                const markerColor = getPriorityColor(m.priority);
                const markerIcon = createCustomLeafletIcon(markerColor);

                return (
                  <Marker
                    key={m.id}
                    position={[m.latitude, m.longitude]}
                    icon={markerIcon}
                    eventHandlers={{
                      click: () => {
                        if (onMarkerClick) onMarkerClick(m.id);
                      },
                    }}
                  >
                    <Popup autoPan={true}>
                      <div className="font-sans text-xs p-1 text-[#0d1b2a]">
                        <div className="font-bold text-[#0a2342] border-b border-[#eef1f6] pb-1 mb-1 flex items-center justify-between">
                          <span>Complaint #CP-{m.id}</span>
                          <span 
                            style={{ color: markerColor }} 
                            className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 bg-[#f8f9fc] border border-current rounded-md"
                          >
                            {m.priority}
                          </span>
                        </div>
                        <div className="font-semibold mb-1 text-[#0a2342]">{m.title}</div>
                        <div className="text-[10px] text-[#5a6a7e] mb-1.5 line-clamp-2">{m.description}</div>
                        <div className="text-[9px] text-[#8896a6] italic font-medium">{m.address || 'Address unavailable'}</div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
          </MapContainer>
        </div>
      )}

      {/* Selected Address Display Footer */}
      {interactive && selectedAddress && (
        <div className="flex items-center gap-2.5 px-4 py-3 bg-[#f8f9fc] border-t border-[#d0d7e3]">
          <MapPin className="w-5 h-5 text-[#c6a227] flex-shrink-0" />
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-[#8896a6] uppercase tracking-wider">
              Selected Address Location
            </span>
            <span className="text-xs font-semibold text-[#0a2342] line-clamp-1">
              {selectedAddress}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CivicMap;
