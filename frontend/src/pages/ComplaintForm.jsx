import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useComplaints } from '@hooks/useComplaints'
import { useNotification } from '@hooks/useNotification'
import { ROUTES, COMPLAINT_CATEGORIES, COMPLAINT_CATEGORY_MAP } from '@utils/constants'
import CivicMap from '@components/common/CivicMap'
import { fetchWards } from '@api/admin'

export function ComplaintForm() {
  const navigate = useNavigate()
  const { submit } = useComplaints()
  const { success, error: showError } = useNotification()
  const fileInputRef = useRef(null)

  const [currentStep, setCurrentStep] = useState(1)
  const [ticketId, setTicketId] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    ward: '',
    location: '',
    latitude: '',
    longitude: '',
    incidentDate: '',
    incidentTime: '',
    images: [],
    privacyAgree: false
  })

  const [imagePreview, setImagePreview] = useState([])
  const [dbWards, setDbWards] = useState([])

  useEffect(() => {
    const loadWards = async () => {
      try {
        const data = await fetchWards()
        setDbWards(data || [])
      } catch (err) {
        console.error('Failed to load wards:', err)
      }
    }
    loadWards()
  }, [])

  // Euclidean distance helper for ward resolution
  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  const findClosestWard = (lat, lng, wardsList) => {
    if (!wardsList || wardsList.length === 0) return ''
    let closestWardId = ''
    let minDistance = Infinity
    
    wardsList.forEach(w => {
      if (w.latitude && w.longitude) {
        const dist = getDistance(lat, lng, w.latitude, w.longitude)
        if (dist < minDistance) {
          minDistance = dist
          closestWardId = w.id
        }
      }
    })
    
    return closestWardId
  }

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || [])
    
    if (imagePreview.length + files.length > 5) {
      showError('Maximum 5 images allowed')
      return
    }

    const validFiles = files.filter((file) => {
      if (file.size > 5 * 1024 * 1024) {
        showError(`${file.name} is too large (max 5MB)`)
        return false
      }
      return true
    })

    validFiles.forEach((file) => {
      const reader = new FileReader()
      reader.onload = (event) => {
        setImagePreview((prev) => [...prev, { file, preview: event.target.result }])
      }
      reader.readAsDataURL(file)
    })

    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, ...validFiles],
    }))

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleRemoveImage = (index) => {
    setImagePreview((prev) => prev.filter((_, i) => i !== index))
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }))
  }

  const validateStep = (step) => {
    const newErrors = {}
    if (step === 1) {
      if (!formData.title.trim()) newErrors.title = 'Title is required'
      else if (formData.title.trim().length < 5) newErrors.title = 'Title must be at least 5 characters'
      if (!formData.category) newErrors.category = 'Category is required'
    }
    if (step === 2) {
      if (!formData.description.trim()) newErrors.description = 'Description is required'
      else if (formData.description.trim().length < 20) newErrors.description = 'Description must be at least 20 characters'
      if (!formData.ward) newErrors.ward = 'Ward selection is required'
    }
    if (step === 3) {
      // Images are optional - only check privacy agreement
      if (!formData.privacyAgree) newErrors.privacyAgree = 'You must agree to the privacy declaration'
    }
    if (step === 4) {
      // Step 4 is review - no additional validation needed
      return true
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const handleBack = () => {
    setCurrentStep((prev) => prev - 1)
  }

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude.toFixed(6)
          const lng = position.coords.longitude.toFixed(6)
          setFormData((prev) => ({
            ...prev,
            location: `GPS: ${lat}, ${lng}`,
          }))
          success('Location loaded successfully!')
        },
        () => {
          showError('Unable to retrieve location.')
        }
      )
    } else {
      showError('Geolocation is not supported by your browser.')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    // Validate all required steps before submission
    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) return

    setLoading(true)
    try {
      // Map frontend category to backend enum
      const backendCategory = COMPLAINT_CATEGORY_MAP[formData.category] || formData.category
      
      const result = await submit(
        {
          title: formData.title,
          description: formData.description,
          category: backendCategory,
          wardId: formData.ward ? Number(formData.ward) : null,
          location: formData.location || null,
          incidentDate: formData.incidentDate || null,
          incidentTime: formData.incidentTime || null,
          latitude: formData.latitude ? Number(formData.latitude) : null,
          longitude: formData.longitude ? Number(formData.longitude) : null,
        },
        formData.images
      )
      setTicketId(result?.id || 'CP-' + Math.floor(100000 + Math.random() * 900000))
      setIsSuccess(true)
      success('Complaint submitted successfully!')
    } catch (err) {
      showError(err?.message || 'Failed to submit complaint')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }))
    }
  }

  const totalSteps = 4
  const progressPercent = ((currentStep - 1) / (totalSteps - 1)) * 100

  return (
    <div
      style={{ background: 'var(--gov-surface)', minHeight: 'calc(100vh - 56px)' }}
      className="flex flex-col items-center py-10 px-4 md:px-8"
    >
      <div className="w-full max-w-3xl">
        {/* Page header */}
        {!isSuccess && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-sm text-gray-400">chevron_right</span>
              <span className="text-sm text-gray-500">Citizen Portal</span>
              <span className="material-symbols-outlined text-sm text-gray-400">chevron_right</span>
              <span className="text-sm font-semibold" style={{ color: 'var(--gov-navy)' }}>Submit Complaint</span>
            </div>
            <h1 className="text-2xl font-black" style={{ color: 'var(--gov-navy)' }}>New Civic Complaint</h1>
            <p className="text-sm text-gray-500 mt-0.5">Complete all steps to register your complaint with the municipality.</p>
          </div>
        )}
      <div
        className="bg-white border rounded-2xl overflow-hidden"
        style={{ borderColor: 'var(--gov-border)', boxShadow: '0 4px 24px rgba(10,35,66,0.08)' }}
      >
        
        {/* Progress Stepper */}
        {!isSuccess && (
          <div className="px-8 py-6 border-b" style={{ background: 'var(--gov-surface)', borderColor: 'var(--gov-border)' }}>
            <div className="flex items-center max-w-2xl mx-auto">
              {[
                { num: 1, label: 'Incident' },
                { num: 2, label: 'Location' },
                { num: 3, label: 'Attachments' },
                { num: 4, label: 'Review' },
              ].map((s, i) => (
                <>
                  {/* Step dot */}
                  <div key={s.num} className="flex flex-col items-center gap-1.5">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all"
                      style={{
                        background: currentStep > s.num ? 'var(--gov-green-light)' : currentStep === s.num ? 'var(--gov-navy)' : 'white',
                        borderColor: currentStep >= s.num ? (currentStep > s.num ? 'var(--gov-green-light)' : 'var(--gov-navy)') : 'var(--gov-border)',
                        color: currentStep >= s.num ? 'white' : 'var(--gov-text-muted)',
                      }}
                    >
                      {currentStep > s.num ? (
                        <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                      ) : s.num}
                    </div>
                    <span
                      className="text-[11px] font-bold"
                      style={{ color: currentStep >= s.num ? 'var(--gov-navy)' : 'var(--gov-text-light)' }}
                    >
                      {s.label}
                    </span>
                  </div>
                  {/* Connector */}
                  {i < 3 && (
                    <div
                      className="flex-1 h-0.5 mx-2 transition-all"
                      style={{ background: currentStep > s.num ? 'var(--gov-green-light)' : 'var(--gov-border)' }}
                    />
                  )}
                </>
              ))}
            </div>
          </div>
        )}

        {/* Content Canvas */}
        <div className="p-8 min-h-[420px] text-left">
          {isSuccess ? (
            /* Success State */
            <div className="flex flex-col items-center justify-center text-center py-12 space-y-5 animate-scale-in">
              <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: 'var(--gov-green-light)' }}>
                <span className="material-symbols-outlined text-5xl text-white" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              </div>
              <div>
                <h2 className="text-2xl font-black mb-2" style={{ color: 'var(--gov-navy)' }}>Complaint Submitted!</h2>
                <p className="text-gray-500 mb-4">Your complaint has been registered and routed to the appropriate department.</p>
                <div
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border-2 text-lg font-black"
                  style={{ borderColor: 'var(--gov-navy)', color: 'var(--gov-navy)', background: 'rgba(10,35,66,0.04)' }}
                >
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>confirmation_number</span>
                  Ticket #{ticketId}
                </div>
              </div>
              <div className="flex gap-3 mt-2">
                <button 
                  onClick={() => {
                    setFormData({
                      title: '',
                      description: '',
                      category: '',
                      ward: '',
                      location: '',
                      incidentDate: '',
                      incidentTime: '',
                      images: [],
                      privacyAgree: false
                    });
                    setImagePreview([]);
                    setIsSuccess(false);
                    setCurrentStep(1);
                  }}
                  className="gov-btn-outline text-sm font-bold px-6 py-2.5 rounded-xl"
                >
                  Submit Another
                </button>
                <button
                  className="gov-btn-primary text-sm font-bold px-6 py-2.5 rounded-xl"
                  onClick={() => navigate(ROUTES.CITIZEN.DASHBOARD)}
                >
                  <span className="material-symbols-outlined text-sm">dashboard</span>
                  View Dashboard
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              
              {/* STEP 1: Incident Details */}
              {currentStep === 1 && (
                <div className="space-y-lg">
                  <div className="space-y-xs">
                    <h2 className="font-headline-md text-headline-md text-primary font-bold">Incident Details</h2>
                    <p className="text-on-surface-variant">Provide a brief title and categorize the issue you're reporting.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
                    
                    <div className="flex flex-col gap-xs">
                      <label className="font-label-lg" htmlFor="title">Title *</label>
                      <input 
                        className={`w-full h-12 px-md border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all ${errors.title ? 'border-error' : 'border-outline'}`}
                        id="title" 
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="e.g., Large pothole on Main St" 
                        required 
                        disabled={loading}
                        type="text"
                      />
                      {errors.title && <p className="text-error font-label-md">{errors.title}</p>}
                    </div>

                    <div className="flex flex-col gap-xs">
                      <label className="font-label-lg" htmlFor="category">Category *</label>
                      <select 
                        className={`w-full h-12 px-md border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all bg-white ${errors.category ? 'border-error' : 'border-outline'}`}
                        id="category" 
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        required
                        disabled={loading}
                      >
                        <option value="">Select Category</option>
                        {categories.map((c) => (
                          <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                      </select>
                      {errors.category && <p className="text-error font-label-md">{errors.category}</p>}
                    </div>

                    <div className="flex flex-col gap-xs">
                      <label className="font-label-lg" htmlFor="incidentDate">Date Observed</label>
                      <input 
                        className="w-full h-12 px-md border border-outline rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all bg-white" 
                        id="incidentDate" 
                        name="incidentDate"
                        value={formData.incidentDate}
                        onChange={handleChange}
                        type="date"
                        disabled={loading}
                      />
                    </div>

                    <div className="flex flex-col gap-xs">
                      <label className="font-label-lg" htmlFor="incidentTime">Time Observed (Approx)</label>
                      <input 
                        className="w-full h-12 px-md border border-outline rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all bg-white" 
                        id="incidentTime" 
                        name="incidentTime"
                        value={formData.incidentTime}
                        onChange={handleChange}
                        type="time"
                        disabled={loading}
                      />
                    </div>

                  </div>
                </div>
              )}

              {/* STEP 2: Location & Description */}
              {currentStep === 2 && (
                <div className="space-y-lg">
                  <div className="space-y-xs">
                    <h2 className="font-headline-md text-headline-md text-primary font-bold">Location &amp; Description</h2>
                    <p className="text-on-surface-variant">Tell us exactly where this is happening and give us more context.</p>
                  </div>
                  
                  <div className="w-full h-[350px] rounded-xl overflow-hidden border border-outline-variant relative">
                    <CivicMap
                      center={[12.9716, 77.5946]}
                      zoom={12}
                      interactive={true}
                      onLocationSelect={(lat, lng, address) => {
                        setFormData((prev) => {
                          const updated = {
                            ...prev,
                            location: address,
                            latitude: lat,
                            longitude: lng,
                          }
                          // Automatically resolve closest ward if we have loaded dbWards
                          if (dbWards.length > 0) {
                            const closestWardId = findClosestWard(lat, lng, dbWards)
                            if (closestWardId) {
                              updated.ward = closestWardId.toString()
                            }
                          }
                          return updated
                        })
                        if (errors.ward) {
                          setErrors((prev) => ({ ...prev, ward: '' }))
                        }
                      }}
                      height="350px"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
                    <div className="flex flex-col gap-xs">
                      <label className="font-label-lg" htmlFor="ward">Ward/Area *</label>
                      <select 
                        className={`w-full h-12 px-md border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all bg-white ${errors.ward ? 'border-error' : 'border-outline'}`}
                        id="ward" 
                        name="ward"
                        value={formData.ward}
                        onChange={handleChange}
                        required
                        disabled={loading}
                      >
                        <option value="">Select Ward</option>
                        {dbWards.map((w) => (
                          <option key={w.id} value={w.id.toString()}>{w.name}</option>
                        ))}
                      </select>
                      {errors.ward && <p className="text-error font-label-md">{errors.ward}</p>}
                    </div>

                    <div className="flex flex-col gap-xs">
                      <label className="font-label-lg" htmlFor="location">Specific Street Address / GPS</label>
                      <input 
                        className="w-full h-12 px-md border border-outline rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all" 
                        id="location" 
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        placeholder="e.g. 123 Civic Plaza or corner of Oak & 5th" 
                        disabled={loading}
                        type="text"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-xs">
                    <label className="font-label-lg" htmlFor="description">Detailed Description *</label>
                    <textarea 
                      className={`w-full p-md border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all ${errors.description ? 'border-error' : 'border-outline'}`}
                      id="description" 
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Describe the severity and any immediate hazards..." 
                      required 
                      disabled={loading}
                      rows="4"
                    ></textarea>
                    {errors.description && <p className="text-error font-label-md">{errors.description}</p>}
                  </div>
                </div>
              )}

              {/* STEP 3: Attachments & Privacy */}
              {currentStep === 3 && (
                <div className="space-y-lg">
                  <div className="space-y-xs">
                    <h2 className="font-headline-md text-headline-md text-primary font-bold">Attachments &amp; Privacy</h2>
                    <p className="text-on-surface-variant">Photos help us resolve issues faster. Your privacy is important to us.</p>
                  </div>
                  
                  <div 
                    className={`border-2 border-dashed rounded-xl p-xl flex flex-col items-center justify-center gap-md bg-surface-container-low hover:bg-surface-container transition-colors cursor-pointer group ${errors.images ? 'border-red-300 bg-red-50' : 'border-outline-variant'}`}
                    onClick={() => !loading && fileInputRef.current?.click()}
                  >
                    <span className="material-symbols-outlined text-primary text-[48px]">cloud_upload</span>
                    <div className="text-center">
                      <p className="font-headline-sm text-on-surface font-semibold">Click to upload or drag and drop</p>
                      <p className="text-on-surface-variant font-label-md">PNG, JPG or GIF up to 5MB (max 5 photos)</p>
                    </div>
                    <button 
                      className="px-lg py-sm border border-primary text-primary rounded-lg font-label-lg hover:bg-primary hover:text-on-primary transition-all cursor-pointer" 
                      type="button"
                    >
                      Select Files
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageChange}
                      disabled={loading}
                      className="hidden"
                    />
                  </div>

                  {errors.images && <p className="text-error font-label-md">{errors.images}</p>}

                  {/* Image Preview Grid */}
                  {imagePreview.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-md">
                      {imagePreview.map((img, index) => (
                        <div key={index} className="relative group rounded-lg overflow-hidden border border-outline-variant">
                          <img
                            src={img.preview}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-24 object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            className="absolute top-1 right-1 bg-error text-white rounded-full p-1 hover:opacity-90 transition-opacity cursor-pointer flex items-center justify-center"
                            disabled={loading}
                          >
                            <span className="material-symbols-outlined text-[16px]">close</span>
                          </button>
                          <p className="text-[10px] text-on-surface-variant p-1 truncate bg-white">{img.file.name}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="bg-secondary-container rounded-xl p-md flex gap-md items-start">
                    <span className="material-symbols-outlined text-on-secondary-container pt-xs">verified_user</span>
                    <div className="flex flex-col gap-xs">
                      <label className="flex items-center gap-sm cursor-pointer select-none">
                        <input 
                          className="w-5 h-5 rounded border-outline text-primary focus:ring-primary cursor-pointer" 
                          id="privacyAgree" 
                          name="privacyAgree"
                          checked={formData.privacyAgree}
                          onChange={handleChange}
                          required 
                          disabled={loading}
                          type="checkbox"
                        />
                        <span className="font-label-lg text-on-secondary-container font-semibold">I agree to the privacy policy and terms of submission.</span>
                      </label>
                      <p className="font-label-md text-on-secondary-container opacity-80">Your contact info will only be used to update you on this report's status.</p>
                      {errors.privacyAgree && <p className="text-red-700 font-label-md font-bold mt-1">{errors.privacyAgree}</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: Review & Submit */}
              {currentStep === 4 && (
                <div className="space-y-lg">
                  <div className="space-y-xs">
                    <h2 className="font-headline-md text-headline-md text-primary font-bold">Review Submission</h2>
                    <p className="text-on-surface-variant">Double-check your details before official submission to the Department of Works.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                    <div className="p-md rounded-lg bg-surface border border-outline-variant space-y-xs">
                      <span className="text-on-surface-variant font-label-md uppercase tracking-wider block text-xs">Title</span>
                      <p className="font-headline-sm text-primary font-bold">{formData.title || '---'}</p>
                    </div>
                    <div className="p-md rounded-lg bg-surface border border-outline-variant space-y-xs">
                      <span className="text-on-surface-variant font-label-md uppercase tracking-wider block text-xs">Category</span>
                      <p className="font-headline-sm text-primary font-bold">{categories.find(c => c.value === formData.category)?.label || '---'}</p>
                    </div>
                    <div className="p-md rounded-lg bg-surface border border-outline-variant space-y-xs md:col-span-2">
                      <span className="text-on-surface-variant font-label-md uppercase tracking-wider block text-xs">Ward &amp; Specific Location</span>
                      <p className="font-body-md text-on-surface font-semibold">
                        {dbWards.find(w => w.id.toString() === formData.ward)?.name || 'No Ward Selected'}
                        {formData.location ? ` - ${formData.location}` : ''}
                      </p>
                    </div>
                    <div className="p-md rounded-lg bg-surface border border-outline-variant space-y-xs md:col-span-2">
                      <span className="text-on-surface-variant font-label-md uppercase tracking-wider block text-xs">Description</span>
                      <p className="font-body-md text-on-surface whitespace-pre-wrap">{formData.description || '---'}</p>
                    </div>
                  </div>
                  
                  {imagePreview.length > 0 && (
                    <div>
                      <span className="text-on-surface-variant font-label-md uppercase tracking-wider block text-xs mb-2">Uploaded Images ({imagePreview.length})</span>
                      <div className="flex gap-md overflow-x-auto py-1">
                        {imagePreview.map((img, i) => (
                          <img 
                            key={i} 
                            src={img.preview} 
                            alt="Upload preview" 
                            className="h-20 w-20 object-cover rounded-lg border border-outline-variant shrink-0" 
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-sm p-md bg-error-container text-on-error-container rounded-lg border border-error/20">
                    <span className="material-symbols-outlined">report</span>
                    <p className="font-label-md font-medium">Once submitted, this report enters the municipal workflow and cannot be edited immediately.</p>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between items-center border-t border-outline-variant pt-xl">
                <button 
                  className={`flex items-center gap-sm px-xl py-md border border-outline rounded-lg text-primary font-label-lg cursor-pointer hover:bg-surface-container transition-all ${currentStep === 1 ? 'invisible' : ''}`}
                  onClick={handleBack} 
                  type="button"
                  disabled={loading}
                >
                  <span className="material-symbols-outlined">arrow_back</span>
                  Back
                </button>
                <div className="flex items-center gap-md">
                  {currentStep < totalSteps ? (
                    <button 
                      className="flex items-center gap-sm px-xl py-md bg-primary text-on-primary rounded-lg font-label-lg shadow-sm hover:opacity-90 transition-all cursor-pointer" 
                      onClick={handleNext}
                      type="button"
                    >
                      Next Step
                      <span className="material-symbols-outlined">arrow_forward</span>
                    </button>
                  ) : (
                    <button 
                      className="flex items-center gap-sm px-xl py-md bg-primary text-on-primary rounded-lg font-label-lg shadow-sm hover:opacity-90 transition-all cursor-pointer disabled:opacity-50" 
                      type="submit"
                      disabled={loading}
                    >
                      {loading ? 'Submitting...' : 'Submit Complaint'}
                      <span className="material-symbols-outlined">send</span>
                    </button>
                  )}
                </div>
              </div>

            </form>
          )}
        </div>

      </div>

      {/* Info Grid */}
      <div className="w-full mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
        {[
          { icon: 'schedule', title: 'Estimated Response', text: 'Emergency reports are triaged within 4 hours. General maintenance within 3–5 business days.' },
          { icon: 'support_agent', title: 'Need Live Help?', text: 'Call our municipal hotline at 311 for urgent hazards that require immediate intervention.' },
          { icon: 'policy', title: 'Public Transparency', text: 'All valid reports are visible on our Open Data map to ensure neighborhood accountability.' },
        ].map((info, i) => (
          <div key={i} className="p-5 bg-white border rounded-2xl flex flex-col gap-3" style={{ borderColor: 'var(--gov-border)' }}>
            <span className="material-symbols-outlined text-2xl" style={{ color: 'var(--gov-navy)', fontVariationSettings: "'FILL' 1" }}>{info.icon}</span>
            <h4 className="font-bold text-sm" style={{ color: 'var(--gov-navy)' }}>{info.title}</h4>
            <p className="text-sm text-gray-500 leading-relaxed">{info.text}</p>
          </div>
        ))}
      </div>

      </div>
    </div>
  )
}

