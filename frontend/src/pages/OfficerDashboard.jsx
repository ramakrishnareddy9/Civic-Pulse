import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useComplaints } from '@hooks/useComplaints'
import { useAuth } from '@hooks/useAuth'
import { useAuthStore } from '@store/authStore'
import { useNotification } from '@hooks/useNotification'
import { ROUTES } from '@utils/constants'
import { subscribeTopic, disconnectSocket, connectSocket } from '@/services/socket'
import CivicMap from '@components/common/CivicMap'

export function OfficerDashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { fetchOfficerQueue, updateComplaintStatus } = useComplaints()
  const { success, error: showError } = useNotification()

  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    assigned: 0,
    inProgress: 0,
    resolved: 0,
    slaBreaches: 0,
  })

  // Filters and search states
  const [searchTerm, setSearchTerm] = useState('')
  const [filterPriority, setFilterPriority] = useState('all') // 'all', 'high', 'claimed' (in_progress)
  const [selectedComplaintId, setSelectedComplaintId] = useState(null)
  
  // Modal states
  const [selectedComplaint, setSelectedComplaint] = useState(null)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [notes, setNotes] = useState('')
  const [updatingStatus, setUpdatingStatus] = useState(false)

  // Real-time emergency alert alert state
  const [newEmergencyAlert, setNewEmergencyAlert] = useState(null)

  // Sound alert state
  const [soundEnabled, setSoundEnabled] = useState(true)
  const soundEnabledRef = useRef(soundEnabled)

  // Keep ref in sync without triggering re-connections
  useEffect(() => {
    soundEnabledRef.current = soundEnabled
  }, [soundEnabled])

  useEffect(() => {
    loadComplaints()

    // Connect socket with auth token and subscribe to complaint updates
    const { token } = useAuthStore.getState()
    connectSocket(token)
    const unsubscribe = subscribeTopic('/topic/complaints', (msg) => {
      const { type, complaint } = msg || {}
      if (!complaint) return

      // If it's a new critical/high priority complaint, trigger emergency banner
      if (type === 'CREATED' && (complaint.priority === 'CRITICAL' || complaint.priority === 'HIGH')) {
        setNewEmergencyAlert(complaint)
        if (soundEnabledRef.current) {
          playBeep()
        }
      }

      setComplaints((prev) => {
        if (type === 'DELETED') return prev.filter((c) => c.id !== complaint.id)
        const exists = prev.find((p) => p.id === complaint.id)
        if (exists) return prev.map((p) => (p.id === complaint.id ? complaint : p))
        return [complaint, ...prev]
      })
    })

    return () => {
      unsubscribe()
      disconnectSocket()
    }
  }, [])

  // Recalculate stats when complaints list changes
  useEffect(() => {
    if (complaints.length > 0) {
      calculateStats(complaints)
    }
  }, [complaints])

  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
      const oscillator = audioCtx.createOscillator()
      const gainNode = audioCtx.createGain()
      oscillator.connect(gainNode)
      gainNode.connect(audioCtx.destination)
      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime) // A5 note
      gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime)
      oscillator.start()
      oscillator.stop(audioCtx.currentTime + 0.15)
    } catch (e) {
      console.warn('AudioContext beep failed', e)
    }
  }

  const loadComplaints = async () => {
    setLoading(true)
    try {
      const data = await fetchOfficerQueue(user?.email)
      setComplaints(data)
      calculateStats(data)
      if (data.length > 0 && !selectedComplaintId) {
        setSelectedComplaintId(data[0].id)
      }
    } catch (err) {
      showError('Failed to load complaints')
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (data) => {
    setStats({
      assigned: data.filter((c) => c.status === 'OPEN').length,
      inProgress: data.filter((c) => c.status === 'IN_PROGRESS').length,
      resolved: data.filter((c) => c.status === 'RESOLVED').length,
      slaBreaches: data.filter((c) => {
        if (!c.slaDueDate) return false
        const due = new Date(c.slaDueDate)
        if (isNaN(due.getTime())) return false
        return new Date() > due && c.status !== 'RESOLVED' && c.status !== 'CLOSED'
      }).length,
    })
  }

  const handleClaim = async (complaint, e) => {
    e.stopPropagation()
    setUpdatingStatus(true)
    try {
      await updateComplaintStatus(complaint.id, 'IN_PROGRESS', 'Claimed from dispatch queue')
      success('Ticket claimed successfully!')
      setComplaints((prev) =>
        prev.map((c) =>
          c.id === complaint.id
            ? { ...c, status: 'IN_PROGRESS', assignedTo: user?.fullName || user?.email }
            : c
        )
      )
    } catch (err) {
      showError('Failed to claim complaint')
    } finally {
      setUpdatingStatus(false)
    }
  }

  const handleStatusChangeClick = (complaint, e) => {
    e.stopPropagation()
    setSelectedComplaint(complaint)
    setNewStatus(complaint.status)
    setNotes(complaint.officerNotes || '')
    setShowStatusModal(true)
  }

  const submitStatusUpdate = async () => {
    if (!newStatus) {
      showError('Please select a status')
      return
    }

    setUpdatingStatus(true)
    try {
      await updateComplaintStatus(selectedComplaint.id, newStatus, notes)
      success('Complaint status updated successfully')

      // Update local state
      setComplaints((prev) =>
        prev.map((c) =>
          c.id === selectedComplaint.id
            ? { ...c, status: newStatus, officerNotes: notes }
            : c
        )
      )

      setShowStatusModal(false)
      setSelectedComplaint(null)
    } catch (err) {
      showError('Failed to update status')
    } finally {
      setUpdatingStatus(false)
    }
  }

  const activeComplaint = complaints.find(c => c.id === selectedComplaintId) || complaints[0]

  const mapCenter = activeComplaint && activeComplaint.latitude && activeComplaint.longitude
    ? [activeComplaint.latitude, activeComplaint.longitude]
    : [12.9716, 77.5946]

  const filteredComplaints = complaints.filter((c) => {
    // Priority filter (High means Critical or High, Claimed means IN_PROGRESS status)
    if (filterPriority === 'high' && c.priority !== 'CRITICAL' && c.priority !== 'HIGH') return false
    if (filterPriority === 'claimed' && c.status !== 'IN_PROGRESS') return false

    // Search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      const matchesTitle = c.title.toLowerCase().includes(term)
      const matchesId = `CP-${c.id}`.toLowerCase().includes(term) || String(c.id).includes(term)
      const matchesWard = c.ward && c.ward.toLowerCase().includes(term)
      if (!matchesTitle && !matchesId && !matchesWard) return false
    }

    return true
  })

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return 'Pending'
    const d = new Date(dateString)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const getPriorityClasses = (priority) => {
    switch (priority) {
      case 'CRITICAL':
      case 'HIGH':
        return {
          border: 'border-l-4 border-error',
          badge: 'bg-error-container text-on-error-container',
          pin: 'text-error',
          label: 'High Priority'
        }
      case 'MEDIUM':
        return {
          border: 'border-l-4 border-l-amber-500',
          badge: 'bg-amber-100 text-amber-800',
          pin: 'text-amber-500',
          label: 'Med Priority'
        }
      case 'LOW':
      default:
        return {
          border: 'border-l-4 border-l-slate-400',
          badge: 'bg-surface-container-highest text-on-surface-variant',
          pin: 'text-secondary',
          label: 'Low Priority'
        }
    }
  }

  return (
    <div style={{ background: 'var(--gov-surface)', color: 'var(--gov-text)', minHeight: 'calc(100vh - 56px)' }} className="flex flex-col overflow-hidden font-body-md relative">
      
      {/* Styles for pulse ring and active borders */}
      <style dangerouslySetInnerHTML={{__html: `
        .pulse-ring-active {
          animation: pulse-ring 1.5s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.4); opacity: 0.8; }
          80%, 100% { transform: scale(1.6); opacity: 0; }
        }
        .incident-card-active {
          box-shadow: 0 0 0 2px #002046 inset;
          background-color: #f4f3f7;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #c4c6cf;
          border-radius: 3px;
        }
      `}} />

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 px-4 py-3 border-b" style={{ background: 'white', borderColor: 'var(--gov-border)' }}>
        {[
          { label: 'Open Queue', value: stats.assigned, icon: 'inbox', color: '#d97706', bg: '#fef3c7' },
          { label: 'In Progress', value: stats.inProgress, icon: 'autorenew', color: '#1e40af', bg: '#dbeafe' },
          { label: 'Resolved', value: stats.resolved, icon: 'check_circle', color: '#166534', bg: '#dcfce7' },
          { label: 'SLA Breaches', value: stats.slaBreaches, icon: 'warning', color: '#991b1b', bg: '#fee2e2' },
        ].map((s, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-xl border" style={{ borderColor: 'var(--gov-border)' }}>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: s.bg }}>
              <span className="material-symbols-outlined text-lg" style={{ color: s.color, fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
            </div>
            <div>
              <p className="text-xl font-black leading-none" style={{ color: 'var(--gov-navy)' }}>{s.value}</p>
              <p className="text-xs text-gray-500 font-medium">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Split-Screen Panel Container */}
      <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 56px - 80px - 40px)' }}>
        
        {/* LEFT COLUMN: Queue & Controls */}
        <div className="w-full lg:w-1/2 flex flex-col border-r" style={{ borderColor: 'var(--gov-border)', background: 'white', position: 'relative', zIndex: 10 }}>
          
          {/* Header Controls, Search & Filter Toggles */}
          <div className="p-3 border-b flex flex-col gap-3 sticky top-0 shadow-sm" style={{ background: 'white', borderColor: 'var(--gov-border)', zIndex: 20 }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-sm">
                <span className="material-symbols-outlined text-primary text-2xl">triage</span>
                <h1 className="font-headline-md text-headline-md font-bold text-primary">Incident Triage Queue</h1>
              </div>
              <div className="flex items-center gap-sm">
                {/* Audio ping toggle */}
                <div className="flex items-center gap-xs px-sm py-xs border border-outline-variant rounded-full bg-surface">
                  <span className="material-symbols-outlined text-on-surface-variant text-sm">
                    {soundEnabled ? 'volume_up' : 'volume_off'}
                  </span>
                  <button 
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors duration-200 ${soundEnabled ? 'bg-primary' : 'bg-outline-variant'}`}
                  >
                    <span className={`inline-block h-2.5 w-2.5 rounded-full bg-white transition-transform duration-200 ${soundEnabled ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
                  </button>
                </div>
                <button 
                  onClick={loadComplaints}
                  className="p-sm hover:bg-surface-container rounded-full text-on-surface-variant transition-colors flex items-center justify-center border border-outline-variant cursor-pointer"
                  title="Refresh Queue"
                >
                  <span className="material-symbols-outlined text-[18px]">sync</span>
                </button>
              </div>
            </div>

            {/* Quick Filter Counts */}
            <div className="flex flex-wrap gap-xs items-center justify-between">
              <div className="flex gap-xs">
                <button 
                  onClick={() => setFilterPriority('all')}
                  className={`px-md py-xs rounded-full text-xs font-bold font-label-lg transition-all ${filterPriority === 'all' ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}`}
                >
                  All ({complaints.length})
                </button>
                <button 
                  onClick={() => setFilterPriority('high')}
                  className={`px-md py-xs rounded-full text-xs font-bold font-label-lg transition-all ${filterPriority === 'high' ? 'bg-error text-on-error' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}`}
                >
                  High ({complaints.filter(c => c.priority === 'CRITICAL' || c.priority === 'HIGH').length})
                </button>
                <button 
                  onClick={() => setFilterPriority('claimed')}
                  className={`px-md py-xs rounded-full text-xs font-bold font-label-lg transition-all ${filterPriority === 'claimed' ? 'bg-secondary-container text-on-secondary-container' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}`}
                >
                  Claimed ({complaints.filter(c => c.status === 'IN_PROGRESS').length})
                </button>
              </div>
              <span className="text-[11px] font-medium text-outline italic">
                Active: {stats.assigned + stats.inProgress} tickets
              </span>
            </div>

            {/* Search Input Bar */}
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-md pointer-events-none">search</span>
              <input 
                type="text" 
                placeholder="Search incident list by title, ID, ward..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-sm bg-surface border border-outline-variant focus:border-primary rounded-lg text-body-md outline-none transition-all placeholder:text-outline"
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              )}
            </div>
          </div>

          {/* Real-time Emergency Alert Banner Component */}
          <AnimatePresence>
            {newEmergencyAlert && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="bg-error-container text-on-error-container px-md py-sm border-b border-error flex items-center justify-between overflow-hidden shadow-inner relative z-30"
              >
                <div className="flex items-center gap-md">
                  <div className="relative flex h-3 w-3 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-error" />
                  </div>
                  <div className="text-left">
                    <p className="font-label-lg text-xs uppercase font-bold tracking-wider">New Incoming Incident</p>
                    <p className="font-bold text-sm truncate max-w-[240px] md:max-w-xs">{newEmergencyAlert.title}</p>
                  </div>
                </div>
                <div className="flex gap-xs">
                  <button 
                    onClick={() => {
                      setSelectedComplaintId(newEmergencyAlert.id)
                      setNewEmergencyAlert(null)
                    }}
                    className="bg-error text-on-error font-label-lg px-md py-xs rounded text-xs font-bold cursor-pointer"
                  >
                    Triage
                  </button>
                  <button 
                    onClick={() => setNewEmergencyAlert(null)}
                    className="p-xs text-on-error-container hover:bg-error-container/20 rounded"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* SCROLLABLE LIST OF TICKETS */}
          <div className="flex-grow overflow-y-auto custom-scrollbar p-md flex flex-col gap-sm">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-outline">
                <span className="material-symbols-outlined text-4xl animate-spin mb-sm">sync</span>
                <p className="text-body-md font-semibold">Fetching triaged dispatches...</p>
              </div>
            ) : filteredComplaints.length === 0 ? (
              <div className="text-center py-20 text-on-surface-variant flex flex-col items-center justify-center">
                <span className="material-symbols-outlined text-4xl text-outline mb-sm">inbox</span>
                <p className="font-bold text-headline-sm">No incidents match selection</p>
                <p className="text-xs text-outline mt-xs">Check other status queues or adjust search criteria.</p>
              </div>
            ) : (
              filteredComplaints.map((complaint) => {
                const isSelected = complaint.id === selectedComplaintId
                const priorityStyles = getPriorityClasses(complaint.priority)
                const isSlaBreached = complaint.slaDueDate && !isNaN(new Date(complaint.slaDueDate).getTime()) && new Date() > new Date(complaint.slaDueDate) && complaint.status !== 'RESOLVED' && complaint.status !== 'CLOSED'

                return (
                  <div
                    key={complaint.id}
                    onClick={() => setSelectedComplaintId(complaint.id)}
                    className={`p-md border border-outline-variant bg-white rounded-lg hover:border-primary transition-all duration-150 cursor-pointer flex flex-col gap-sm text-left relative ${priorityStyles.border} ${isSelected ? 'incident-card-active' : ''}`}
                  >
                    {/* Header tags */}
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-xs flex-wrap">
                        <span className={`px-sm py-0.5 rounded text-[10px] font-bold uppercase ${priorityStyles.badge}`}>
                          {priorityStyles.label}
                        </span>
                        <span className="text-[10px] text-outline font-bold">#CP-{complaint.id}</span>
                        {isSlaBreached && (
                          <span className="px-sm py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded flex items-center gap-xs">
                            <span className="material-symbols-outlined text-[10px] font-bold">warning</span> SLA BREACH
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-outline font-medium">
                        {new Date(complaint.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {/* Content */}
                    <div>
                      <h3 className="font-headline-sm text-md font-bold text-primary mb-xs hover:underline" onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/officer/complaints/${complaint.id}`)
                      }}>
                        {complaint.title}
                      </h3>
                      <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed">
                        {complaint.description}
                      </p>
                    </div>

                    {/* Metadata and dispatch actions */}
                    <div className="flex items-center justify-between border-t border-outline-variant/60 pt-sm mt-xs flex-wrap gap-sm">
                      <div className="flex gap-sm items-center text-[11px] text-on-surface-variant font-medium">
                        <span className="flex items-center gap-xs">
                          <span className="material-symbols-outlined text-sm">home_work</span>
                          {complaint.ward || 'General'}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-xs">
                          <span className="material-symbols-outlined text-sm">category</span>
                          {complaint.category}
                        </span>
                      </div>
                      <div className="flex gap-xs items-center">
                        {complaint.status === 'OPEN' ? (
                          <button 
                            onClick={(e) => handleClaim(complaint, e)}
                            disabled={updatingStatus}
                            className="px-md py-sm bg-primary text-on-primary text-xs font-bold rounded hover:opacity-90 transition-opacity cursor-pointer shadow-sm flex items-center gap-xs"
                          >
                            <span className="material-symbols-outlined text-sm">assignment_turned_in</span> Claim
                          </button>
                        ) : (
                          <div className="flex gap-xs items-center">
                            <span className="px-sm py-0.5 rounded bg-secondary-container text-on-secondary-container font-bold text-[10px]">
                              CLAIMED
                            </span>
                            <button 
                              onClick={(e) => handleStatusChangeClick(complaint, e)}
                              disabled={updatingStatus}
                              className="px-sm py-sm border border-primary text-primary hover:bg-primary hover:text-on-primary text-xs font-bold rounded transition-colors cursor-pointer"
                            >
                              Update
                            </button>
                          </div>
                        )}
                        <button 
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate(`/officer/complaints/${complaint.id}`)
                          }}
                          className="p-sm border border-outline-variant hover:bg-surface-container text-on-surface-variant rounded flex items-center justify-center cursor-pointer"
                          title="View Case File"
                        >
                          <span className="material-symbols-outlined text-[16px]">visibility</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: GIS Interactive Digital Map Frame */}
        <div className="hidden lg:block w-1/2 relative bg-surface-dim overflow-hidden z-10">
          
          <CivicMap
            center={mapCenter}
            zoom={13}
            interactive={false}
            markers={filteredComplaints.filter(c => c.latitude && c.longitude)}
            activeMarkerId={selectedComplaintId}
            onMarkerClick={(id) => setSelectedComplaintId(id)}
            height="100%"
          />

          {/* TOP-LEFT FLOATING MAP LEGEND */}
          <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md p-4 rounded-xl border border-[#d0d7e3] shadow-xl z-[999] w-52 text-left">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-primary text-[18px]">hub</span>
              <h4 className="text-xs font-bold text-primary uppercase tracking-wider">Regional Dispatch units</h4>
            </div>
            <div className="flex flex-col gap-2 border-t border-[#eef1f6] pt-2">
              <div className="flex items-center justify-between text-[11px] font-semibold text-[#5a6a7e]">
                <span>Main Ward Crew 1</span>
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
              </div>
              <div className="flex items-center justify-between text-[11px] font-semibold text-[#5a6a7e]">
                <span>Emergency Repair Unit</span>
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              </div>
              <div className="flex items-center justify-between text-[11px] font-semibold text-[#5a6a7e]">
                <span>Road Ops Team B</span>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              </div>
            </div>
          </div>

          {/* FLOATING QUICK SUMMARY OF ACTIVE SELECTION */}
          {activeComplaint && (
            <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-md p-4 rounded-xl border border-primary/20 shadow-2xl z-[999] max-w-sm text-left flex gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center shrink-0 border border-primary/10 text-primary">
                <span className="material-symbols-outlined text-2xl">info</span>
              </div>
              <div>
                <span className="text-[9px] text-[#8896a6] font-bold uppercase tracking-wider">Currently Triaged Target</span>
                <h4 className="text-xs font-bold text-primary mt-1 line-clamp-1">{activeComplaint.title}</h4>
                <p className="text-[11px] text-[#5a6a7e] mt-1 line-clamp-2 leading-relaxed">{activeComplaint.description}</p>
                <div className="flex items-center gap-3 mt-3">
                  <button 
                    onClick={() => navigate(`/officer/complaints/${activeComplaint.id}`)}
                    className="text-[11px] font-black text-primary hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    Open Case File <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* DASHBOARD BOTTOM STATUS BAR */}
      <footer
        className="h-10 px-4 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest shrink-0 select-none"
        style={{ background: 'var(--gov-navy-dark)', color: 'rgba(255,255,255,0.7)' }}
      >
        <div className="flex gap-4 items-center">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            DISPATCH SYSTEM ACTIVE
          </span>
          <span className="hidden md:inline text-white/50">OFFICER: {user?.fullName || user?.email}</span>
        </div>
        <div className="flex gap-4">
          <span className="flex items-center gap-1.5" style={{ color: stats.slaBreaches > 0 ? '#fca5a5' : 'rgba(255,255,255,0.5)' }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: stats.slaBreaches > 0 ? '#ef4444' : 'rgba(255,255,255,0.3)' }} />
            SLA BREACHES: {stats.slaBreaches}
          </span>
          <span className="flex items-center gap-1.5 text-amber-300">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            IN PROGRESS: {stats.inProgress}
          </span>
        </div>
      </footer>

      {/* MODAL FOR STATUS UPDATE & NOTES */}
      {showStatusModal && selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
            onClick={() => setShowStatusModal(false)}
          />
          <div className="bg-white p-xl rounded-xl shadow-2xl max-w-md w-full z-10 text-left border border-outline-variant animate-in fade-in zoom-in-95 duration-150 mui-card-shadow">
            <div className="flex items-center gap-sm mb-md">
              <span className="material-symbols-outlined text-primary text-xl">edit_note</span>
              <h3 className="font-headline-md text-headline-md text-primary font-bold">Update Complaint Status</h3>
            </div>
            
            <div className="space-y-md mb-lg">
              <div>
                <p className="text-xs text-outline font-bold uppercase mb-xs">Incident Target</p>
                <p className="font-body-md font-semibold text-primary">{selectedComplaint.title}</p>
                <p className="text-xs text-on-surface-variant mt-xs">Current Status: <span className="font-bold">{selectedComplaint.status}</span></p>
              </div>

              <div>
                <label className="block text-xs font-bold text-outline uppercase mb-sm">Select New Status</label>
                <select 
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full p-md border border-outline-variant focus:border-primary rounded-lg bg-white outline-none font-body-md"
                  disabled={updatingStatus}
                >
                  <option value="OPEN">Open / Unresolved</option>
                  <option value="IN_PROGRESS">Work In Progress</option>
                  <option value="RESOLVED">Resolved (Completed)</option>
                  <option value="CLOSED">Closed (Archived)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-outline uppercase mb-sm">Add Officer Note (Required)</label>
                <textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-lg border border-outline-variant focus:border-primary font-body-md p-md h-28 resize-none outline-none" 
                  placeholder="Provide brief details on work performed, current dispatch status, or next steps..."
                  maxLength={500}
                  disabled={updatingStatus}
                />
                <p className="text-[10px] text-right text-outline">{notes.length}/500 chars</p>
              </div>
            </div>

            <div className="flex gap-md">
              <button 
                onClick={() => setShowStatusModal(false)}
                className="w-full py-md border border-outline-variant hover:bg-surface-container rounded-lg font-label-lg font-bold text-on-surface transition-colors cursor-pointer"
                disabled={updatingStatus}
              >
                Cancel
              </button>
              <button 
                onClick={submitStatusUpdate}
                className="w-full py-md bg-primary text-on-primary hover:opacity-90 rounded-lg font-label-lg font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-xs cursor-pointer shadow-sm"
                disabled={updatingStatus || !notes.trim()}
              >
                {updatingStatus ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-sm">sync</span> Saving...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm font-bold">check</span> Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
