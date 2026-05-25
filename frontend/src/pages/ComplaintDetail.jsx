import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useComplaints } from '@hooks/useComplaints'
import { useAuth } from '@hooks/useAuth'
import { useNotification } from '@hooks/useNotification'
import { ROUTES } from '@utils/constants'

export function ComplaintDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { currentComplaint, loading, error, fetchDetail, deleteComplaint, updateComplaintStatus } = useComplaints()
  const { user } = useAuth()
  const { error: showError, success } = useNotification()

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [noteInput, setNoteInput] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (id) {
      fetchDetail(id)
    }
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="font-body-lg text-primary">Loading complaint details...</p>
      </div>
    )
  }

  if (error || !currentComplaint) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-xl">
        <span className="material-symbols-outlined text-4xl text-error mb-sm">error</span>
        <p className="font-body-lg text-on-surface-variant">Complaint not found or error loading.</p>
        <button 
          onClick={() => navigate(-1)} 
          className="mt-md px-lg py-sm bg-primary text-on-primary rounded-lg font-label-lg"
        >
          Go Back
        </button>
      </div>
    )
  }

  const complaint = currentComplaint
  const isOwner = user?.email === complaint.submittedBy
  const isStaff = user?.role === 'OFFICER' || user?.role === 'ADMIN'

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const ok = await deleteComplaint(id)
      if (ok) {
        success('Complaint deleted successfully')
        navigate(ROUTES.CITIZEN.DASHBOARD)
      } else {
        showError('Failed to delete complaint')
      }
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
      fetchDetail(id) // reload details
    } catch (err) {
      showError('Failed to post note')
    } finally {
      setUpdating(false)
    }
  }

  const handleStatusUpdate = async () => {
    setUpdating(true)
    try {
      await updateComplaintStatus(complaint.id, newStatus, 'Status changed by supervisor')
      success('Status updated successfully!')
      setShowStatusModal(false)
      fetchDetail(id) // reload
    } catch (err) {
      showError('Failed to update status')
    } finally {
      setUpdating(false)
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      OPEN: 'bg-amber-100 text-amber-700',
      IN_PROGRESS: 'bg-blue-100 text-blue-700',
      RESOLVED: 'bg-green-100 text-green-700',
      CLOSED: 'bg-gray-100 text-gray-700'
    }
    return badges[status] || 'bg-gray-100 text-gray-700'
  }

  const getPriorityBadge = (priority) => {
    const badges = {
      CRITICAL: 'bg-red-100 text-red-700',
      HIGH: 'bg-orange-100 text-orange-700',
      MEDIUM: 'bg-yellow-100 text-yellow-700',
      LOW: 'bg-blue-100 text-blue-700'
    }
    return badges[priority] || 'bg-gray-100 text-gray-700'
  }

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col">
      <main className="flex-grow w-full max-w-[1312px] mx-auto px-margin-mobile md:px-margin-desktop py-xl text-left">
        
        {/* Breadcrumbs & Actions */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-md mb-lg">
          <nav className="flex items-center gap-xs text-on-surface-variant font-label-md text-label-md">
            <span className="hover:underline cursor-pointer" onClick={() => navigate(-1)}>Complaints</span>
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            <span className="font-bold text-on-surface">Case #CP-{complaint.id}</span>
          </nav>
          <div className="flex items-center gap-sm">
            {isOwner && (
              <button 
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center gap-xs px-md py-sm border border-error text-error rounded-lg hover:bg-error-container/10 transition-colors font-label-lg text-label-lg cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">delete</span> Delete
              </button>
            )}
            {isStaff && (
              <button 
                onClick={() => { setNewStatus(complaint.status); setShowStatusModal(true); }}
                className="flex items-center gap-xs px-md py-sm bg-primary text-on-primary rounded-lg shadow-sm hover:opacity-90 transition-opacity font-label-lg text-label-lg cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">edit</span> Update Status
              </button>
            )}
          </div>
        </div>

        {/* Header Section */}
        <div className="mb-xl">
          <div className="flex flex-wrap items-center gap-md mb-sm">
            <h1 className="font-headline-lg text-headline-lg text-on-surface font-bold">{complaint.title}</h1>
            <span className={`px-md py-xs rounded-full font-label-md text-label-md flex items-center gap-xs ${getStatusBadge(complaint.status)}`}>
              <span className="w-2 h-2 rounded-full bg-current"></span> {complaint.status}
            </span>
            <span className={`px-md py-xs rounded-full font-label-md text-label-md flex items-center gap-xs ${getPriorityBadge(complaint.priority)}`}>
              <span className="material-symbols-outlined text-[16px]">schedule</span> {complaint.priority} Priority
            </span>
          </div>
          <p className="text-on-surface-variant font-body-md text-body-md max-w-3xl">{complaint.description}</p>
        </div>

        {/* Main Bento Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
          
          {/* Left Column */}
          <div className="lg:col-span-8 flex flex-col gap-gutter">
            
            {/* Summary Card */}
            <div className="bg-white border border-outline-variant p-lg rounded-xl shadow-sm mui-card-shadow">
              <h2 className="font-headline-md text-headline-md font-bold mb-md">Complaint Summary</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-xl">
                <div className="flex gap-md">
                  <div className="w-12 h-12 rounded-lg bg-surface-container-high flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-primary">location_on</span>
                  </div>
                  <div>
                    <p className="text-on-surface-variant font-label-md text-label-md">Location / Ward</p>
                    <p className="font-body-md text-body-md font-semibold">{complaint.location || 'Location coordinates not provided'}</p>
                    <p className="text-on-surface-variant font-label-md text-label-md">{complaint.ward}</p>
                  </div>
                </div>
                <div className="flex gap-md">
                  <div className="w-12 h-12 rounded-lg bg-surface-container-high flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-primary">person</span>
                  </div>
                  <div>
                    <p className="text-on-surface-variant font-label-md text-label-md">Submitter Info</p>
                    <p className="font-body-md text-body-md font-semibold">{complaint.submittedBy || 'Anonymous Citizen'}</p>
                    <p className="text-on-surface-variant font-label-md text-label-md">Citizen App (Verified)</p>
                  </div>
                </div>
              </div>

              {/* Map View */}
              <div className="mt-lg h-48 rounded-lg overflow-hidden bg-surface-container relative group border border-outline-variant">
                <img 
                  className="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 transition-all duration-500" 
                  alt="City GIS locator map"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDPFr3n3BIeUozDT-DM2zCpSd3GrSz4RJZrrh21zwi60s8NeL3aCPrmezpYisAahZwkgeL0pxxw1jxoKJQCMsAYHQDXgcAqJsKgAVum4ujCDbpVVQXODrdSdxNvt0R6LH857lhUYOjNqthT_E398CZ9rw1KqzpZUTTdWCwExhzK4GpHEX6Y1M85_LbnmcOEv7g1sRBMn9NlpP1PXQ3_WFRCU2XZd5QJ5l2OH0nlK2G4IE0_LMQC_A3FMenFCgoOvY9qdoR0I2eFg3I"
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="bg-primary text-on-primary p-xs rounded-full shadow-lg border-2 border-white flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]">location_on</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Attachments Section */}
            {complaint.images && complaint.images.length > 0 && (
              <div className="bg-white border border-outline-variant p-lg rounded-xl shadow-sm mui-card-shadow">
                <div className="flex justify-between items-center mb-md">
                  <h2 className="font-headline-md text-headline-md font-bold">Photos &amp; Attachments</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-md">
                  {complaint.images.map((img, i) => (
                    <div key={i} className="aspect-square rounded-lg overflow-hidden relative group cursor-pointer border border-outline-variant">
                      <img 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" 
                        alt={`Complaint photo attachment ${i + 1}`}
                        src={img} 
                        onClick={() => window.open(img, '_blank')}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Timeline */}
            <div className="bg-white border border-outline-variant p-lg rounded-xl shadow-sm mui-card-shadow">
              <h2 className="font-headline-md text-headline-md font-bold mb-xl">Activity Timeline</h2>
              <div className="relative pl-8 flex flex-col gap-lg text-left">
                <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-outline-variant"></div>
                
                {complaint.status === 'RESOLVED' && (
                  <div className="relative">
                    <div className="absolute -left-[27px] w-4 h-4 rounded-full bg-green-600 ring-4 ring-green-100 z-10"></div>
                    <div>
                      <p className="font-label-lg text-label-lg font-bold text-on-surface">Resolved</p>
                      <p className="text-on-surface-variant font-body-md text-body-md">Municipal crew completed site intervention and updated resolution state.</p>
                      {complaint.resolution && <p className="text-primary font-body-md bg-secondary-container/30 p-sm rounded mt-xs">{complaint.resolution}</p>}
                    </div>
                  </div>
                )}

                {complaint.status === 'IN_PROGRESS' && (
                  <div className="relative">
                    <div className="absolute -left-[27px] w-4 h-4 rounded-full bg-primary ring-4 ring-secondary-container z-10"></div>
                    <div>
                      <p className="font-label-lg text-label-lg font-bold text-on-surface">Work in Progress</p>
                      <p className="text-on-surface-variant font-body-md text-body-md">Department field staff accepted task and initiated mitigation.</p>
                    </div>
                  </div>
                )}

                {complaint.assignedTo && (
                  <div className="relative opacity-80">
                    <div className="absolute -left-[27px] w-4 h-4 rounded-full bg-outline z-10"></div>
                    <div>
                      <p className="font-label-lg text-label-lg font-bold text-on-surface">Assigned to Officer</p>
                      <p className="text-on-surface-variant font-body-md text-body-md">Routed automatically to field crew member: <strong>{complaint.assignedTo}</strong>.</p>
                    </div>
                  </div>
                )}

                <div className="relative opacity-80">
                  <div className="absolute -left-[27px] w-4 h-4 rounded-full bg-outline z-10"></div>
                  <div>
                    <p className="font-label-lg text-label-lg font-bold text-on-surface">Complaint Created</p>
                    <p className="text-on-surface-variant font-body-md text-body-md">Submission received via verified Portal workflow.</p>
                    <p className="text-xs text-outline mt-1">{complaint.createdAt ? new Date(complaint.createdAt).toLocaleString() : ''}</p>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column */}
          <div className="lg:col-span-4 flex flex-col gap-gutter">
            
            {/* Comments Feed */}
            <div className="bg-white border border-outline-variant rounded-xl shadow-sm mui-card-shadow flex flex-col h-fit">
              <div className="p-lg border-b border-outline-variant">
                <h2 className="font-headline-md text-headline-md font-bold">Official Notes</h2>
              </div>
              
              <div className="p-lg flex flex-col gap-lg max-h-[400px] overflow-y-auto">
                {complaint.officerNotes ? (
                  <div className="flex gap-md">
                    <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center text-on-primary-fixed font-bold text-[12px] shrink-0">ST</div>
                    <div className="flex-grow">
                      <div className="flex justify-between">
                        <span className="font-label-md text-label-md font-bold text-primary">Department Crew</span>
                      </div>
                      <p className="bg-surface-container-low p-md rounded-lg mt-xs font-body-md text-body-md text-on-surface-variant">
                        {complaint.officerNotes}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-on-surface-variant font-label-md text-center py-md italic">No official notes posted on this ticket yet.</p>
                )}
              </div>

              {isStaff && (
                <div className="p-lg border-t border-outline-variant">
                  <div className="relative">
                    <textarea 
                      value={noteInput}
                      onChange={(e) => setNoteInput(e.target.value)}
                      className="w-full rounded-lg border-outline-variant focus:ring-primary focus:border-primary font-body-md text-body-md p-md pr-12 h-24 resize-none outline-none border" 
                      placeholder="Add an official note..."
                      maxLength={500}
                      disabled={updating}
                    ></textarea>
                    <button 
                      onClick={handlePostNote}
                      disabled={updating || !noteInput.trim()}
                      className="absolute bottom-3 right-3 text-primary hover:bg-surface-container p-sm rounded-full transition-colors cursor-pointer disabled:opacity-30"
                    >
                      <span className="material-symbols-outlined">send</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Performance Stats */}
            <div className="bg-primary text-on-primary p-lg rounded-xl shadow-md">
              <h3 className="font-label-lg text-label-lg opacity-80 mb-md font-bold">Response Performance</h3>
              <div className="space-y-md">
                <div className="flex justify-between items-center">
                  <span className="font-body-md text-body-md">SLA Target</span>
                  <span className="font-bold">48 Hours</span>
                </div>
                <div className="w-full bg-on-primary/20 h-2 rounded-full overflow-hidden">
                  <div className="bg-on-primary h-full w-[65%]"></div>
                </div>
                <div className="flex justify-between items-center font-label-md text-label-md opacity-80 text-xs">
                  <span>Priority: {complaint.priority}</span>
                  <span>Target Due: Standard</span>
                </div>
              </div>
            </div>

            {/* Reference Links */}
            <div className="bg-surface-container-low border border-outline-variant p-lg rounded-xl">
              <h3 className="font-label-lg text-label-lg font-bold mb-md">Reference Links</h3>
              <ul className="space-y-sm text-left">
                <li>
                  <a className="flex items-center justify-between group" href="#" onClick={(e) => e.preventDefault()}>
                    <span className="font-body-md text-body-md text-on-surface-variant group-hover:text-primary transition-colors">Civic Charter 2026</span>
                    <span className="material-symbols-outlined text-[18px] opacity-40">open_in_new</span>
                  </a>
                </li>
                <li>
                  <a className="flex items-center justify-between group" href="#" onClick={(e) => e.preventDefault()}>
                    <span className="font-body-md text-body-md text-on-surface-variant group-hover:text-primary transition-colors">Past Repairs ({complaint.ward})</span>
                    <span className="material-symbols-outlined text-[18px] opacity-40">open_in_new</span>
                  </a>
                </li>
              </ul>
            </div>

          </div>

        </div>

      </main>

      {/* Delete Modal Confirmation */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)}></div>
          <div className="bg-white p-xl rounded-xl shadow-2xl max-w-sm w-full z-10 text-left border border-outline-variant">
            <h3 className="font-headline-md text-headline-md text-primary font-bold mb-md">Delete Complaint</h3>
            <p className="text-on-surface-variant font-body-md mb-lg">
              Are you sure you want to delete this complaint? This action cannot be undone and will retract it from municipal workflows.
            </p>
            <div className="flex gap-md">
              <button 
                onClick={() => setShowDeleteModal(false)}
                className="w-full py-md border border-outline-variant rounded-lg font-label-lg"
                disabled={deleting}
              >
                Cancel
              </button>
              <button 
                onClick={handleDelete}
                className="w-full py-md bg-error text-on-primary rounded-lg font-label-lg hover:opacity-90 disabled:opacity-50"
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowStatusModal(false)}></div>
          <div className="bg-white p-xl rounded-xl shadow-2xl max-w-md w-full z-10 text-left border border-outline-variant">
            <h3 className="font-headline-md text-headline-md text-primary font-bold mb-md">Update Status</h3>
            <div className="space-y-lg mb-lg">
              <div>
                <label className="block font-label-lg mb-xs">Select Status</label>
                <select 
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full p-md border border-outline-variant rounded-lg bg-white outline-none"
                  disabled={updating}
                >
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">Work in Progress</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>
            </div>
            <div className="flex gap-md">
              <button 
                onClick={() => setShowStatusModal(false)}
                className="w-full py-md border border-outline-variant rounded-lg font-label-lg"
                disabled={updating}
              >
                Cancel
              </button>
              <button 
                onClick={handleStatusUpdate}
                className="w-full py-md bg-primary text-on-primary rounded-lg font-label-lg hover:opacity-90 disabled:opacity-50"
                disabled={updating}
              >
                {updating ? 'Saving...' : 'Save Status'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

