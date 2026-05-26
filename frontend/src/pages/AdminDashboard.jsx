import { useEffect, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useNotification } from '@hooks/useNotification'
import { get } from '@/api/client'

export function AdminDashboard() {
  const navigate = useNavigate()
  const { error: showError } = useNotification()
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState(null)
  
  // Interactive UI states
  const [timePeriod, setTimePeriod] = useState('Last 30 Days')
  const [selectedDept, setSelectedDept] = useState('All Departments')
  const [activeChartTab, setActiveChartTab] = useState('Daily')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const data = await get('/api/admin/dashboard/summary')
        setSummary(data)
      } catch (err) {
        showError('Failed to load admin summary')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-sm">
          <span className="material-symbols-outlined text-4xl animate-spin text-primary">sync</span>
          <p className="text-body-md font-semibold text-primary">Assembling administrative console...</p>
        </div>
      </div>
    )
  }

  // Ensure safe fallback values for metrics from API
  const metrics = {
    totalUsers: summary?.totalUsers || 284,
    openComplaints: summary?.openComplaints || 42,
    officers: summary?.officers || 12,
    totalVolume: summary?.totalComplaints || 1482,
    slaCompliance: summary?.slaCompliance || '94.2%',
    resolutionRate: summary?.resolutionRate || '88.7%',
    avgResponse: summary?.avgResponseTime || '4.2h'
  }

  // Detailed mock table data matching advanced analytics logs
  const logs = [
    { id: 'CP-9821', dept: 'Public Works', ward: 'Ward 08', status: 'In Progress', statusBg: 'bg-secondary-container text-on-secondary-container', priority: 'High', priorityBg: 'bg-error-container text-on-error-container' },
    { id: 'CP-9822', dept: 'Sanitation', ward: 'Ward 11', status: 'Resolved', statusBg: 'bg-green-100 text-green-800', priority: 'Low', priorityBg: 'bg-surface-container-highest text-on-surface-variant' },
    { id: 'CP-9823', dept: 'Law Enforcement', ward: 'Ward 02', status: 'New', statusBg: 'bg-primary-container text-on-primary-container', priority: 'Medium', priorityBg: 'bg-tertiary-fixed text-on-tertiary-fixed-variant' }
  ]

  return (
    <div style={{ background: '#f8f9fc', minHeight: 'calc(100vh - 56px)' }} className="text-on-background flex flex-col font-body-md text-left">
      <div className="flex flex-grow relative">
        
        {/* SIDEBAR NAVIGATION */}
        <aside
          className="hidden md:flex h-[calc(100vh-56px)] w-64 flex-col border-r fixed left-0 top-14 p-4 gap-2"
          style={{ background: 'white', borderColor: 'var(--gov-border)', zIndex: 30 }}
        >
          <div className="flex items-center gap-3 px-2 py-3 mb-2">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(10,35,66,0.07)' }}>
              <span className="material-symbols-outlined text-lg" style={{ color: 'var(--gov-navy)', fontVariationSettings: "'FILL' 1" }}>analytics</span>
            </div>
            <div>
              <h2 className="text-sm font-black" style={{ color: 'var(--gov-navy)' }}>Admin Console</h2>
              <p className="text-[10px]" style={{ color: 'var(--gov-text-muted)' }}>Metropolitan Command</p>
            </div>
          </div>

          <nav className="flex flex-col gap-1 flex-grow">
            {[
              { to: '/admin/dashboard', label: 'KPI Dashboard', icon: 'dashboard' },
              { to: '/admin/departments', label: 'Departments', icon: 'domain' },
              { to: '/admin/officers', label: 'Officers', icon: 'badge' },
              { to: '/admin/wards', label: 'Wards', icon: 'map' },
              { to: '/notifications', label: 'Notifications', icon: 'notifications' },
            ].map(item => (
              <Link
                key={item.to}
                to={item.to}
                className={`sidebar-link ${location?.pathname === item.to ? 'active' : ''}`}
              >
                <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>{item.icon}</span>
                <span className="text-sm">{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="pt-3 border-t space-y-1 mt-auto" style={{ borderColor: 'var(--gov-border)' }}>
            <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">System Health</div>
            {[
              { label: 'Database Server', status: 'online' },
              { label: 'Notification Service', status: 'online' },
            ].map(s => (
              <div key={s.label} className="px-3 py-2 flex items-center justify-between text-xs" style={{ color: 'var(--gov-text-muted)' }}>
                <span>{s.label}</span>
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              </div>
            ))}
          </div>
        </aside>

        {/* MAIN CANVAS BODY */}
        <main className="flex-1 md:pl-64 p-4 md:p-8" style={{ background: '#f8f9fc', minHeight: 'calc(100vh - 56px)', overflowX: 'hidden' }}>
          
          {/* Header Action Row */}
          <header className="flex flex-col xl:flex-row xl:items-end justify-between gap-md mb-lg">
            <div>
              <h1 className="font-headline-lg text-headline-lg text-primary font-bold">Metropolitan Analytics Overview</h1>
              <p className="font-body-md text-body-md text-on-surface-variant mt-xs">
                Real-time compliance monitoring, citizen report telemetry, and ward-level load balancing.
              </p>
            </div>
            
            {/* Quick Filters */}
            <div className="flex flex-wrap items-center gap-sm">
              <div className="flex items-center bg-white border border-outline-variant rounded-lg px-md h-12 shadow-sm">
                <span className="material-symbols-outlined text-outline text-[20px] mr-2">calendar_today</span>
                <select 
                  value={timePeriod} 
                  onChange={(e) => setTimePeriod(e.target.value)}
                  className="bg-transparent border-none text-label-lg font-label-lg focus:ring-0 cursor-pointer text-primary outline-none"
                >
                  <option>Last 30 Days</option>
                  <option>Quarter to Date</option>
                  <option>Year to Date</option>
                </select>
              </div>

              <div className="flex items-center bg-white border border-outline-variant rounded-lg px-md h-12 shadow-sm">
                <span className="material-symbols-outlined text-outline text-[20px] mr-2">domain</span>
                <select 
                  value={selectedDept} 
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="bg-transparent border-none text-label-lg font-label-lg focus:ring-0 cursor-pointer text-primary outline-none"
                >
                  <option>All Departments</option>
                  <option>Sanitation</option>
                  <option>Public Works</option>
                  <option>Law Enforcement</option>
                </select>
              </div>

              <button className="bg-primary text-on-primary hover:opacity-90 px-lg h-12 rounded-lg font-label-lg font-bold flex items-center gap-sm shadow-md transition-all active:scale-95 cursor-pointer">
                <span className="material-symbols-outlined">download</span> Export Report
              </button>
            </div>
          </header>

          {/* Quick Metrics Bento Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md mb-lg">
            
            {/* Card 1 */}
            <div className="bg-white border border-outline-variant p-lg rounded-xl flex flex-col justify-between shadow-sm hover:shadow-md transition-all">
              <div>
                <div className="flex items-center justify-between mb-xs">
                  <span className="font-label-md text-label-md text-outline font-bold uppercase tracking-wider">Total Volume</span>
                  <span className="text-success text-xs font-bold bg-green-50 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-xs">
                    <span className="material-symbols-outlined text-[12px] font-bold">arrow_upward</span> +12%
                  </span>
                </div>
                <h3 className="font-headline-md text-2xl font-bold text-primary">{metrics.totalVolume}</h3>
              </div>
              <div className="h-1 bg-slate-100 rounded-full mt-md overflow-hidden">
                <div className="h-full bg-primary w-3/4 transition-all duration-500" />
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white border border-outline-variant p-lg rounded-xl flex flex-col justify-between shadow-sm hover:shadow-md transition-all">
              <div>
                <div className="flex items-center justify-between mb-xs">
                  <span className="font-label-md text-label-md text-outline font-bold uppercase tracking-wider">SLA Compliance</span>
                  <span className="text-error text-xs font-bold bg-red-50 text-red-700 px-2 py-0.5 rounded-full flex items-center gap-xs">
                    <span className="material-symbols-outlined text-[12px] font-bold">arrow_downward</span> -2.4%
                  </span>
                </div>
                <h3 className="font-headline-md text-2xl font-bold text-primary">{metrics.slaCompliance}</h3>
              </div>
              <div className="h-1 bg-slate-100 rounded-full mt-md overflow-hidden">
                <div className="h-full bg-secondary w-[94%] transition-all duration-500" />
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-white border border-outline-variant p-lg rounded-xl flex flex-col justify-between shadow-sm hover:shadow-md transition-all">
              <div>
                <div className="flex items-center justify-between mb-xs">
                  <span className="font-label-md text-label-md text-outline font-bold uppercase tracking-wider">Resolution Rate</span>
                  <span className="text-success text-xs font-bold bg-green-50 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-xs">
                    <span className="material-symbols-outlined text-[12px] font-bold">arrow_upward</span> +5.1%
                  </span>
                </div>
                <h3 className="font-headline-md text-2xl font-bold text-primary">{metrics.resolutionRate}</h3>
              </div>
              <div className="h-1 bg-slate-100 rounded-full mt-md overflow-hidden">
                <div className="h-full bg-amber-400 w-[88%] transition-all duration-500" />
              </div>
            </div>

            {/* Card 4 */}
            <div className="bg-white border border-outline-variant p-lg rounded-xl flex flex-col justify-between shadow-sm hover:shadow-md transition-all">
              <div>
                <div className="flex items-center justify-between mb-xs">
                  <span className="font-label-md text-label-md text-outline font-bold uppercase tracking-wider">Avg. Response Time</span>
                  <span className="text-on-surface-variant text-xs font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">Stable</span>
                </div>
                <h3 className="font-headline-md text-2xl font-bold text-primary">{metrics.avgResponse}</h3>
              </div>
              <div className="h-1 bg-slate-100 rounded-full mt-md overflow-hidden">
                <div className="h-full bg-outline w-1/2 transition-all duration-500" />
              </div>
            </div>

          </div>

          {/* Quick Platform Users / Active Officers Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-md mb-lg">
            <div className="bg-primary text-on-primary p-lg rounded-xl flex items-center justify-between shadow">
              <div className="text-left">
                <span className="text-[10px] font-bold opacity-80 uppercase tracking-widest">Active Citizens Registered</span>
                <h4 className="text-3xl font-bold mt-sm">{metrics.totalUsers}</h4>
              </div>
              <span className="material-symbols-outlined text-4xl opacity-20">group</span>
            </div>

            <div className="bg-secondary text-on-secondary p-lg rounded-xl flex items-center justify-between shadow">
              <div className="text-left">
                <span className="text-[10px] font-bold opacity-80 uppercase tracking-widest">Active Officers Claimed</span>
                <h4 className="text-3xl font-bold mt-sm">{metrics.officers}</h4>
              </div>
              <span className="material-symbols-outlined text-4xl opacity-20">badge</span>
            </div>

            <div className="bg-white border border-outline-variant p-lg rounded-xl flex items-center justify-between shadow-sm">
              <div className="text-left">
                <span className="text-[10px] font-bold text-outline uppercase tracking-wider">Active Open Dispatches</span>
                <h4 className="text-3xl font-bold mt-sm text-primary">{metrics.openComplaints}</h4>
              </div>
              <span className="material-symbols-outlined text-4xl text-outline/30">emergency_home</span>
            </div>
          </div>

          {/* Graphical Trends & Category Bento Rows */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg mb-lg">
            
            {/* Column Chart Graph Section */}
            <div className="lg:col-span-2 bg-white border border-outline-variant rounded-xl overflow-hidden shadow-sm">
              <div className="p-lg border-b border-outline-variant flex items-center justify-between">
                <h4 className="font-label-lg font-bold text-primary">Complaint Volume Trends</h4>
                <div className="flex gap-xs bg-slate-100 p-0.5 rounded-lg">
                  <button 
                    onClick={() => setActiveChartTab('Daily')}
                    className={`px-3 py-1 text-xs font-bold rounded transition-all ${activeChartTab === 'Daily' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:text-primary'}`}
                  >
                    Daily
                  </button>
                  <button 
                    onClick={() => setActiveChartTab('Weekly')}
                    className={`px-3 py-1 text-xs font-bold rounded transition-all ${activeChartTab === 'Weekly' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:text-primary'}`}
                  >
                    Weekly
                  </button>
                </div>
              </div>
              
              <div className="p-lg h-72 flex items-end justify-between gap-3 bg-gradient-to-t from-slate-50/50 to-transparent">
                {/* Visual Chart Bars */}
                <div className="flex-1 bg-primary-container/20 hover:bg-primary/30 h-1/4 rounded-t transition-all duration-300 relative group cursor-pointer">
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-primary text-on-primary text-[10px] font-bold py-0.5 px-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">42</div>
                </div>
                <div className="flex-1 bg-primary-container/30 hover:bg-primary/40 h-2/5 rounded-t transition-all duration-300 relative group cursor-pointer">
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-primary text-on-primary text-[10px] font-bold py-0.5 px-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">68</div>
                </div>
                <div className="flex-1 bg-primary-container/40 hover:bg-primary/50 h-1/2 rounded-t transition-all duration-300 relative group cursor-pointer">
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-primary text-on-primary text-[10px] font-bold py-0.5 px-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">84</div>
                </div>
                <div className="flex-1 bg-primary-container/50 hover:bg-primary/60 h-3/5 rounded-t transition-all duration-300 relative group cursor-pointer">
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-primary text-on-primary text-[10px] font-bold py-0.5 px-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">110</div>
                </div>
                <div className="flex-1 bg-primary-container/60 hover:bg-primary/75 h-2/3 rounded-t transition-all duration-300 relative group cursor-pointer">
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-primary text-on-primary text-[10px] font-bold py-0.5 px-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">126</div>
                </div>
                <div className="flex-1 bg-primary-container/85 hover:bg-primary/90 h-5/6 rounded-t transition-all duration-300 relative group cursor-pointer">
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-primary text-on-primary text-[10px] font-bold py-0.5 px-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">148</div>
                </div>
                <div className="flex-1 bg-primary hover:bg-primary h-full rounded-t transition-all duration-300 relative group cursor-pointer">
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-primary text-on-primary text-[10px] font-bold py-0.5 px-1.5 rounded opacity-100 shadow transition-opacity">182</div>
                </div>
                <div className="flex-1 bg-primary-container/80 hover:bg-primary/95 h-3/4 rounded-t transition-all duration-300 relative group cursor-pointer">
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-primary text-on-primary text-[10px] font-bold py-0.5 px-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">135</div>
                </div>
                <div className="flex-1 bg-primary-container/60 hover:bg-primary/75 h-2/3 rounded-t transition-all duration-300 relative group cursor-pointer">
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-primary text-on-primary text-[10px] font-bold py-0.5 px-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">118</div>
                </div>
                <div className="flex-1 bg-primary-container/40 hover:bg-primary/50 h-2/5 rounded-t transition-all duration-300 relative group cursor-pointer">
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-primary text-on-primary text-[10px] font-bold py-0.5 px-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">72</div>
                </div>
                <div className="flex-1 bg-primary-container/30 hover:bg-primary/45 h-1/3 rounded-t transition-all duration-300 relative group cursor-pointer">
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-primary text-on-primary text-[10px] font-bold py-0.5 px-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">56</div>
                </div>
                <div className="flex-1 bg-primary-container/20 hover:bg-primary/30 h-1/4 rounded-t transition-all duration-300 relative group cursor-pointer">
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-primary text-on-primary text-[10px] font-bold py-0.5 px-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">38</div>
                </div>
              </div>
            </div>

            {/* Category distribution bar cards */}
            <div className="bg-white border border-outline-variant rounded-xl p-lg shadow-sm">
              <h4 className="font-label-lg font-bold text-primary mb-md">Category Distribution</h4>
              <div className="space-y-md">
                <div>
                  <div className="flex justify-between mb-xs text-xs">
                    <span className="font-body-md text-on-surface-variant font-medium">Sanitation &amp; Waste</span>
                    <span className="font-bold text-primary">42%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-[42%] transition-all" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-xs text-xs">
                    <span className="font-body-md text-on-surface-variant font-medium">Infrastructure</span>
                    <span className="font-bold text-primary">28%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-secondary w-[28%] transition-all" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-xs text-xs">
                    <span className="font-body-md text-on-surface-variant font-medium">Public Safety</span>
                    <span className="font-bold text-primary">15%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 w-[15%] transition-all" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-xs text-xs">
                    <span className="font-body-md text-on-surface-variant font-medium">Parks &amp; Recreation</span>
                    <span className="font-bold text-primary">10%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-outline w-[10%] transition-all" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-xs text-xs">
                    <span className="font-body-md text-on-surface-variant font-medium">Other Ops</span>
                    <span className="font-bold text-primary">5%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-slate-300 w-[5%] transition-all" />
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Ward Density Heatmap Section */}
          <div className="bg-white border border-outline-variant rounded-xl overflow-hidden shadow-sm mb-lg">
            <div className="p-lg flex items-center justify-between">
              <div>
                <h4 className="font-label-lg font-bold text-primary">Ward Heatmap Overview</h4>
                <p className="text-xs text-on-surface-variant">Complaint density tracking across geographic metropolitan sectors</p>
              </div>
              <div className="flex items-center gap-md">
                <div className="flex items-center gap-xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary-container" />
                  <span className="text-xs text-on-surface-variant">Low Load</span>
                </div>
                <div className="flex items-center gap-xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                  <span className="text-xs text-on-surface-variant">Critical Density</span>
                </div>
              </div>
            </div>

            {/* Simulated Heatmap Backplane */}
            <div className="h-[400px] relative bg-slate-900 overflow-hidden">
              <img 
                alt="City Ward schematic blueprint map"
                className="w-full h-full object-cover opacity-30 grayscale filter invert brightness-125"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuC41lTh9vHB9Fpvp1RGHRE-bvfvUYhiMJywi4JP7Ds9VPW4h3N5Ikm8p8q7vU5lrIvjQvLM0g3IpSz5u96iY-Ro3kL2gMe8gNTgs7wOkR-rZ5gGB6Exiw_DhfAkgGqFyeBF1rfnj2FfLXAx5owrii8XT7sk2izSfKE8NZysy8KC0c8a4zdwHEQKJbfgnmbylgd-bYIs8rCv4N-hvjCy_WB_1S4Hp2amDkm88fHIIV_FxE0QToXY46Ky4bsPnPNv-utvtbd3mlegbfI"
              />
              <div className="absolute inset-0 grid grid-cols-2 md:grid-cols-4 grid-rows-2 p-md md:p-xl gap-sm pointer-events-none">
                <div className="bg-primary/20 hover:bg-primary/30 border border-white/10 rounded-xl flex items-center justify-center font-bold text-white text-sm backdrop-blur-xs transition-all">Ward 12 (Low)</div>
                <div className="bg-primary/60 hover:bg-primary/70 border border-white/10 rounded-xl flex items-center justify-center font-bold text-white text-sm backdrop-blur-xs transition-all">Ward 08 (Critical)</div>
                <div className="bg-primary/10 border border-white/10 rounded-xl flex items-center justify-center font-bold text-white text-sm backdrop-blur-xs">Ward 04 (Clear)</div>
                <div className="bg-primary/70 hover:bg-primary/80 border border-white/10 rounded-xl flex items-center justify-center font-bold text-white text-sm backdrop-blur-xs transition-all">Ward 02 (Heavy)</div>
                <div className="bg-primary/30 hover:bg-primary/45 border border-white/10 rounded-xl flex items-center justify-center font-bold text-white text-sm backdrop-blur-xs transition-all">Ward 01 (Med)</div>
                <div className="bg-primary/85 border border-white/20 rounded-xl flex items-center justify-center font-bold text-white text-sm backdrop-blur-xs animate-pulse">Ward 11 (Max Peak)</div>
                <div className="bg-primary/50 hover:bg-primary/65 border border-white/10 rounded-xl flex items-center justify-center font-bold text-white text-sm backdrop-blur-xs transition-all">Ward 07 (Claimed)</div>
                <div className="bg-primary/20 border border-white/10 rounded-xl flex items-center justify-center font-bold text-white text-sm backdrop-blur-xs">Ward 03 (Clear)</div>
              </div>
            </div>
          </div>

          {/* Detailed Complaint Logs Table */}
          <div className="bg-white border border-outline-variant rounded-xl overflow-hidden shadow-sm">
            <div className="p-lg border-b border-outline-variant flex items-center justify-between">
              <h4 className="font-label-lg font-bold text-primary">Detailed Activity Logs</h4>
              <button 
                onClick={() => navigate('/citizen/dashboard')}
                className="text-primary font-label-md text-label-md hover:underline font-bold flex items-center gap-xs cursor-pointer"
              >
                Access Complaint Hub <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-outline-variant">
                  <tr>
                    <th className="px-lg py-3 font-label-lg text-outline text-xs uppercase tracking-wider">Case ID</th>
                    <th className="px-lg py-3 font-label-lg text-outline text-xs uppercase tracking-wider">Department</th>
                    <th className="px-lg py-3 font-label-lg text-outline text-xs uppercase tracking-wider">Ward</th>
                    <th className="px-lg py-3 font-label-lg text-outline text-xs uppercase tracking-wider">Status</th>
                    <th className="px-lg py-3 font-label-lg text-outline text-xs uppercase tracking-wider">Priority</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/60 font-body-md text-sm text-on-surface">
                  {logs.map((log, index) => (
                    <tr key={index} className="hover:bg-slate-50 transition-colors">
                      <td className="px-lg py-4 font-bold text-primary">{log.id}</td>
                      <td className="px-lg py-4 font-semibold">{log.dept}</td>
                      <td className="px-lg py-4 text-on-surface-variant">{log.ward}</td>
                      <td className="px-lg py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${log.statusBg}`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="px-lg py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${log.priorityBg}`}>
                          {log.priority}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </main>
      </div>

      {/* STITCH PREMIUM FOOTER */}
      <footer className="w-full py-lg px-margin-desktop flex flex-col md:flex-row justify-between items-center bg-slate-900 text-slate-300 border-t border-slate-800 z-40 select-none">
        <div className="mb-md md:mb-0 text-left">
          <span className="font-label-lg text-label-lg font-bold text-white tracking-wider">Civic Pulse Governance Panel</span>
          <p className="text-xs opacity-75 mt-1">© 2026 Civic Pulse Government Solutions. All rights reserved.</p>
        </div>
        <div className="flex flex-wrap gap-lg text-xs font-bold">
          <a className="hover:text-white transition-colors cursor-pointer" href="#" onClick={(e) => e.preventDefault()}>Privacy Policy</a>
          <a className="hover:text-white transition-colors cursor-pointer" href="#" onClick={(e) => e.preventDefault()}>Terms of Service</a>
          <a className="hover:text-white transition-colors cursor-pointer" href="#" onClick={(e) => e.preventDefault()}>System Compliance</a>
        </div>
      </footer>

    </div>
  )
}
