import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useComplaints } from '@hooks/useComplaints'
import { ROUTES } from '@utils/constants'

export function CitizenDashboard() {
  const { complaints, loading, error, fetchComplaints } = useComplaints()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [selectedWard, setSelectedWard] = useState('')

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

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

  // Filter complaints locally for smooth dynamic search
  const filteredComplaints = (complaints || []).filter((c) => {
    const titleMatch = c.title?.toLowerCase().includes(searchTerm.toLowerCase())
    const idMatch = c.id?.toString().includes(searchTerm)
    const matchesKeyword = titleMatch || idMatch || !searchTerm

    const matchesCategory = selectedCategory ? c.category === selectedCategory : true
    const matchesStatus = selectedStatus ? c.status === selectedStatus : true
    const matchesWard = selectedWard ? c.ward === selectedWard : true

    return matchesKeyword && matchesCategory && matchesStatus && matchesWard
  })

  // Pagination logic
  const totalItems = filteredComplaints.length
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredComplaints.slice(indexOfFirstItem, indexOfLastItem)

  const handleExportCSV = () => {
    if (!filteredComplaints.length) return
    const headers = ['Ref #', 'Title', 'Description', 'Category', 'Status', 'Ward', 'Location', 'Submitted Date']
    const rows = filteredComplaints.map(c => [
      c.id,
      `"${c.title?.replace(/"/g, '""') || ''}"`,
      `"${c.description?.replace(/"/g, '""') || ''}"`,
      c.category,
      c.status,
      c.ward,
      `"${c.location?.replace(/"/g, '""') || ''}"`,
      c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ''
    ])

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `citizen_complaints_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getStatusBadge = (status) => {
    const badges = {
      OPEN: { bg: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-700' },
      IN_PROGRESS: { bg: 'bg-blue-100 text-blue-700 border-blue-200', dot: 'bg-blue-700' },
      RESOLVED: { bg: 'bg-green-100 text-green-700 border-green-200', dot: 'bg-green-700' },
      CLOSED: { bg: 'bg-gray-100 text-gray-700 border-gray-200', dot: 'bg-gray-700' }
    }
    const current = badges[status] || badges.OPEN
    return (
      <span className={`inline-flex items-center px-sm py-xs rounded-full ${current.bg} font-label-md text-label-md gap-xs`}>
        <span className={`w-1.5 h-1.5 rounded-full ${current.dot}`}></span>
        {status?.replace('_', ' ')}
      </span>
    )
  }

  const categoryOptions = [
    { value: 'POTHOLE', label: 'Roads & Traffic' },
    { value: 'STREETLIGHT', label: 'Lighting' },
    { value: 'DRAINAGE', label: 'Drainage & Water' },
    { value: 'POLLUTION', label: 'Sanitation' },
    { value: 'OTHER', label: 'Public Safety & Other' }
  ]

  const statusOptions = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']

  const wardOptions = [
    { value: 'WARD_1', label: 'Ward 01 - North' },
    { value: 'WARD_2', label: 'Ward 02 - Central' },
    { value: 'WARD_3', label: 'Ward 03 - East' },
    { value: 'WARD_4', label: 'Ward 04 - West' },
    { value: 'WARD_5', label: 'Ward 05 - South' },
    { value: 'WARD_6', label: 'Ward 06 - Downtown' },
    { value: 'WARD_7', label: 'Ward 07 - Uptown' },
    { value: 'WARD_8', label: 'Ward 08 - Suburbs' }
  ]

  const totalResolved = (complaints || []).filter(c => c.status === 'RESOLVED').length
  const resolutionRate = complaints?.length ? Math.round((totalResolved / complaints.length) * 100) : 0

  return (
    <div className="bg-surface min-h-screen">
      <main className="max-w-[1312px] mx-auto px-margin-mobile md:px-margin-desktop py-xl text-left">
        
        {/* Header Section */}
        <header className="mb-xl flex flex-col md:flex-row md:items-end justify-between gap-md">
          <div>
            <h1 className="font-headline-lg text-headline-lg text-primary mb-xs font-bold">Citizen Complaints</h1>
            <p className="font-body-md text-body-md text-on-surface-variant">Manage, track, and monitor your submitted grievances and civic requests.</p>
          </div>
          <div className="flex gap-sm">
            <button 
              onClick={handleExportCSV}
              disabled={filteredComplaints.length === 0}
              className="flex items-center gap-xs px-md py-sm border border-outline rounded-lg text-primary font-label-lg text-label-lg hover:bg-surface-container transition-all cursor-pointer disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[20px]">download</span>
              Export to CSV
            </button>
            <Link to={ROUTES.CITIZEN.SUBMIT_COMPLAINT} className="flex items-center gap-xs px-md py-sm bg-primary text-on-primary rounded-lg font-label-lg text-label-lg hover:opacity-90 transition-all shadow-sm cursor-pointer">
              <span className="material-symbols-outlined text-[20px]">add</span>
              New Complaint
            </Link>
          </div>
        </header>

        {/* Bento Filter Grid */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-gutter mb-xl">
          <div className="md:col-span-12 lg:col-span-9 bg-white p-lg rounded-xl border border-outline-variant flex flex-wrap gap-md items-end mui-card-shadow">
            <div className="flex-1 min-w-[240px]">
              <label className="block font-label-lg text-label-lg text-on-surface-variant mb-xs">Keyword Search</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-outline">search</span>
                <input 
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  className="w-full pl-xl pr-md py-sm border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary font-body-md outline-none" 
                  placeholder="Complaint ID or Title..." 
                  type="text"
                />
              </div>
            </div>
            
            <div className="w-full sm:w-auto min-w-[160px]">
              <label className="block font-label-lg text-label-lg text-on-surface-variant mb-xs">Category</label>
              <select 
                value={selectedCategory}
                onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
                className="w-full px-md py-sm border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary font-body-md bg-white outline-none"
              >
                <option value="">All Categories</option>
                {categoryOptions.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div className="w-full sm:w-auto min-w-[160px]">
              <label className="block font-label-lg text-label-lg text-on-surface-variant mb-xs">Status</label>
              <select 
                value={selectedStatus}
                onChange={(e) => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
                className="w-full px-md py-sm border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary font-body-md bg-white outline-none"
              >
                <option value="">Any Status</option>
                {statusOptions.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="w-full sm:w-auto min-w-[160px]">
              <label className="block font-label-lg text-label-lg text-on-surface-variant mb-xs">Ward</label>
              <select 
                value={selectedWard}
                onChange={(e) => { setSelectedWard(e.target.value); setCurrentPage(1); }}
                className="w-full px-md py-sm border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary font-body-md bg-white outline-none"
              >
                <option value="">All Wards</option>
                {wardOptions.map(w => (
                  <option key={w.value} value={w.value}>{w.label}</option>
                ))}
              </select>
            </div>

            <button 
              onClick={handleResetFilters}
              className="bg-surface-container-high text-primary font-label-lg text-label-lg px-lg py-sm rounded-lg hover:bg-outline-variant transition-colors cursor-pointer"
            >
              Reset
            </button>
          </div>

          {/* Stats Mini Card */}
          <div className="md:col-span-12 lg:col-span-3 bg-primary-container text-on-primary-container p-lg rounded-xl border border-primary flex flex-col justify-center relative overflow-hidden mui-card-shadow">
            <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-8xl opacity-10">fact_check</span>
            <p className="font-label-lg text-label-lg uppercase tracking-wider opacity-80">Resolution Rate</p>
            <div className="flex items-baseline gap-xs mt-sm">
              <span className="font-headline-lg text-headline-lg text-white font-bold">{resolutionRate}%</span>
              <span className="font-label-md text-label-md text-on-primary-container font-semibold">cumulative</span>
            </div>
            <div className="mt-md w-full bg-primary rounded-full h-1.5 overflow-hidden">
              <div className="bg-secondary-fixed h-full" style={{ width: `${resolutionRate}%` }}></div>
            </div>
          </div>
        </section>

        {/* Main Data Table Container */}
        {loading ? (
          <div className="p-xl text-center bg-white border border-outline-variant rounded-xl mui-card-shadow">
            <p className="font-body-lg text-primary">Loading records...</p>
          </div>
        ) : error ? (
          <div className="p-xl text-center bg-white border border-outline-variant rounded-xl mui-card-shadow">
            <p className="font-body-lg text-error">Error loading complaints: {error}</p>
          </div>
        ) : currentItems.length === 0 ? (
          <div className="p-xl text-center bg-white border border-outline-variant rounded-xl mui-card-shadow">
            <span className="material-symbols-outlined text-4xl text-outline mb-sm">report_off</span>
            <p className="font-body-lg text-on-surface-variant">No complaints found matching current criteria.</p>
          </div>
        ) : (
          <section className="bg-white rounded-xl border border-outline-variant shadow-sm overflow-hidden mui-card-shadow">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-surface-container-low border-b border-outline-variant">
                  <tr>
                    <th className="px-lg py-md font-label-lg text-label-lg text-on-surface-variant uppercase tracking-wider">Ref #</th>
                    <th className="px-lg py-md font-label-lg text-label-lg text-on-surface-variant uppercase tracking-wider">Title</th>
                    <th className="px-lg py-md font-label-lg text-label-lg text-on-surface-variant uppercase tracking-wider">Category</th>
                    <th className="px-lg py-md font-label-lg text-label-lg text-on-surface-variant uppercase tracking-wider">Status</th>
                    <th className="px-lg py-md font-label-lg text-label-lg text-on-surface-variant uppercase tracking-wider">Submitted</th>
                    <th className="px-lg py-md font-label-lg text-label-lg text-on-surface-variant uppercase tracking-wider text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {currentItems.map((c) => (
                    <tr key={c.id} className="hover:bg-surface-container-lowest transition-colors group">
                      <td className="px-lg py-lg font-label-md text-label-md text-primary font-bold">#CP-{c.id}</td>
                      <td className="px-lg py-lg">
                        <p className="font-label-lg text-label-lg text-on-surface font-semibold">{c.title}</p>
                        <p className="font-label-md text-label-md text-on-surface-variant">{c.location || 'Location details not specified'}</p>
                      </td>
                      <td className="px-lg py-lg font-body-md text-body-md">
                        {categoryOptions.find(o => o.value === c.category)?.label || c.category}
                      </td>
                      <td className="px-lg py-lg">{getStatusBadge(c.status)}</td>
                      <td className="px-lg py-lg font-body-md text-body-md">
                        {c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '---'}
                      </td>
                      <td className="px-lg py-lg text-right">
                        <Link 
                          to={`/citizen/complaints/${c.id}`} 
                          className="text-primary font-label-lg text-label-lg hover:underline underline-offset-4 font-semibold"
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="px-lg py-md bg-surface-container-low flex items-center justify-between border-t border-outline-variant">
              <p className="font-label-md text-label-md text-on-surface-variant">
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, totalItems)} of {totalItems} complaints
              </p>
              <div className="flex items-center gap-sm">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="w-10 h-10 flex items-center justify-center rounded-lg border border-outline-variant hover:bg-white transition-colors disabled:opacity-30 cursor-pointer"
                >
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
                {Array.from({ length: totalPages }).map((_, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setCurrentPage(idx + 1)}
                    className={`w-10 h-10 flex items-center justify-center rounded-lg font-label-lg text-label-lg cursor-pointer ${currentPage === idx + 1 ? 'bg-primary text-on-primary font-bold' : 'border border-outline-variant hover:bg-white transition-colors'}`}
                  >
                    {idx + 1}
                  </button>
                ))}
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="w-10 h-10 flex items-center justify-center rounded-lg border border-outline-variant hover:bg-white transition-colors disabled:opacity-30 cursor-pointer"
                >
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Informational Prompt */}
        <section className="mt-xl grid grid-cols-1 md:grid-cols-2 gap-gutter">
          <div className="p-lg bg-secondary-container text-on-secondary-container rounded-xl flex items-start gap-md mui-card-shadow">
            <span className="material-symbols-outlined text-primary text-3xl">info</span>
            <div>
              <h3 className="font-label-lg text-label-lg text-primary font-bold mb-xs">Emergency Alert</h3>
              <p className="font-body-md text-body-md">For immediate life-threatening emergencies, please call the direct emergency helpline at 911. Do not use this portal for time-sensitive emergency reporting.</p>
            </div>
          </div>
          <div className="p-lg bg-tertiary-fixed text-on-tertiary-fixed rounded-xl flex items-start gap-md mui-card-shadow">
            <span className="material-symbols-outlined text-on-tertiary-fixed-variant text-3xl">lightbulb</span>
            <div>
              <h3 className="font-label-lg text-label-lg text-on-tertiary-fixed-variant font-bold mb-xs">Track Progress</h3>
              <p className="font-body-md text-body-md">You will receive SMS and Email notifications whenever the status of your complaint changes or requires further action from your side.</p>
            </div>
          </div>
        </section>

      </main>
    </div>
  )
}

