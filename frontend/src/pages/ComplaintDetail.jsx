import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useComplaints } from '@hooks/useComplaints'
import { useAuth } from '@hooks/useAuth'
import { useNotification } from '@hooks/useNotification'
import { ROUTES } from '@utils/constants'
import CivicMap from '@components/common/CivicMap'

const STATUS_CONFIG = {
  OPEN: { label: 'Open', bg: '#fef3c7', color: '#92400e', icon: 'pending', timeline: 'Complaint Registered' },
  IN_PROGRESS: { label: 'In Progress', bg: '#dbeafe', color: '#1e40af', icon: 'autorenew', timeline: 'Under Investigation' },
  RESOLVED: { label: 'Resolved', bg: '#d1fae5', color: '#065f46', icon: 'check_circle', timeline: 'Issue Resolved' },
  CLOSED: { label: 'Closed', bg: '#f1f5f9', color: '#475569', icon: 'archive', timeline: 'Case Closed' },
  REOPENED: { label: 'Reopened', bg: '#ffedd5', color: '#9a3412', icon: 'report_problem', timeline: 'Citizen Disputed — Reopened' },
  REJECTED: { label: 'Rejected', bg: '#fee2e2', color: '#991b1b', icon: 'cancel', timeline: 'Complaint Rejected' },
}

const PRIORITY_CONFIG = {
  CRITICAL: { label: 'Critical', bg: '#fee2e2', color: '#991b1b', icon: 'emergency' },
  HIGH: { label: 'High Priority', bg: '#ffedd5', color: '#9a3412', icon: 'warning' },
  MEDIUM: { label: 'Medium', bg: '#fef9c3', color: '#854d0e', icon: 'info' },
  LOW: { label: 'Low Priority', bg: '#f1f5f9', color: '#475569', icon: 'low_priority' },
}

const STATUS_TIMELINE = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']

function SLACounter({ slaDueDate, status }) {
  if (!slaDueDate) return null
  const now = new Date()
  const due = new Date(slaDueDate)
  const diff = due - now
  const isBreached = diff < 0 && status !== 'RESOLVED' && status !== 'CLOSED'
  const isResolved = status === 'RESOLVED' || status === 'CLOSED'

  if (isResolved) {
    return (
      <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full" style={{ background: '#d1fae5', color: '#065f46' }}>
        <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
        SLA Met
      </span>
    )
  }

  const hours = Math.abs(Math.floor(diff / (1000 * 60 * 60)))
  const mins = Math.abs(Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)))

  return (
    <span
      className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full"
      style={{ background: isBreached ? '#fee2e2' : '#fef3c7', color: isBreached ? '#991b1b' : '#92400e' }}
    >
      <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
        {isBreached ? 'warning' : 'schedule'}
      </span>
      {isBreached ? `SLA Breached by ${hours}h ${mins}m` : `SLA: ${hours}h ${mins}m left`}
    </span>
  )
}

