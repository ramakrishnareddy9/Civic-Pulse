import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import * as adminApi from '@/api/admin'
import { useNotification } from '@hooks/useNotification'

export default function AdminOfficers() {
  const [officers, setOfficers] = useState([])
  const [departments, setDepartments] = useState([])
  const [wards, setWards] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('All')

  // Onboard/Edit modal states
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ 
    email: '', 
    fullName: '', 
    password: '', 
    departmentId: '', 
    wardId: '',
    designation: 'Field Officer'
  })

  // Deactivate states
  const [confirmItem, setConfirmItem] = useState(null)
  const [confirmLoading, setConfirmLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const { success, error: showError } = useNotification()

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    setLoading(true)
    try {
      const [ofs, deps, wds] = await Promise.all([
        adminApi.fetchOfficers(), 
        adminApi.fetchDepartments(), 
        adminApi.fetchWards()
      ])
      setOfficers(ofs || [])
      setDepartments(deps || [])
      setWards(wds || [])
    } catch (err) {
      showError('Failed to load officers directory')
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    setEditing(null)
    setForm({ 
      email: '', 
      fullName: '', 
      password: '', 
      departmentId: '', 
      wardId: '',
      designation: 'Field Officer'
    })
    setShowModal(true)
  }

  const openEdit = (o) => {
    setEditing(o)
    setForm({ 
      email: o.email, 
      fullName: o.fullName, 
      password: '', 
      departmentId: o.departmentId || '', 
      wardId: o.wardId || '',
      designation: o.designation || 'Field Officer'
    })
    setShowModal(true)
  }

  const submit = async () => {
    if (!form.email || !form.fullName) {
      showError('Email and full name are required')
      return
    }

    setSaving(true)
    try {
      if (editing) {
        await adminApi.reassignOfficer(editing.id, form.wardId || null, form.departmentId || null)
        success('Officer reassignment updated successfully!')
      } else {
        await adminApi.onboardOfficer(form)
        success('New officer onboarded successfully!')
      }
      setShowModal(false)
      await load()
    } catch (err) {
      showError('Failed to save officer settings')
    } finally {
      setSaving(false)
    }
  }

  const handleDeactivateClick = (o) => {
    setConfirmItem({ id: o.id, name: o.fullName })
  }

  const doDeactivate = async () => {
    const id = confirmItem?.id
    if (!id) return
    setConfirmLoading(true)
    try {
      await adminApi.deactivateOfficer(id)
      setOfficers((prev) => prev.filter((o) => o.id !== id))
      success('Officer credentials deactivated successfully')
      setConfirmItem(null)
    } catch (err) {
      showError('Failed to deactivate officer credentials')
    } finally {
      setConfirmLoading(false)
    }
  }

  // Filter officers list
  const filteredOfficers = officers.filter(o => {
    const matchesSearch = 
      o.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.departmentName && o.departmentName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (o.wardName && o.wardName.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesDept = 
      selectedDeptFilter === 'All' || 
      o.departmentName === selectedDeptFilter

    return matchesSearch && matchesDept
  })

  // Get department options
  const deptList = Array.from(new Set(officers.map(o => o.departmentName).filter(Boolean)))

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-sm">
          <span className="material-symbols-outlined text-4xl animate-spin text-primary">sync</span>
          <p className="text-body-md font-semibold text-primary">Assembling personnel roster...</p>
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
              <span className="material-symbols-outlined font-bold">shield_person</span>
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
              className="flex items-center gap-md px-md py-3 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface rounded-lg transition-all duration-200"
            >
              <span className="material-symbols-outlined">domain</span>
              <span className="font-label-md text-label-md">Manage Departments</span>
            </Link>

            <Link 
              to="/admin/officers" 
              className="flex items-center gap-md px-md py-3 bg-secondary-container text-on-secondary-container rounded-lg font-bold transition-all duration-200 shadow-sm"
            >
              <span className="material-symbols-outlined">badge</span>
              <span className="font-label-md text-label-md font-bold">Manage Officers</span>
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
                <span className="text-primary font-bold">User Roster &amp; Permissions</span>
              </nav>
              <h1 className="font-headline-lg text-headline-lg text-primary font-bold">Personnel &amp; Access Controls</h1>
              <p className="font-body-md text-body-md text-on-surface-variant mt-xs max-w-2xl">
                Onboard new department technicians, reassign ward logistics coverage, and adjust operational role permissions.
              </p>
            </div>
            
            <div>
              <button 
                onClick={openCreate}
                className="bg-primary text-on-primary hover:opacity-90 px-lg h-12 rounded-lg font-label-lg font-bold flex items-center gap-sm shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <span className="material-symbols-outlined">person_add</span> Onboard Officer
              </button>
            </div>
          </header>

          {/* Asymmetric Metrics Overview Banner */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-lg mb-lg">
            
            <div className="col-span-1 md:col-span-2 bg-white border border-outline-variant p-lg rounded-xl flex items-center justify-between shadow-sm">
              <div className="text-left">
                <p className="text-outline font-bold text-xs uppercase tracking-wider">Total Active Technicians</p>
                <p className="text-3xl font-bold text-primary mt-sm">{officers.length}</p>
                <span className="text-[12px] text-green-600 flex items-center gap-xs font-bold mt-sm">
                  <span className="material-symbols-outlined text-[14px] font-bold">trending_up</span> All verified municipal crew
                </span>
              </div>
              <div className="w-16 h-16 bg-primary-fixed rounded-full flex items-center justify-center text-on-primary-fixed">
                <span className="material-symbols-outlined text-3xl">diversity_3</span>
              </div>
            </div>

            <div className="bg-white border border-outline-variant p-lg rounded-xl flex flex-col justify-between shadow-sm">
              <p className="text-outline font-bold text-xs uppercase tracking-wider">Unassigned Crew</p>
              <div className="flex items-baseline gap-sm mt-sm">
                <p className="text-3xl font-bold text-primary">
                  {officers.filter(o => !o.departmentName || !o.wardName).length}
                </p>
                <p className="text-on-surface-variant text-[12px]">Needs Assignment</p>
              </div>
            </div>

            <div className="bg-white border border-outline-variant p-lg rounded-xl flex flex-col justify-between shadow-sm">
              <p className="text-outline font-bold text-xs uppercase tracking-wider">Operational Units</p>
              <div className="flex items-baseline gap-sm mt-sm">
                <p className="text-3xl font-bold text-primary">{departments.length}</p>
                <p className="text-on-surface-variant text-[12px]">Departments Active</p>
              </div>
            </div>

          </div>

          {/* Table Directory Box */}
          <div className="bg-white border border-outline-variant rounded-xl shadow-sm overflow-hidden flex flex-col">
            
            {/* Filters Bar */}
            <div className="p-lg border-b border-outline-variant flex flex-col md:flex-row gap-lg justify-between items-center bg-white sticky top-0 z-10">
              
              {/* Search input */}
              <div className="relative w-full md:w-96">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">search</span>
                <input 
                  type="text" 
                  placeholder="Search by name, email, or ward..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-sm bg-surface border border-outline-variant focus:border-primary rounded-lg text-body-md outline-none transition-all placeholder:text-outline"
                />
              </div>

              {/* Department Dropdown Filter */}
              <div className="flex items-center gap-md w-full md:w-auto">
                <div className="flex items-center bg-slate-50 border border-outline-variant rounded-lg px-md h-10 shadow-inner">
                  <span className="material-symbols-outlined text-outline text-md mr-2">filter_list</span>
                  <select 
                    value={selectedDeptFilter}
                    onChange={(e) => setSelectedDeptFilter(e.target.value)}
                    className="bg-transparent border-none text-xs font-bold focus:ring-0 cursor-pointer text-primary outline-none"
                  >
                    <option value="All">All Departments</option>
                    {deptList.map((dName, idx) => (
                      <option key={idx} value={dName}>{dName}</option>
                    ))}
                  </select>
                </div>
              </div>

            </div>

            {/* Table roster contents */}
            <div className="overflow-x-auto">
              {filteredOfficers.length === 0 ? (
                <div className="text-center py-20 text-on-surface-variant flex flex-col items-center justify-center">
                  <span className="material-symbols-outlined text-4xl text-outline mb-sm">manage_accounts</span>
                  <p className="font-bold text-headline-sm">No municipal personnel found</p>
                  <p className="text-xs text-outline mt-xs">Try searching with a different keyword or filter.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 border-b border-outline-variant">
                    <tr>
                      <th className="px-lg py-md font-label-lg text-outline text-xs uppercase tracking-wider">Officer</th>
                      <th className="px-lg py-md font-label-lg text-outline text-xs uppercase tracking-wider">Department</th>
                      <th className="px-lg py-md font-label-lg text-outline text-xs uppercase tracking-wider">Ward Logistics</th>
                      <th className="px-lg py-md font-label-lg text-outline text-xs uppercase tracking-wider">Designation</th>
                      <th className="px-lg py-md font-label-lg text-outline text-xs uppercase tracking-wider">Status</th>
                      <th className="px-lg py-md font-label-lg text-outline text-xs uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/60 font-body-md text-sm text-on-surface bg-white">
                    {filteredOfficers.map((o) => (
                      <tr key={o.id} className="hover:bg-slate-50 transition-colors group">
                        
                        {/* Name and email */}
                        <td className="px-lg py-lg">
                          <div className="flex items-center gap-md">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary shrink-0">
                              {o.fullName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                            </div>
                            <div className="text-left">
                              <p className="font-bold text-primary">{o.fullName}</p>
                              <p className="text-xs text-outline mt-0.5">{o.email}</p>
                            </div>
                          </div>
                        </td>

                        {/* Department Badge */}
                        <td className="px-lg py-lg font-semibold">
                          {o.departmentName ? (
                            <span className="px-md py-0.5 rounded bg-primary-container text-on-primary-container font-bold text-xs uppercase">
                              {o.departmentName}
                            </span>
                          ) : (
                            <span className="text-xs text-outline italic">Unassigned Dept</span>
                          )}
                        </td>

                        {/* Ward logistics badge */}
                        <td className="px-lg py-lg">
                          {o.wardName ? (
                            <span className="px-md py-0.5 rounded bg-secondary-container text-on-secondary-container font-bold text-xs">
                              {o.wardName}
                            </span>
                          ) : (
                            <span className="text-xs text-outline italic">Unassigned Ward</span>
                          )}
                        </td>

                        {/* Designation */}
                        <td className="px-lg py-lg text-on-surface-variant font-medium">
                          {o.designation || 'Field Technician'}
                        </td>

                        {/* Status dot */}
                        <td className="px-lg py-lg">
                          <div className="flex items-center gap-xs">
                            <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                            <span className="font-bold text-xs text-green-700">Active</span>
                          </div>
                        </td>

                        {/* Action buttons */}
                        <td className="px-lg py-lg text-right">
                          <div className="flex items-center justify-end gap-xs">
                            <button 
                              onClick={() => openEdit(o)}
                              className="p-sm text-primary hover:bg-slate-100 rounded-lg transition-colors cursor-pointer border border-outline-variant flex items-center justify-center"
                              title="Reassign Ward/Dept"
                            >
                              <span className="material-symbols-outlined text-[18px]">edit_square</span>
                            </button>
                            <button 
                              onClick={() => handleDeactivateClick(o)}
                              className="p-sm text-error hover:bg-error-container/20 rounded-lg transition-colors cursor-pointer border border-error/20 flex items-center justify-center"
                              title="Deactivate Credentials"
                            >
                              <span className="material-symbols-outlined text-[18px]">block</span>
                            </button>
                          </div>
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Bottom count tracker */}
            <div className="p-lg border-t border-outline-variant flex justify-between items-center bg-slate-50 text-xs font-bold text-outline">
              <span>Showing {filteredOfficers.length} of {officers.length} administrative users</span>
              <span>Central Precinct Command</span>
            </div>

          </div>

        </main>
      </div>

      {/* FOOTER AREA */}
      <footer className="w-full py-lg px-margin-desktop flex flex-col md:flex-row justify-between items-center bg-slate-900 text-slate-300 border-t border-slate-800 z-40 select-none">
        <div className="mb-md md:mb-0 text-left">
          <span className="font-label-lg text-label-lg font-bold text-white tracking-wider">Civic Pulse Personnel Hub</span>
          <p className="text-xs opacity-75 mt-1">© 2026 Civic Pulse Government Solutions. All rights reserved.</p>
        </div>
        <div className="flex flex-wrap gap-lg text-xs font-bold">
          <a className="hover:text-white transition-colors cursor-pointer" href="#" onClick={(e) => e.preventDefault()}>Privacy Policy</a>
          <a className="hover:text-white transition-colors cursor-pointer" href="#" onClick={(e) => e.preventDefault()}>Terms of Service</a>
          <a className="hover:text-white transition-colors cursor-pointer" href="#" onClick={(e) => e.preventDefault()}>System Compliance</a>
        </div>
      </footer>

      {/* MODAL FOR ONBOARD / EDIT & REASSIGNMENT */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
            onClick={() => setShowModal(false)}
          />
          <div className="bg-white p-xl rounded-xl shadow-2xl max-w-md w-full z-10 text-left border border-outline-variant animate-in fade-in zoom-in-95 duration-150 mui-card-shadow">
            
            <div className="flex items-center gap-sm mb-md border-b border-outline-variant/40 pb-sm">
              <span className="material-symbols-outlined text-primary text-xl">
                {editing ? 'manage_accounts' : 'person_add'}
              </span>
              <h3 className="font-headline-md text-headline-md text-primary font-bold">
                {editing ? 'Reassign Staff Member' : 'Onboard Department Technician'}
              </h3>
            </div>

            <div className="space-y-md mb-lg">
              
              {/* Profile Context */}
              {editing && (
                <div className="bg-slate-50 p-md rounded-lg border border-outline-variant/40 mb-md">
                  <p className="text-xs text-outline font-bold uppercase">Staff Target</p>
                  <p className="font-bold text-primary text-sm mt-xs">{editing.fullName}</p>
                  <p className="text-xs text-on-surface-variant mt-0.5">{editing.email}</p>
                </div>
              )}

              {/* Email Address (Disabled if Editing) */}
              {!editing && (
                <div>
                  <label className="block text-xs font-bold text-outline uppercase mb-sm">Email Address</label>
                  <input 
                    type="email" 
                    placeholder="e.g. officer.smith@city.gov"
                    value={form.email}
                    onChange={(e) => setForm(s => ({ ...s, email: e.target.value }))}
                    className="w-full p-md border border-outline-variant focus:border-primary rounded-lg text-body-md outline-none bg-white transition-all placeholder:text-outline"
                    disabled={saving}
                  />
                </div>
              )}

              {/* Full Name (Disabled if Editing) */}
              {!editing && (
                <div>
                  <label className="block text-xs font-bold text-outline uppercase mb-sm">Full Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Officer John Smith"
                    value={form.fullName}
                    onChange={(e) => setForm(s => ({ ...s, fullName: e.target.value }))}
                    className="w-full p-md border border-outline-variant focus:border-primary rounded-lg text-body-md outline-none bg-white transition-all placeholder:text-outline"
                    disabled={saving}
                  />
                </div>
              )}

              {/* Password Input (Only when onboarding new) */}
              {!editing && (
                <div>
                  <label className="block text-xs font-bold text-outline uppercase mb-sm">Account Password</label>
                  <input 
                    type="password" 
                    placeholder="Minimum 8 characters"
                    value={form.password}
                    onChange={(e) => setForm(s => ({ ...s, password: e.target.value }))}
                    className="w-full p-md border border-outline-variant focus:border-primary rounded-lg text-body-md outline-none bg-white transition-all placeholder:text-outline"
                    disabled={saving}
                  />
                </div>
              )}

              {/* Department Selector */}
              <div>
                <label className="block text-xs font-bold text-outline uppercase mb-sm">Department Unit</label>
                <select 
                  value={form.departmentId}
                  onChange={(e) => setForm(s => ({ ...s, departmentId: e.target.value }))}
                  className="w-full p-md border border-outline-variant focus:border-primary rounded-lg bg-white outline-none font-body-md"
                  disabled={saving}
                >
                  <option value="">Unassigned / Dispatch Pool</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              {/* Ward Logistics Sector Selector */}
              <div>
                <label className="block text-xs font-bold text-outline uppercase mb-sm">Ward Logistics Sector</label>
                <select 
                  value={form.wardId}
                  onChange={(e) => setForm(s => ({ ...s, wardId: e.target.value }))}
                  className="w-full p-md border border-outline-variant focus:border-primary rounded-lg bg-white outline-none font-body-md"
                  disabled={saving}
                >
                  <option value="">Unassigned / General Sector</option>
                  {wards.map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>

              {/* Designation Role Title */}
              <div>
                <label className="block text-xs font-bold text-outline uppercase mb-sm">Operational Designation</label>
                <input 
                  type="text" 
                  placeholder="e.g. Field Officer, Triage Supervisor"
                  value={form.designation}
                  onChange={(e) => setForm(s => ({ ...s, designation: e.target.value }))}
                  className="w-full p-md border border-outline-variant focus:border-primary rounded-lg text-body-md outline-none bg-white transition-all placeholder:text-outline"
                  disabled={saving}
                />
              </div>

            </div>

            {/* Action buttons */}
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
                disabled={saving}
              >
                {saving ? (
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

      {/* CONFIRM DEACTIVATION DIALOGUE */}
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
                <h3 className="font-headline-md text-headline-sm text-primary font-bold">Deactivate Staff Access</h3>
                <p className="text-on-surface-variant font-body-md text-sm mt-sm">
                  Are you sure you want to deactivate administrative access for <strong className="text-primary">{confirmItem.name}</strong>?
                </p>
                <p className="text-xs text-error font-medium mt-xs">
                  This actions retracts all assigned dispatch queues and prevents future system onboarding!
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
                onClick={doDeactivate}
                className="w-full py-md bg-error text-on-error hover:opacity-90 rounded-lg font-label-lg font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-xs cursor-pointer shadow-sm"
                disabled={confirmLoading}
              >
                {confirmLoading ? 'Deactivating...' : 'Deactivate'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
