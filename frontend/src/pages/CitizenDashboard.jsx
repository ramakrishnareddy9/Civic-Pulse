import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useComplaints } from '@hooks/useComplaints'
import { useAuth } from '@hooks/useAuth'
import { ROUTES } from '@utils/constants'

const CATEGORY_MAP = {
  POTHOLE: 'Roads & Potholes',
  STREETLIGHT: 'Street Lighting',
  DRAINAGE: 'Drainage & Water',
  POLLUTION: 'Pollution & Sanitation',
  TRAFFIC: 'Traffic Concern',
  TREE: 'Tree & Vegetation',
  WATER: 'Water Supply',
  ELECTRICITY: 'Electricity',
  Infrastructure: 'Infrastructure',
  OTHER: 'Other',
}

const STATUS_CONFIG = {
  OPEN: { label: 'Open', badge: 'badge-open', dot: '#92400e', icon: 'pending' },
  IN_PROGRESS: { label: 'In Progress', badge: 'badge-in-progress', dot: '#1e40af', icon: 'autorenew' },
  RESOLVED: { label: 'Resolved', badge: 'badge-resolved', dot: '#065f46', icon: 'check_circle' },
  CLOSED: { label: 'Closed', badge: 'badge-closed', dot: '#475569', icon: 'archive' },
}

const WARD_OPTIONS = [
  { value: 'WARD_1', label: 'Ward 01 – North' },
  { value: 'WARD_2', label: 'Ward 02 – Central' },
  { value: 'WARD_3', label: 'Ward 03 – East' },
  { value: 'WARD_4', label: 'Ward 04 – West' },
  { value: 'WARD_5', label: 'Ward 05 – South' },
  { value: 'Ward 08', label: 'Ward 08 – Commercial' },
  { value: 'Ward 11', label: 'Ward 11 – Metro Center' },
  { value: 'Ward 02', label: 'Ward 02 – South District' },
]

