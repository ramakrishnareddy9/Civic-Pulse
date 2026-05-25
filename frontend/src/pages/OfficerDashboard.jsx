import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useComplaints } from '@hooks/useComplaints'
import { useAuth } from '@hooks/useAuth'
import { useNotification } from '@hooks/useNotification'
import { ROUTES } from '@utils/constants'
import { subscribeTopic, disconnectSocket, connectSocket } from '@/services/socket'

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

  useEffect(() => {
    loadComplaints()

    // Connect socket with auth token and subscribe to complaint updates
    const token = localStorage.getItem('token')
    connectSocket(token)
    const unsubscribe = subscribeTopic('/topic/complaints', (msg) => {
      const { type, complaint } = msg || {}
      if (!complaint) return

      // If it's a new critical/high priority complaint, trigger emergency banner
      if (type === 'CREATED' && (complaint.priority === 'CRITICAL' || complaint.priority === 'HIGH')) {
        setNewEmergencyAlert(complaint)
        if (soundEnabled) {
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
  }, [soundEnabled])

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
        const isSlaBreach = new Date() > new Date(c.slaDueDate)
        return isSlaBreach && c.status !== 'RESOLVED' && c.status !== 'CLOSED'
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

  // Generate deterministic mock coordinates for visual GIS plotting
  const getMockCoordinates = (id) => {
    const top = ((id * 17) % 55) + 20
    const left = ((id * 31) % 65) + 15
    return { top: `${top}%`, left: `${left}%` }
  }

  const activeComplaint = complaints.find(c => c.id === selectedComplaintId) || complaints[0]

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
    <div className="bg-surface text-on-surface flex flex-col h-[calc(100vh-64px)] overflow-hidden font-body-md relative">
      
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

      {/* Main Split-Screen Panel Container */}
      <div className="flex flex-grow overflow-hidden">
        
        {/* LEFT COLUMN: Queue & Controls */}
        <div className="w-full lg:w-1/2 flex flex-col border-r border-outline-variant bg-surface relative z-10">
          
          {/* Header Controls, Search & Filter Toggles */}
          <div className="p-md bg-white border-b border-outline-variant flex flex-col gap-md sticky top-0 shadow-sm z-20">
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
                const isSlaBreached = new Date() > new Date(complaint.slaDueDate) && complaint.status !== 'RESOLVED' && complaint.status !== 'CLOSED'

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
        <div className="hidden lg:block w-1/2 relative bg-surface-dim overflow-hidden">
          
          {/* Street Map Backplane */}
          <div className="absolute inset-0 z-0 select-none">
            <img 
              className="w-full h-full object-cover grayscale brightness-[0.95] opacity-70" 
              alt="Digital Triage GIS Ward Map"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuD3ZMziYtsk0U50Ksc5fqTw3Pcmws__fq0gTm0j6K0Tfknd1PkNpXxmRtp4B7t1LHysO2AkadGYzowWlXzTvfu4m0WWg8L8GN9xtiJkJ1pRYPBlJOtEG_yEwQNDFp-a36y5AeTO-kThtusJzTZdRvmLOK_OD453i1WBdePb7hUXCbgaac_BuNILhf4xSNOx2a2O_F5JfDKHYNRYs67KE-CW-z1PnNGv-p8mDrMftzcfO1MpNRc8pJ6oT2MnoZS03Cr3BIVkvR_zL7k"
            />
          </div>

          {/* DYNAMIC SCATTER PLOT INCIDENT PINS */}
          {filteredComplaints.map((complaint) => {
            const isSelected = complaint.id === selectedComplaintId
            const priorityStyles = getPriorityClasses(complaint.priority)
            const coords = getMockCoordinates(complaint.id)

            return (
              <div 
                key={complaint.id}
                style={{ top: coords.top, left: coords.left }}
                onClick={() => setSelectedComplaintId(complaint.id)}
                className="absolute z-10 transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
              >
                <div className="relative flex items-center justify-center">
                  {isSelected && (
                    <div className="pulse-ring-active absolute w-8 h-8 bg-error rounded-full opacity-60 pointer-events-none" />
                  )}
                  <span className={`material-symbols-outlined text-3xl transition-transform duration-200 group-hover:scale-125 z-20 ${priorityStyles.pin}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                    location_on
                  </span>
                  
                  {/* Tooltip Hover Overlay */}
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-primary text-on-primary px-md py-sm rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none whitespace-nowrap z-30 border border-white/20">
                    <p className="font-label-md text-[10px] opacity-75 font-bold uppercase">{priorityStyles.label}</p>
                    <p className="font-bold text-xs">CP-{complaint.id}: {complaint.title}</p>
                    <p className="text-[10px] opacity-90 mt-xs">{complaint.ward} | {complaint.category}</p>
                  </div>
                </div>
              </div>
            )
          })}

          {/* Interactive Floating Map Control Widgets */}
          <div className="absolute bottom-md right-md flex flex-col gap-sm z-10">
            <div className="flex flex-col bg-white rounded-lg shadow-lg border border-outline-variant overflow-hidden">
              <button className="p-sm hover:bg-surface-container-high border-b border-outline-variant flex items-center justify-center cursor-pointer text-primary">
                <span className="material-symbols-outlined">add</span>
              </button>
              <button className="p-sm hover:bg-surface-container-high flex items-center justify-center cursor-pointer text-primary">
                <span className="material-symbols-outlined">remove</span>
              </button>
            </div>
            <button className="bg-white p-sm rounded-lg shadow-lg border border-outline-variant hover:bg-surface-container-high flex items-center justify-center cursor-pointer text-primary">
              <span className="material-symbols-outlined">my_location</span>
            </button>
          </div>

          {/* TOP-LEFT FLOATING MAP LEGEND */}
          <div className="absolute top-md left-md bg-white/95 backdrop-blur-md p-md rounded-xl border border-outline-variant/50 shadow-xl z-10 w-52 text-left">
            <div className="flex items-center gap-xs mb-sm">
              <span className="material-symbols-outlined text-primary text-[18px]">hub</span>
              <h4 className="font-label-lg font-bold text-primary">Regional Dispatch units</h4>
            </div>
            <div className="flex flex-col gap-sm border-t border-outline-variant/40 pt-sm">
              <div className="flex items-center justify-between text-xs">
                <span className="text-on-surface-variant font-medium">Main Ward Crew 1</span>
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-on-surface-variant font-medium">Emergency Repair Unit</span>
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-on-surface-variant font-medium">Road Ops Team B</span>
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              </div>
            </div>
          </div>

          {/* FLOATING QUICK SUMMARY OF ACTIVE SELECTION */}
          {activeComplaint && (
            <div className="absolute bottom-md left-md bg-white/95 backdrop-blur-md p-lg rounded-xl border border-primary/20 shadow-2xl z-10 max-w-sm text-left flex gap-md mui-card-shadow">
              <div className="w-12 h-12 rounded-lg bg-primary/5 flex items-center justify-center shrink-0 border border-primary/10">
                <span className="material-symbols-outlined text-primary text-2xl">info</span>
              </div>
              <div>
                <span className="text-[10px] text-outline font-bold uppercase tracking-wider">Currently Triaged Target</span>
                <h4 className="font-headline-sm text-sm font-bold text-primary mt-xs line-clamp-1">{activeComplaint.title}</h4>
                <p className="text-xs text-on-surface-variant mt-xs line-clamp-2">{activeComplaint.description}</p>
                <div className="flex items-center gap-md mt-md">
                  <button 
                    onClick={() => navigate(`/officer/complaints/${activeComplaint.id}`)}
                    className="text-xs font-bold text-primary hover:underline flex items-center gap-xs cursor-pointer"
                  >
                    Open Case File <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* DASHBOARD BOTTOM STATS & FOOTER */}
      <footer className="h-10 bg-primary-container text-on-primary-container px-md flex items-center justify-between text-[10px] font-bold uppercase tracking-widest shrink-0 select-none">
        <div className="flex gap-lg items-center">
          <span className="flex items-center gap-xs">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            DISPATCH SYSTEM STABLE
          </span>
          <span className="hidden md:inline">OFFICER: {user?.fullName || user?.email}</span>
        </div>
        <div className="flex gap-md">
          <span className="flex items-center gap-xs text-red-300">
            <span className="w-1.5 h-1.5 rounded-full bg-error" />
            SLA Breached: {stats.slaBreaches}
          </span>
          <span className="flex items-center gap-xs text-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            In Progress: {stats.inProgress}
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