export function ComplaintDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { currentComplaint, loading, error, fetchDetail, deleteComplaint, updateStatus: updateComplaintStatus, confirmResolution, disputeResolution } = useComplaints()
  const { user } = useAuth()
  const { error: showError, success } = useNotification()

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [noteInput, setNoteInput] = useState('')
  const [showConfirming, setShowConfirming] = useState(false)
  const [showDisputeModal, setShowDisputeModal] = useState(false)
  const [disputeReason, setDisputeReason] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [activeImage, setActiveImage] = useState(0)
  const [satisfactionRating, setSatisfactionRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)

  useEffect(() => {
    if (id) fetchDetail(id)
  }, [id])

  const getDashboardRoute = () => {
    if (user?.role === 'OFFICER') return ROUTES.OFFICER.DASHBOARD
    if (user?.role === 'ADMIN') return ROUTES.ADMIN.DASHBOARD
    return ROUTES.CITIZEN.DASHBOARD
  }

  if (loading) {
    return (
      <div style={{ background: 'var(--gov-surface)', minHeight: 'calc(100vh - 56px)' }}>
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-10">
          <div className="animate-pulse space-y-4">
            <div className="skeleton h-6 w-48 rounded" />
            <div className="skeleton h-10 w-2/3 rounded" />
            <div className="grid grid-cols-3 gap-4 mt-6">
              {[1,2,3].map(i => <div key={i} className="skeleton h-20 rounded-xl" />)}
            </div>
            <div className="skeleton h-48 rounded-2xl" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !currentComplaint) {
    return (
      <div style={{ background: 'var(--gov-surface)', minHeight: 'calc(100vh - 56px)' }} className="flex flex-col items-center justify-center px-4">
        <div className="text-center animate-fade-in">
          <span className="material-symbols-outlined text-5xl mb-3" style={{ color: '#ef4444' }}>error_outline</span>
          <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--gov-navy)' }}>Complaint Not Found</h2>
          <p className="text-sm text-gray-500 mb-6">The complaint you're looking for doesn't exist or you don't have access.</p>
          <button onClick={() => navigate(getDashboardRoute())} className="gov-btn-primary">
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const complaint = currentComplaint
  const isOwner = user?.id != null && user.id === complaint.citizenId
  const isStaff = user?.role === 'OFFICER' || user?.role === 'ADMIN'
  const statusCfg = STATUS_CONFIG[complaint.status] || STATUS_CONFIG.OPEN
  const priorityCfg = PRIORITY_CONFIG[complaint.priority] || PRIORITY_CONFIG.LOW
  const currentStatusIndex = STATUS_TIMELINE.indexOf(complaint.status)

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteComplaint(id)
      success('Complaint withdrawn successfully.')
      navigate(ROUTES.CITIZEN.DASHBOARD)
    } catch (err) {
      showError('Failed to delete complaint')
    } finally {
      setDeleting(false)
      setShowDeleteModal(false)
    }
  }

  const handlePostNote = async () => {
    if (!noteInput.trim()) return
    setUpdating(true)
    try {
      await updateComplaintStatus(complaint.id, complaint.status, noteInput)
      success('Note posted successfully!')
      setNoteInput('')
      fetchDetail(id)
    } catch (err) {
      showError('Failed to post note')
    } finally {
      setUpdating(false)
    }
  }

  const handleStatusUpdate = async () => {
    if (!newStatus || !noteInput.trim()) {
      showError('Please select a status and add a note.')
      return
    }
    setUpdating(true)
    try {
      await updateComplaintStatus(complaint.id, newStatus, noteInput)
      success('Status updated successfully!')
      setShowStatusModal(false)
      setNoteInput('')
      setNewStatus('')
      fetchDetail(id)
    } catch (err) {
      showError('Failed to update status')
    } finally {
      setUpdating(false)
    }
  }

  const handleConfirm = async () => {
    setShowConfirming(true)
    try {
      const ok = await confirmResolution(complaint.id, satisfactionRating || null)
      if (ok) {
        success('Thank you — resolution confirmed')
        fetchDetail(id)
      } else {
        showError('Failed to confirm resolution')
      }
    } catch (err) {
      showError('Failed to confirm resolution')
    } finally {
      setShowConfirming(false)
    }
  }

  const handleDispute = async () => {
    if (!disputeReason.trim()) { showError('Please provide a reason to dispute'); return }
    setShowDisputeModal(false)
    try {
      const ok = await disputeResolution(complaint.id, disputeReason)
      if (ok) {
        success('Dispute submitted — the case has been reopened')
        fetchDetail(id)
      } else {
        showError('Failed to submit dispute')
      }
    } catch (err) {
      showError('Failed to submit dispute')
    } finally {
      setDisputeReason('')
    }
  }

  return (
    <div style={{ background: 'var(--gov-surface)', minHeight: 'calc(100vh - 56px)' }}>
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-8 animate-fade-in">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm mb-6">
          <button onClick={() => navigate(getDashboardRoute())} className="flex items-center gap-1.5 font-medium hover:underline" style={{ color: 'var(--gov-blue)' }}>
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            {user?.role === 'OFFICER' ? 'Triage Queue' : 'My Complaints'}
          </button>
          <span className="text-gray-400">/</span>
          <span className="font-semibold text-gray-600">Case #CP-{complaint.id}</span>
        </nav>

        {/* Header */}
        <div className="bg-white rounded-2xl border p-6 mb-5" style={{ borderColor: 'var(--gov-border)' }}>
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-5">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span
                  className="text-xs font-bold px-2.5 py-1 rounded"
                  style={{ background: 'rgba(10,35,66,0.06)', color: 'var(--gov-navy)' }}
                >
                  #CP-{complaint.id}
                </span>
                <span
                  className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full"
                  style={{ background: statusCfg.bg, color: statusCfg.color }}
                >
                  <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>{statusCfg.icon}</span>
                  {statusCfg.label}
                </span>
                {complaint.priority && (
                  <span
                    className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full"
                    style={{ background: priorityCfg.bg, color: priorityCfg.color }}
                  >
                    <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>{priorityCfg.icon}</span>
                    {priorityCfg.label}
                  </span>
                )}
                <SLACounter slaDueDate={complaint.slaDeadline} status={complaint.status} />
              </div>
              <h1 className="text-2xl font-black mb-2" style={{ color: 'var(--gov-navy)' }}>{complaint.title}</h1>
              <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                {complaint.category && (
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">category</span>
                    {complaint.category}
                  </span>
                )}
                {complaint.wardName && (
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">location_on</span>
                    {complaint.wardName}
                  </span>
                )}
                {complaint.createdAt && (
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">calendar_today</span>
                    {new Date(complaint.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                )}
              </div>
            </div>
            {/* Action buttons */}
            <div className="flex flex-wrap gap-2 shrink-0">
              {isStaff && complaint.status !== 'RESOLVED' && complaint.status !== 'CLOSED' && (
                <button
                  onClick={() => { setNewStatus(complaint.status); setShowStatusModal(true) }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all hover:shadow-sm"
                  style={{ borderColor: 'var(--gov-navy)', color: 'var(--gov-navy)' }}
                >
                  <span className="material-symbols-outlined text-sm">edit_note</span>
                  Update Status
                </button>
              )}
              {isOwner && complaint.status === 'OPEN' && (
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all hover:shadow-sm"
                  style={{ borderColor: '#dc2626', color: '#dc2626' }}
                >
                  <span className="material-symbols-outlined text-sm">delete_outline</span>
                  Withdraw
                </button>
              )}
            </div>
          </div>

          {/* Status Timeline */}
          <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--gov-border)' }}>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Resolution Progress</p>
            <div className="flex items-center gap-2">
              {STATUS_TIMELINE.map((s, i) => {
                const sCfg = STATUS_CONFIG[s]
                const isPast = i <= currentStatusIndex
                const isCurrent = i === currentStatusIndex
                return (
                  <React.Fragment key={s}>
                    <div className="flex flex-col items-center gap-1">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all"
                        style={{
                          background: isPast ? sCfg.color : 'white',
                          borderColor: isPast ? sCfg.color : 'var(--gov-border)',
                          boxShadow: isCurrent ? `0 0 0 3px ${sCfg.color}30` : 'none',
                        }}
                      >
                        <span
                          className="material-symbols-outlined text-sm"
                          style={{ color: isPast ? 'white' : 'var(--gov-text-light)', fontVariationSettings: "'FILL' 1" }}
                        >
                          {sCfg.icon}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-center leading-tight hidden sm:block" style={{ color: isPast ? sCfg.color : 'var(--gov-text-light)', maxWidth: 60 }}>
                        {sCfg.timeline}
                      </span>
                    </div>
                    {i < STATUS_TIMELINE.length - 1 && (
                      <div className="flex-1 h-0.5 transition-all" style={{ background: i < currentStatusIndex ? 'var(--gov-green-light)' : 'var(--gov-border)' }} />
                    )}
                  </React.Fragment>
                )
              })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-5">
            {/* Description */}
            <div className="bg-white rounded-2xl border p-6" style={{ borderColor: 'var(--gov-border)' }}>
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-3">Complaint Description</h2>
              <p className="text-base text-gray-700 leading-relaxed">{complaint.description || 'No description provided.'}</p>

              {complaint.location && (
                <div className="mt-4 pt-4 border-t flex flex-col gap-4" style={{ borderColor: 'var(--gov-border)' }}>
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-base mt-0.5" style={{ color: 'var(--gov-blue)', fontVariationSettings: "'FILL' 1" }}>location_on</span>
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase">Location</p>
                      <p className="text-sm font-medium text-gray-700">{complaint.location}</p>
                    </div>
                  </div>

                  {complaint.latitude && complaint.longitude && (
                    <div className="w-full h-48 rounded-xl overflow-hidden border border-[#d0d7e3]">
                      <CivicMap
                        center={[complaint.latitude, complaint.longitude]}
                        zoom={15}
                        interactive={false}
                        markers={[{
                          id: complaint.id,
                          latitude: complaint.latitude,
                          longitude: complaint.longitude,
                          title: complaint.title,
                          priority: complaint.priority,
                          status: complaint.status,
                          address: complaint.location,
                        }]}
                        height="100%"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Images */}
            {complaint.imageUrls && complaint.imageUrls.length > 0 && (
              <div className="bg-white rounded-2xl border p-6" style={{ borderColor: 'var(--gov-border)' }}>
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-3">
                  Evidence Photos ({complaint.imageUrls.length})
                </h2>
                <div className="rounded-xl overflow-hidden mb-3" style={{ maxHeight: '320px' }}>
                  <img
                    src={complaint.imageUrls[activeImage]}
                    alt={`Evidence ${activeImage + 1}`}
                    className="w-full h-full object-cover"
                    style={{ maxHeight: '320px' }}
                  />
                </div>
                {complaint.imageUrls.length > 1 && (
                  <div className="flex gap-2 flex-wrap">
                    {complaint.imageUrls.map((img, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveImage(i)}
                        className="w-16 h-16 rounded-lg overflow-hidden border-2 transition-all"
                        style={{ borderColor: i === activeImage ? 'var(--gov-navy)' : 'transparent' }}
                      >
                        <img src={img} alt={`Thumbnail ${i + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Officer Notes */}
            {complaint.officerNotes && (
              <div className="bg-white rounded-2xl border p-6" style={{ borderColor: 'var(--gov-border)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="material-symbols-outlined text-base" style={{ color: 'var(--gov-navy)', fontVariationSettings: "'FILL' 1" }}>assignment_ind</span>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400">Officer Field Notes</h2>
                </div>
                <div
                  className="rounded-xl p-4 border-l-4"
                  style={{ background: 'rgba(10,35,66,0.03)', borderLeftColor: 'var(--gov-navy)' }}
                >
                  <p className="text-sm text-gray-700 leading-relaxed">{complaint.officerNotes}</p>
                  {complaint.officerName && (
                    <p className="text-xs font-bold mt-2" style={{ color: 'var(--gov-navy)' }}>
                      — {complaint.officerName}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Add Note (staff) */}
            {isStaff && (
              <div className="bg-white rounded-2xl border p-6" style={{ borderColor: 'var(--gov-border)' }}>
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-3">Add Field Note</h2>
                <textarea
                  value={noteInput}
                  onChange={e => setNoteInput(e.target.value)}
                  placeholder="Add a progress note, dispatch update, or resolution details..."
                  rows={3}
                  className="gov-input resize-none mb-3"
                  maxLength={500}
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">{noteInput.length}/500</span>
                  <button
                    onClick={handlePostNote}
                    disabled={updating || !noteInput.trim()}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                    style={{ background: 'var(--gov-navy)', color: 'white' }}
                  >
                    {updating ? (
                      <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                    ) : (
                      <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
                    )}
                    Post Note
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Case Details */}
            <div className="bg-white rounded-2xl border p-5" style={{ borderColor: 'var(--gov-border)' }}>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">Case Information</h3>
              <div className="space-y-3">
                {[
                  { label: 'Case ID', value: `#CP-${complaint.id}`, icon: 'tag' },
                  { label: 'Category', value: complaint.category || '—', icon: 'category' },
                  { label: 'Ward', value: complaint.wardName || '—', icon: 'location_on' },
                  { label: 'Submitted By', value: complaint.citizenName || 'Anonymous', icon: 'person' },
                  { label: 'Assigned To', value: complaint.officerName || 'Unassigned', icon: 'badge' },
                  { label: 'Filed On', value: complaint.createdAt ? new Date(complaint.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—', icon: 'calendar_today' },
                  { label: 'SLA Deadline', value: complaint.slaDeadline ? new Date(complaint.slaDeadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Not set', icon: 'schedule' },
                ].map((item) => (
                  <div key={item.label} className="flex gap-3">
                    <span className="material-symbols-outlined text-sm mt-0.5 shrink-0" style={{ color: 'var(--gov-text-muted)' }}>{item.icon}</span>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{item.label}</p>
                      <p className="text-sm font-semibold text-gray-700 truncate">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl border p-5" style={{ borderColor: 'var(--gov-border)' }}>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={() => navigate(getDashboardRoute())}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-colors hover:bg-gray-50"
                  style={{ borderColor: 'var(--gov-border)', color: 'var(--gov-text)' }}
                >
                  <span className="material-symbols-outlined text-sm">arrow_back</span>
                  Back to Dashboard
                </button>
                {isStaff && complaint.status !== 'RESOLVED' && complaint.status !== 'CLOSED' && (
                  <button
                    onClick={() => { setNewStatus(complaint.status); setShowStatusModal(true) }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90"
                    style={{ background: 'var(--gov-navy)', color: 'white' }}
                  >
                    <span className="material-symbols-outlined text-sm">edit_note</span>
                    Update Status
                  </button>
                )}
                {isOwner && complaint.status === 'OPEN' && (
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border-2 text-sm font-bold transition-all hover:bg-red-50"
                    style={{ borderColor: '#dc2626', color: '#dc2626' }}
                  >
                    <span className="material-symbols-outlined text-sm">delete_outline</span>
                    Withdraw Complaint
                  </button>
                )}
                {isOwner && complaint.status === 'RESOLVED' && (
                  <>
                    <button
                      onClick={() => setShowDisputeModal(true)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border-2 text-sm font-bold transition-all hover:bg-red-50"
                      style={{ borderColor: '#dc2626', color: '#dc2626' }}
                    >
                      <span className="material-symbols-outlined text-sm">report_problem</span>
                      Dispute Resolution
                    </button>

                    {/* Star rating + confirm block */}
                    <div className="rounded-xl border p-4 space-y-3" style={{ borderColor: 'var(--gov-border)', background: '#f8fafc' }}>
                      <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Rate your satisfaction</p>
                      <div className="flex gap-1.5 justify-center">
                        {[1, 2, 3, 4, 5].map(star => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setSatisfactionRating(star === satisfactionRating ? 0 : star)}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            className="text-3xl transition-transform hover:scale-110"
                            aria-label={`Rate ${star} out of 5`}
                          >
                            <span
                              className="material-symbols-outlined text-3xl"
                              style={{
                                color: star <= (hoverRating || satisfactionRating) ? '#f59e0b' : '#d1d5db',
                                fontVariationSettings: star <= (hoverRating || satisfactionRating) ? "'FILL' 1" : "'FILL' 0",
                              }}
                            >
                              star
                            </span>
                          </button>
                        ))}
                      </div>
                      {satisfactionRating > 0 && (
                        <p className="text-xs text-center text-gray-500">
                          {['', 'Very Unsatisfied', 'Unsatisfied', 'Neutral', 'Satisfied', 'Very Satisfied'][satisfactionRating]}
                        </p>
                      )}
                      <button
                        onClick={handleConfirm}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
                        style={{ background: 'var(--gov-green, #15803d)', color: 'white' }}
                        disabled={showConfirming}
                      >
                        <span className="material-symbols-outlined text-sm">thumb_up</span>
                        {showConfirming ? 'Confirming...' : 'Confirm Resolution'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Help */}
            <div className="rounded-2xl border p-4" style={{ background: '#f0f9ff', borderColor: '#bae6fd' }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-sm" style={{ color: '#0284c7', fontVariationSettings: "'FILL' 1" }}>help_center</span>
                <p className="text-xs font-bold" style={{ color: '#075985' }}>Need Assistance?</p>
              </div>
              <p className="text-xs" style={{ color: '#0369a1' }}>
                If your complaint hasn't been updated in 72 hours, contact your ward office or call our helpline at 1800-123-4567.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Status Update Modal */}
      {showStatusModal && (
        <div className="modal-backdrop" onClick={() => setShowStatusModal(false)}>
          <div className="modal-content p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(10,35,66,0.07)' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--gov-navy)', fontVariationSettings: "'FILL' 1" }}>edit_note</span>
              </div>
              <div>
                <h3 className="font-black text-lg" style={{ color: 'var(--gov-navy)' }}>Update Status</h3>
                <p className="text-xs text-gray-500">#{`CP-${complaint.id}`} — {complaint.title}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">New Status</label>
                <select
                  value={newStatus}
                  onChange={e => setNewStatus(e.target.value)}
                  className="gov-input"
                  disabled={updating}
                >
                  <option value="OPEN">Open / Unresolved</option>
                  <option value="IN_PROGRESS">Work In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed (Archived)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                  Field Note <span style={{ color: 'var(--gov-red)' }}>*</span>
                </label>
                <textarea
                  value={noteInput}
                  onChange={e => setNoteInput(e.target.value)}
                  className="gov-input resize-none"
                  rows={4}
                  placeholder="Describe the work performed, current status, or next steps..."
                  maxLength={500}
                  disabled={updating}
                />
                <p className="text-xs text-gray-400 text-right mt-1">{noteInput.length}/500</p>
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowStatusModal(false)}
                className="flex-1 py-2.5 rounded-xl border text-sm font-bold transition-colors hover:bg-gray-50"
                style={{ borderColor: 'var(--gov-border)', color: 'var(--gov-text-muted)' }}
                disabled={updating}
              >
                Cancel
              </button>
              <button
                onClick={handleStatusUpdate}
                disabled={updating || !noteInput.trim() || !newStatus}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                style={{ background: 'var(--gov-navy)', color: 'white' }}
              >
                {updating ? (
                  <><span className="material-symbols-outlined text-sm animate-spin">sync</span> Saving...</>
                ) : (
                  <><span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check</span> Save Changes</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-backdrop" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content p-6" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-5">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: '#fee2e2' }}>
                <span className="material-symbols-outlined text-2xl" style={{ color: '#dc2626', fontVariationSettings: "'FILL' 1" }}>delete_forever</span>
              </div>
              <h3 className="font-black text-lg mb-1" style={{ color: 'var(--gov-navy)' }}>Withdraw Complaint?</h3>
              <p className="text-sm text-gray-500">
                This will permanently withdraw case <strong>#CP-{complaint.id}</strong>. This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2.5 rounded-xl border text-sm font-bold hover:bg-gray-50 transition-colors"
                style={{ borderColor: 'var(--gov-border)', color: 'var(--gov-text)' }}
                disabled={deleting}
              >
                Keep Complaint
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
                style={{ background: '#dc2626', color: 'white' }}
              >
                {deleting ? (
                  <><span className="material-symbols-outlined text-sm animate-spin">sync</span> Withdrawing...</>
                ) : 'Yes, Withdraw'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dispute Modal */}
      {showDisputeModal && (
        <div className="modal-backdrop" onClick={() => setShowDisputeModal(false)}>
          <div className="modal-content p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.07)' }}>
                <span className="material-symbols-outlined" style={{ color: '#dc2626' }}>report_problem</span>
              </div>
              <div>
                <h3 className="font-black text-lg" style={{ color: 'var(--gov-navy)' }}>Dispute Resolution</h3>
                <p className="text-xs text-gray-500">Explain why the resolution is unsatisfactory for case #{`CP-${complaint.id}`}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <textarea
                  value={disputeReason}
                  onChange={e => setDisputeReason(e.target.value)}
                  className="gov-input resize-none"
                  rows={5}
                  placeholder="Describe the issue and why you disagree with the resolution..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowDisputeModal(false)}
                className="flex-1 py-2.5 rounded-xl border text-sm font-bold transition-colors hover:bg-gray-50"
                style={{ borderColor: 'var(--gov-border)', color: 'var(--gov-text-muted)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleDispute}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold"
                style={{ background: '#dc2626', color: 'white' }}
              >
                Submit Dispute
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