export function CitizenDashboard() {
  const { complaints, loading, error, fetchComplaints } = useComplaints()
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [selectedWard, setSelectedWard] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  useEffect(() => {
    fetchComplaints()
  }, [])

  const handleResetFilters = () => {
    setSearchTerm('')
    setSelectedCategory('')
    setSelectedStatus('')
    setSelectedWard('')
    setCurrentPage(1)
  }

  const allComplaints = complaints || []

  const filteredComplaints = allComplaints.filter(c => {
    const term = searchTerm.toLowerCase()
    const matchesKeyword = !searchTerm || c.title?.toLowerCase().includes(term) || String(c.id).includes(searchTerm)
    const matchesCategory = !selectedCategory || c.category === selectedCategory
    const matchesStatus = !selectedStatus || c.status === selectedStatus
    const matchesWard = !selectedWard || c.ward === selectedWard
    return matchesKeyword && matchesCategory && matchesStatus && matchesWard
  })

  const totalPages = Math.ceil(filteredComplaints.length / itemsPerPage) || 1
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredComplaints.slice(indexOfFirstItem, indexOfLastItem)

  // Summary stats
  const stats = {
    total: allComplaints.length,
    open: allComplaints.filter(c => c.status === 'OPEN').length,
    inProgress: allComplaints.filter(c => c.status === 'IN_PROGRESS').length,
    resolved: allComplaints.filter(c => c.status === 'RESOLVED').length,
  }
  const resolutionRate = stats.total ? Math.round((stats.resolved / stats.total) * 100) : 0

  const handleExportCSV = () => {
    if (!filteredComplaints.length) return
    const headers = ['Ref #', 'Title', 'Category', 'Status', 'Ward', 'Submitted']
    const rows = filteredComplaints.map(c => [
      `CP-${c.id}`,
      `"${(c.title || '').replace(/"/g, '""')}"`,
      CATEGORY_MAP[c.category] || c.category || '',
      c.status || '',
      c.ward || '',
      c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '',
    ])
    const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const link = document.createElement('a')
    link.setAttribute('href', encodeURI(csv))
    link.setAttribute('download', `complaints_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const StatusBadge = ({ status }) => {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.OPEN
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${cfg.badge}`}>
        <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>{cfg.icon}</span>
        {cfg.label}
      </span>
    )
  }

  const categoryOptions = Object.entries(CATEGORY_MAP)

  return (
    <div style={{ background: 'var(--gov-surface)', minHeight: 'calc(100vh - 56px)' }}>
      <main className="max-w-[1312px] mx-auto px-4 md:px-8 py-8">

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 animate-fade-in">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-sm" style={{ color: 'var(--gov-text-muted)' }}>chevron_right</span>
              <span className="text-sm text-gray-500">
                Welcome back, <span className="font-semibold" style={{ color: 'var(--gov-navy)' }}>{user?.fullName?.split(' ')[0] || 'Citizen'}</span>
              </span>
            </div>
            <h1 className="text-2xl font-black" style={{ color: 'var(--gov-navy)' }}>My Complaints</h1>
            <p className="text-sm text-gray-500 mt-0.5">Track, manage, and export your submitted grievances.</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleExportCSV}
              disabled={filteredComplaints.length === 0}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all hover:shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ borderColor: 'var(--gov-border)', color: 'var(--gov-navy)', background: 'white' }}
            >
              <span className="material-symbols-outlined text-base">download</span>
              Export CSV
            </button>
            <Link
              to={ROUTES.CITIZEN.SUBMIT_COMPLAINT}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90 hover:shadow-md"
              style={{ background: 'var(--gov-navy)', color: 'white', boxShadow: '0 2px 8px rgba(10,35,66,0.25)' }}
            >
              <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>add_circle</span>
              New Complaint
            </Link>
          </div>
        </div>

        {/* Stats Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 animate-slide-up">
          {[
            { label: 'Total Submitted', value: stats.total, icon: 'receipt_long', accent: 'var(--gov-navy)', accentBg: 'rgba(10,35,66,0.07)' },
            { label: 'Open', value: stats.open, icon: 'pending', accent: '#d97706', accentBg: '#fef3c7' },
            { label: 'In Progress', value: stats.inProgress, icon: 'autorenew', accent: '#1e40af', accentBg: '#dbeafe' },
            { label: 'Resolved', value: stats.resolved, icon: 'check_circle', accent: '#166534', accentBg: '#dcfce7' },
          ].map((s, i) => (
            <div
              key={i}
              className="rounded-2xl border p-5 bg-white transition-all hover:shadow-md"
              style={{ borderColor: 'var(--gov-border)' }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: s.accentBg }}>
                  <span className="material-symbols-outlined text-xl" style={{ color: s.accent, fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
                </div>
                {i === 3 && stats.total > 0 && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: '#dcfce7', color: '#166534' }}>
                    {resolutionRate}%
                  </span>
                )}
              </div>
              <p className="text-3xl font-black" style={{ color: 'var(--gov-navy)' }}>{s.value}</p>
              <p className="text-xs text-gray-500 font-medium mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filters Bar */}
        <div
          className="rounded-2xl border bg-white p-5 mb-5 animate-fade-in"
          style={{ borderColor: 'var(--gov-border)' }}
        >
          <div className="flex flex-wrap gap-4 items-end">
            {/* Search */}
            <div className="flex-1 min-w-[240px]">
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-gray-500">Search</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none">search</span>
                <input
                  value={searchTerm}
                  onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1) }}
                  className="gov-input pl-10"
                  placeholder="Complaint ID or title..."
                  type="text"
                />
              </div>
            </div>

            {/* Category */}
            <div className="min-w-[170px]">
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-gray-500">Category</label>
              <select
                value={selectedCategory}
                onChange={e => { setSelectedCategory(e.target.value); setCurrentPage(1) }}
                className="gov-input"
                style={{ paddingRight: '12px' }}
              >
                <option value="">All Categories</option>
                {categoryOptions.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>

            {/* Status */}
            <div className="min-w-[150px]">
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-gray-500">Status</label>
              <select
                value={selectedStatus}
                onChange={e => { setSelectedStatus(e.target.value); setCurrentPage(1) }}
                className="gov-input"
              >
                <option value="">Any Status</option>
                {Object.entries(STATUS_CONFIG).map(([v, cfg]) => <option key={v} value={v}>{cfg.label}</option>)}
              </select>
            </div>

            {/* Ward */}
            <div className="min-w-[170px]">
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-gray-500">Ward</label>
              <select
                value={selectedWard}
                onChange={e => { setSelectedWard(e.target.value); setCurrentPage(1) }}
                className="gov-input"
              >
                <option value="">All Wards</option>
                {WARD_OPTIONS.map(w => <option key={w.value} value={w.value}>{w.label}</option>)}
              </select>
            </div>

            {/* Reset */}
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-colors hover:bg-gray-50"
              style={{ borderColor: 'var(--gov-border)', color: 'var(--gov-text-muted)' }}
            >
              <span className="material-symbols-outlined text-base">filter_alt_off</span>
              Reset
            </button>
          </div>
        </div>

        {/* Results count */}
        {!loading && !error && (
          <div className="flex items-center justify-between mb-3 px-1">
            <p className="text-sm text-gray-500">
              Showing <span className="font-bold" style={{ color: 'var(--gov-navy)' }}>
                {filteredComplaints.length > 0 ? `${indexOfFirstItem + 1}–${Math.min(indexOfLastItem, filteredComplaints.length)}` : '0'}
              </span> of <span className="font-bold" style={{ color: 'var(--gov-navy)' }}>{filteredComplaints.length}</span> complaints
            </p>
            {(searchTerm || selectedCategory || selectedStatus || selectedWard) && (
              <button
                onClick={handleResetFilters}
                className="text-xs font-semibold hover:underline"
                style={{ color: 'var(--gov-blue)' }}
              >
                Clear all filters
              </button>
            )}
          </div>
        )}

        {/* Data Table */}
        {loading ? (
          <div className="rounded-2xl border bg-white overflow-hidden" style={{ borderColor: 'var(--gov-border)' }}>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="px-6 py-4 border-b flex items-center gap-4" style={{ borderColor: '#f1f4f8' }}>
                <div className="skeleton h-4 w-16 rounded" />
                <div className="skeleton h-4 flex-1 rounded" />
                <div className="skeleton h-4 w-24 rounded" />
                <div className="skeleton h-6 w-20 rounded-full" />
                <div className="skeleton h-4 w-20 rounded" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl border bg-white p-12 text-center" style={{ borderColor: 'var(--gov-border)' }}>
            <span className="material-symbols-outlined text-5xl mb-3" style={{ color: '#ef4444' }}>error_outline</span>
            <p className="font-bold text-lg mb-1" style={{ color: 'var(--gov-navy)' }}>Failed to Load Complaints</p>
            <p className="text-sm text-gray-500 mb-4">{error}</p>
            <button onClick={fetchComplaints} className="gov-btn-primary">
              <span className="material-symbols-outlined text-sm">refresh</span>
              Retry
            </button>
          </div>
        ) : currentItems.length === 0 ? (
          <div className="rounded-2xl border bg-white p-16 text-center" style={{ borderColor: 'var(--gov-border)' }}>
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(10,35,66,0.06)' }}>
              <span className="material-symbols-outlined text-4xl" style={{ color: 'var(--gov-text-light)' }}>inbox</span>
            </div>
            <p className="font-bold text-lg mb-1" style={{ color: 'var(--gov-navy)' }}>
              {allComplaints.length === 0 ? 'No Complaints Yet' : 'No Results Found'}
            </p>
            <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">
              {allComplaints.length === 0
                ? 'You haven\'t submitted any complaints yet. Use the button below to report your first civic issue.'
                : 'No complaints match your current filter criteria. Try adjusting your search.'}
            </p>
            {allComplaints.length === 0 ? (
              <Link to={ROUTES.CITIZEN.SUBMIT_COMPLAINT} className="gov-btn-primary" style={{ textDecoration: 'none', display: 'inline-flex' }}>
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>add_circle</span>
                Submit First Complaint
              </Link>
            ) : (
              <button onClick={handleResetFilters} className="gov-btn-outline">Clear Filters</button>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border bg-white overflow-hidden" style={{ borderColor: 'var(--gov-border)' }}>
            <div className="overflow-x-auto">
              <table className="gov-table">
                <thead>
                  <tr>
                    <th>Ref #</th>
                    <th>Complaint Title</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Submitted</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map(c => (
                    <tr key={c.id} className="hover:bg-blue-50/30 transition-colors">
                      <td>
                        <span className="font-bold text-xs px-2 py-1 rounded" style={{ background: 'rgba(10,35,66,0.06)', color: 'var(--gov-navy)' }}>
                          #CP-{c.id}
                        </span>
                      </td>
                      <td>
                        <p className="font-semibold text-sm" style={{ color: 'var(--gov-text)' }}>{c.title}</p>
                        {c.location && (
                          <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">location_on</span>
                            {c.location}
                          </p>
                        )}
                        {c.ward && !c.location && (
                          <p className="text-xs text-gray-400 mt-0.5">{c.ward}</p>
                        )}
                      </td>
                      <td>
                        <span className="text-sm text-gray-600">{CATEGORY_MAP[c.category] || c.category || '—'}</span>
                      </td>
                      <td>
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="text-sm text-gray-500">
                        {c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                      <td className="text-right">
                        <Link
                          to={`/citizen/complaints/${c.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all hover:shadow-sm"
                          style={{ borderColor: 'var(--gov-navy)', color: 'var(--gov-navy)' }}
                        >
                          View
                          <span className="material-symbols-outlined text-xs">arrow_forward</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 flex items-center justify-between border-t" style={{ borderColor: 'var(--gov-border)', background: 'var(--gov-surface)' }}>
                <p className="text-xs text-gray-500">
                  Page <span className="font-bold">{currentPage}</span> of <span className="font-bold">{totalPages}</span>
                </p>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border transition-colors hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{ borderColor: 'var(--gov-border)' }}
                  >
                    <span className="material-symbols-outlined text-sm">chevron_left</span>
                  </button>
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    const page = i + 1
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-colors"
                        style={{
                          background: currentPage === page ? 'var(--gov-navy)' : 'white',
                          color: currentPage === page ? 'white' : 'var(--gov-text-muted)',
                          border: `1px solid ${currentPage === page ? 'var(--gov-navy)' : 'var(--gov-border)'}`,
                        }}
                      >
                        {page}
                      </button>
                    )
                  })}
                  <button
                    onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border transition-colors hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{ borderColor: 'var(--gov-border)' }}
                  >
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div
            className="rounded-2xl border p-5 flex items-start gap-4"
            style={{ background: '#fff7ed', borderColor: '#fed7aa' }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#ffedd5' }}>
              <span className="material-symbols-outlined text-xl" style={{ color: '#ea580c', fontVariationSettings: "'FILL' 1" }}>emergency</span>
            </div>
            <div>
              <h3 className="font-bold text-sm mb-1" style={{ color: '#9a3412' }}>Emergency Alert</h3>
              <p className="text-sm" style={{ color: '#c2410c' }}>
                For life-threatening emergencies, call <strong>100</strong> (Police), <strong>101</strong> (Fire), or <strong>108</strong> (Medical). Do not use this portal.
              </p>
            </div>
          </div>
          <div
            className="rounded-2xl border p-5 flex items-start gap-4"
            style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#dcfce7' }}>
              <span className="material-symbols-outlined text-xl" style={{ color: '#16a34a', fontVariationSettings: "'FILL' 1" }}>notifications_active</span>
            </div>
            <div>
              <h3 className="font-bold text-sm mb-1" style={{ color: '#166534' }}>Stay Informed</h3>
              <p className="text-sm" style={{ color: '#15803d' }}>
                You'll receive SMS and email notifications whenever your complaint status changes. Track progress in real-time.
              </p>
            </div>
          </div>
        </div>

      </main>
    </div>
  )
}
