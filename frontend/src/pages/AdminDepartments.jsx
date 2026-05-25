import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import * as adminApi from '@/api/admin'
import { useNotification } from '@hooks/useNotification'

export default function AdminDepartments() {
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('')

  // Modal states
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  // Confirm delete states
  const [confirmItem, setConfirmItem] = useState(null)
  const [confirmLoading, setConfirmLoading] = useState(false)

  const { success, error: showError } = useNotification()

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    setLoading(true)
    try {
      const data = await adminApi.fetchDepartments()
      setDepartments(data || [])
    } catch (err) {
      showError('Failed to load department directory')
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    setEditing(null)
    setName('')
    setDescription('')
    setShowModal(true)
  }

  const openEdit = (dept) => {
    setEditing(dept)
    setName(dept.name)
    setDescription(dept.description || 'General administrative operations')
    setShowModal(true)
  }

  const submit = async () => {
    if (!name.trim()) {
      showError('Department name is required')
      return
    }

    setSaving(true)
    try {
      if (editing) {
        const updated = await adminApi.updateDepartment(editing.id, { name, description })
        setDepartments((prev) => prev.map((d) => (d.id === editing.id ? { ...d, name, description } : d)))
        success('Department settings updated successfully!')
      } else {
        const created = await adminApi.createDepartment({ name, description })
        setDepartments((prev) => [
          { id: created.id || Date.now(), name, description },
          ...prev
        ])
        success('New department created successfully!')
      }
      setShowModal(false)
    } catch (err) {
      showError('Failed to save department')
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveClick = (dept) => {
    setConfirmItem({ id: dept.id, name: dept.name })
  }

  const doDelete = async () => {
    const id = confirmItem?.id
    if (!id) return
    setConfirmLoading(true)
    try {
      await adminApi.deleteDepartment(id)
      setDepartments((prev) => prev.filter((d) => d.id !== id))
      success('Department deleted successfully')
      setConfirmItem(null)
    } catch (err) {
      showError('Failed to delete department')
    } finally {
      setConfirmLoading(false)
    }
  }

  // Filter departments list
  const filteredDepartments = departments.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (d.description && d.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-sm">
          <span className="material-symbols-outlined text-4xl animate-spin text-primary">sync</span>
          <p className="text-body-md font-semibold text-primary">Loading department assets...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col font-body-md text-left relative">
      <div className="flex flex-grow relative">
        
        {/* SIDEBAR NAVIGATION - FIXED & SLEEK */}
        <aside className="hidden md:flex h-[calc(100vh-64px)] w-72 flex-col bg-surface-container-low border-r border-outline-variant fixed left-0 top-16 p-md gap-sm z-30">
          <div className="flex items-center gap-md p-md mb-md">
            <div className="h-10 w-10 bg-primary-container rounded-lg flex items-center justify-center text-on-primary-container">
              <span className="material-symbols-outlined font-bold">domain</span>
            </div>
            <div>
              <h2 className="font-label-lg text-label-lg text-on-surface font-bold">Admin Console</h2>
              <p className="text-xs text-on-surface-variant">Metropolitan Command</p>
            </div>
          </div>

          <nav className="flex flex-col gap-xs flex-grow">
            <Link 
              to="/admin/dashboard" 
              className="flex items-center gap-md px-md py-3 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface rounded-lg transition-all duration-200"
            >
              <span className="material-symbols-outlined">dashboard</span>
              <span className="font-label-md text-label-md">KPI Dashboard</span>
            </Link>

            <Link 
              to="/admin/departments" 
              className="flex items-center gap-md px-md py-3 bg-secondary-container text-on-secondary-container rounded-lg font-bold transition-all duration-200 shadow-sm"
            >
              <span className="material-symbols-outlined">domain</span>
              <span className="font-label-md text-label-md font-bold">Manage Departments</span>
            </Link>

            <Link 
              to="/admin/officers" 
              className="flex items-center gap-md px-md py-3 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface rounded-lg transition-all duration-200"
            >
              <span className="material-symbols-outlined">badge</span>
              <span className="font-label-md text-label-md">Manage Officers</span>
            </Link>

            <Link 
              to="/admin/wards" 
              className="flex items-center gap-md px-md py-3 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface rounded-lg transition-all duration-200"
            >
              <span className="material-symbols-outlined">map</span>
              <span className="font-label-md text-label-md">Manage Wards</span>
            </Link>

            <Link 
              to="/notifications" 
              className="flex items-center gap-md px-md py-3 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface rounded-lg transition-all duration-200"
            >
              <span className="material-symbols-outlined">notifications</span>
              <span className="font-label-md text-label-md">Alert Dispatch Center</span>
            </Link>
          </nav>

          <div className="flex flex-col gap-xs pt-md border-t border-outline-variant mt-md">
            <div className="px-md py-xs text-xs text-outline font-bold uppercase">System Health</div>
            <div className="px-md py-sm flex items-center justify-between text-xs text-on-surface-variant">
              <span>Database Server</span>
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
            </div>
            <div className="px-md py-sm flex items-center justify-between text-xs text-on-surface-variant">
              <span>ElasticSearch Server</span>
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
            </div>
          </div>
        </aside>

        {/* MAIN CANVAS BODY */}
        <main className="flex-1 md:pl-72 p-md md:p-xl bg-slate-50 min-h-[calc(100vh-64px)] overflow-x-hidden">
          
          {/* Header Action Row */}
          <header className="flex flex-col xl:flex-row xl:items-end justify-between gap-md mb-lg">
            <div>
              <nav className="flex items-center gap-xs text-on-surface-variant font-label-md text-label-md mb-sm">
                <span>Management</span>
                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                <span className="text-primary font-bold">Departments Directory</span>
              </nav>
              <h1 className="font-headline-lg text-headline-lg text-primary font-bold">Administrative Units</h1>
              <p className="font-body-md text-body-md text-on-surface-variant mt-xs max-w-2xl">
                Define operational municipal branches, assign workflow policies, and monitor department coverage profiles.
              </p>
            </div>
            
            <div>
              <button 
                onClick={openCreate}
                className="bg-primary text-on-primary hover:opacity-90 px-lg h-12 rounded-lg font-label-lg font-bold flex items-center gap-sm shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <span className="material-symbols-outlined">add</span> Create Department
              </button>
            </div>
          </header>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-lg mb-lg">
            
            <div className="bg-white border border-outline-variant p-lg rounded-xl flex items-center justify-between shadow-sm">
              <div className="text-left">
                <p className="text-outline font-bold text-xs uppercase tracking-wider">Active Departments</p>
                <p className="text-3xl font-bold text-primary mt-sm">{departments.length}</p>
              </div>
              <div className="w-12 h-12 bg-primary-container rounded-lg flex items-center justify-center text-on-primary-container">
                <span className="material-symbols-outlined text-2xl">domain</span>
              </div>
            </div>

            <div className="bg-white border border-outline-variant p-lg rounded-xl flex items-center justify-between shadow-sm">
              <div className="text-left">
                <p className="text-outline font-bold text-xs uppercase tracking-wider">Unassigned Cases</p>
                <p className="text-3xl font-bold text-amber-500 mt-sm">5</p>
              </div>
              <div className="w-12 h-12 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600">
                <span className="material-symbols-outlined text-2xl">error</span>
              </div>
            </div>

            <div className="bg-white border border-outline-variant p-lg rounded-xl flex items-center justify-between shadow-sm">
              <div className="text-left">
                <p className="text-outline font-bold text-xs uppercase tracking-wider">Resolution SLA Target</p>
                <p className="text-3xl font-bold text-green-700 mt-sm">94%</p>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center text-green-600">
                <span className="material-symbols-outlined text-2xl">done_all</span>
              </div>
            </div>

          </div>

          {/* Table Container */}
          <div className="bg-white border border-outline-variant rounded-xl shadow-sm overflow-hidden flex flex-col">
            
            {/* Search Box */}
            <div className="p-lg border-b border-outline-variant bg-white sticky top-0 z-10">
              <div className="relative w-full md:w-96">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">search</span>
                <input 
                  type="text" 
                  placeholder="Search departments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-sm bg-surface border border-outline-variant focus:border-primary rounded-lg text-body-md outline-none transition-all placeholder:text-outline"
                />
              </div>
            </div>

            {/* Table roster contents */}
            <div className="overflow-x-auto">
              {filteredDepartments.length === 0 ? (
                <div className="text-center py-20 text-on-surface-variant flex flex-col items-center justify-center">
                  <span className="material-symbols-outlined text-4xl text-outline mb-sm">domain_disabled</span>
                  <p className="font-bold text-headline-sm">No departments found</p>
                  <p className="text-xs text-outline mt-xs">Create a new department unit to begin assigning cases.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 border-b border-outline-variant">
                    <tr>
                      <th className="px-lg py-md font-label-lg text-outline text-xs uppercase tracking-wider">Department ID</th>
                      <th className="px-lg py-md font-label-lg text-outline text-xs uppercase tracking-wider">Name</th>
                      <th className="px-lg py-md font-label-lg text-outline text-xs uppercase tracking-wider">Description</th>
                      <th className="px-lg py-md font-label-lg text-outline text-xs uppercase tracking-wider">Status</th>
                      <th className="px-lg py-md font-label-lg text-outline text-xs uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/60 font-body-md text-sm text-on-surface bg-white">
                    {filteredDepartments.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-lg py-lg font-bold text-outline">#DEP-{d.id}</td>
                        <td className="px-lg py-lg font-bold text-primary">{d.name}</td>
                        <td className="px-lg py-lg text-on-surface-variant">
                          {d.description || 'General administrative operations'}
                        </td>
                        <td className="px-lg py-lg">
                          <div className="flex items-center gap-xs">
                            <span className="w-2 h-2 rounded-full bg-green-500" />
                            <span className="font-bold text-xs text-green-700">Active</span>
                          </div>
                        </td>
                        <td className="px-lg py-lg text-right">
                          <div className="flex items-center justify-end gap-xs">
                            <button 
                              onClick={() => openEdit(d)}
                              className="p-sm text-primary hover:bg-slate-100 rounded-lg transition-colors cursor-pointer border border-outline-variant flex items-center justify-center"
                              title="Edit Department"
                            >
                              <span className="material-symbols-outlined text-[18px]">edit_square</span>
                            </button>
                            <button 
                              onClick={() => handleRemoveClick(d)}
                              className="p-sm text-error hover:bg-error-container/20 rounded-lg transition-colors cursor-pointer border border-error/20 flex items-center justify-center"
                              title="Delete Department"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Table Footer */}
            <div className="p-lg border-t border-outline-variant flex justify-between items-center bg-slate-50 text-xs font-bold text-outline">
              <span>Showing {filteredDepartments.length} of {departments.length} department entries</span>
            </div>

          </div>

        </main>
      </div>

      {/* FOOTER */}
      <footer className="w-full py-lg px-margin-desktop flex flex-col md:flex-row justify-between items-center bg-slate-900 text-slate-300 border-t border-slate-800 z-40 select-none md:pl-72">
        <div className="mb-md md:mb-0 text-left px-md">
          <span className="font-label-lg text-label-lg font-bold text-white tracking-wider">Civic Pulse Governance Panel</span>
          <p className="text-xs opacity-75 mt-1">© 2026 Civic Pulse Government Solutions. All rights reserved.</p>
        </div>
        <div className="flex flex-wrap gap-lg text-xs font-bold px-md">
          <a className="hover:text-white transition-colors cursor-pointer" href="#" onClick={(e) => e.preventDefault()}>Privacy Policy</a>
          <a className="hover:text-white transition-colors cursor-pointer" href="#" onClick={(e) => e.preventDefault()}>Terms of Service</a>
        </div>
      </footer>

      {/* CREATE / EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
            onClick={() => setShowModal(false)}
          />
          <div className="bg-white p-xl rounded-xl shadow-2xl max-w-md w-full z-10 text-left border border-outline-variant animate-in fade-in zoom-in-95 duration-150 mui-card-shadow">
            
            <div className="flex items-center gap-sm mb-md border-b border-outline-variant/40 pb-sm">
              <span className="material-symbols-outlined text-primary text-xl">domain</span>
              <h3 className="font-headline-md text-headline-md text-primary font-bold">
                {editing ? 'Edit Department' : 'Create Department'}
              </h3>
            </div>

            <div className="space-y-md mb-lg">
              <div>
                <label className="block text-xs font-bold text-outline uppercase mb-sm">Department Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Public Works"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-md border border-outline-variant focus:border-primary rounded-lg text-body-md outline-none bg-white transition-all placeholder:text-outline"
                  disabled={saving}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-outline uppercase mb-sm">Description (Optional)</label>
                <textarea 
                  placeholder="Operational responsibilities and service catalog details..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-lg border border-outline-variant focus:border-primary font-body-md p-md h-24 resize-none outline-none" 
                  disabled={saving}
                />
              </div>
            </div>

            <div className="flex gap-md border-t border-outline-variant/40 pt-md">
              <button 
                onClick={() => setShowModal(false)}
                className="w-full py-md border border-outline-variant hover:bg-surface-container rounded-lg font-label-lg font-bold text-on-surface transition-colors cursor-pointer"
                disabled={saving}
              >
                Cancel
              </button>
              <button 
                onClick={submit}
                className="w-full py-md bg-primary text-on-primary hover:opacity-90 rounded-lg font-label-lg font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-xs cursor-pointer shadow-sm"
                disabled={saving || !name.trim()}
              >
                {saving ? 'Saving...' : 'Save Department'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {confirmItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
            onClick={() => setConfirmItem(null)}
          />
          <div className="bg-white p-xl rounded-xl shadow-2xl max-w-sm w-full z-10 text-left border border-outline-variant mui-card-shadow">
            <div className="flex items-start gap-md mb-md">
              <span className="material-symbols-outlined text-error text-2xl">warning</span>
              <div>
                <h3 className="font-headline-md text-headline-sm text-primary font-bold">Delete Department</h3>
                <p className="text-on-surface-variant font-body-md text-sm mt-sm">
                  Are you sure you want to delete the department <strong className="text-primary">{confirmItem.name}</strong>?
                </p>
                <p className="text-xs text-error font-medium mt-xs">
                  This action cannot be undone. Any active cases will lose their department routing!
                </p>
              </div>
            </div>
            
            <div className="flex gap-md mt-lg border-t border-outline-variant/40 pt-md">
              <button 
                onClick={() => setConfirmItem(null)}
                className="w-full py-md border border-outline-variant hover:bg-surface-container rounded-lg font-label-lg font-bold transition-colors cursor-pointer"
                disabled={confirmLoading}
              >
                Cancel
              </button>
              <button 
                onClick={doDelete}
                className="w-full py-md bg-error text-on-error hover:opacity-90 rounded-lg font-label-lg font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-xs cursor-pointer shadow-sm"
                disabled={confirmLoading}
              >
                {confirmLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
