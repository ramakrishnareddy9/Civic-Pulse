import { useNavigate } from 'react-router-dom'
import { useAuth } from '@hooks/useAuth'
import { ROUTES } from '@utils/constants'
import { useState } from 'react'

const STATS = [
  { value: '12,481', label: 'Issues Resolved', icon: 'check_circle', color: 'var(--gov-green-light)' },
  { value: '94.2%', label: 'SLA Compliance', icon: 'verified', color: 'var(--gov-blue)' },
  { value: '48h', label: 'Avg. Resolution', icon: 'schedule', color: 'var(--gov-gold)' },
  { value: '8 Wards', label: 'Active Coverage', icon: 'location_on', color: '#7c3aed' },
]

const FEATURES = [
  {
    icon: 'bolt',
    title: 'Fast Response',
    desc: 'Automated smart routing delivers your complaint to the correct department in seconds, slashing wait times by 70%.',
    color: 'var(--gov-blue)',
    bg: 'rgba(21,101,192,0.07)',
  },
  {
    icon: 'visibility',
    title: 'Transparent Tracking',
    desc: 'Real-time status updates at every step — from registration to resolution. No more wondering where your request stands.',
    color: 'var(--gov-green-light)',
    bg: 'rgba(46,125,50,0.07)',
  },
  {
    icon: 'smartphone',
    title: 'Mobile Accessible',
    desc: 'Report civic issues on the go. Our responsive platform works seamlessly on any device, anywhere in your ward.',
    color: '#7c3aed',
    bg: 'rgba(124,58,237,0.07)',
  },
  {
    icon: 'support_agent',
    title: 'Dedicated Officers',
    desc: 'Every complaint is reviewed by a trained government officer assigned to your ward for direct accountability.',
    color: 'var(--gov-gold)',
    bg: 'rgba(198,162,39,0.07)',
  },
  {
    icon: 'notifications_active',
    title: 'Live Notifications',
    desc: 'Get SMS and email alerts whenever your complaint status changes. Stay informed without checking the portal.',
    color: '#dc2626',
    bg: 'rgba(220,38,38,0.07)',
  },
  {
    icon: 'shield',
    title: 'Secure & Private',
    desc: 'Your data is protected with government-grade encryption. All submissions are confidential and legally protected.',
    color: 'var(--gov-navy)',
    bg: 'rgba(10,35,66,0.07)',
  },
]

const HOW_IT_WORKS = [
  { step: '01', title: 'Submit Your Complaint', desc: 'Fill in our guided 4-step form with details, photos, and location of the civic issue.' },
  { step: '02', title: 'Automatic Department Routing', desc: 'Our system instantly routes your complaint to the correct department and ward officer.' },
  { step: '03', title: 'Real-Time Updates', desc: 'Track resolution progress and receive notifications at each stage via email and SMS.' },
]

const NEWS = [
  {
    tag: 'Infrastructure',
    title: 'New Smart Lighting Initiative in Ward 4',
    desc: 'Upgrading 500 street lamps to LED with IoT connectivity for better energy management and public safety.',
    date: 'May 22, 2026',
    icon: 'lightbulb',
  },
  {
    tag: 'Community',
    title: 'Digital Literacy Workshops Launched',
    desc: 'Expanding access to technology training across three central libraries to bridge the digital divide.',
    date: 'May 18, 2026',
    icon: 'computer',
  },
  {
    tag: 'Roads',
    title: 'Ring Road Pothole Drive Completed',
    desc: '42 critical potholes patched along the city ring road following citizen complaints on CivicPulse.',
    date: 'May 14, 2026',
    icon: 'construction',
  },
]

export function LandingPage() {
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuth()
  const [fontSize, setFontSize] = useState(100)
  const [highContrast, setHighContrast] = useState(false)

  const handleActionClick = (route) => {
    if (isAuthenticated) {
      if (user?.role === 'CITIZEN') {
        navigate(route)
      } else {
        navigate(ROUTES.DASHBOARD)
      }
    } else {
      navigate(ROUTES.LOGIN)
    }
  }

  const handleFontSize = (dir) => {
    setFontSize(prev => {
      const next = dir === 'up' ? Math.min(prev + 10, 130) : Math.max(prev - 10, 80)
      document.documentElement.style.fontSize = `${next}%`
      return next
    })
  }

  const handleToggleContrast = () => {
    setHighContrast(prev => {
      const next = !prev
      if (next) {
        document.body.style.filter = 'contrast(1.3) saturate(0.8)'
      } else {
        document.body.style.filter = ''
      }
      return next
    })
  }

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', color: 'var(--gov-text)' }}>

      {/* ===== HERO SECTION ===== */}
      <section
        className="relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, var(--gov-navy-dark) 0%, var(--gov-navy) 60%, #1a3d7c 100%)',
          minHeight: '560px',
        }}
      >
        {/* Background pattern */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M50 50c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10c0 5.523-4.477 10-10 10s-10-4.477-10-10 4.477-10 10-10zM10 10c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10c0 5.523-4.477 10-10 10S0 25.523 0 20s4.477-10 10-10z' /%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        {/* Radial glow */}
        <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 70% 50%, rgba(21,101,192,0.3) 0%, transparent 60%)' }} />

        <div className="relative max-w-[1312px] mx-auto px-6 md:px-12 py-20 md:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="animate-fade-in">
              {/* Official Badge */}
              <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold mb-6 border"
                style={{ background: 'rgba(198,162,39,0.15)', borderColor: 'rgba(198,162,39,0.4)', color: 'var(--gov-gold)' }}
              >
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                Official Government Services Portal · est. 2020
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight text-white mb-6">
                Your City,<br />
                <span style={{ color: 'var(--gov-gold)' }}>Your Voice.</span>
              </h1>
              <p className="text-lg text-white/75 mb-8 max-w-lg leading-relaxed">
                Submit civic complaints, track resolutions in real-time, and hold your municipality accountable. 
                A transparent, fast, and secure government services portal.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => handleActionClick(ROUTES.CITIZEN.SUBMIT_COMPLAINT)}
                  className="flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-bold text-base transition-all duration-200 hover:scale-105 active:scale-98"
                  style={{ background: 'var(--gov-gold)', color: '#1a1200', boxShadow: '0 4px 20px rgba(198,162,39,0.4)' }}
                >
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>add_circle</span>
                  Submit a Complaint
                </button>
                <button
                  onClick={() => handleActionClick(ROUTES.CITIZEN.DASHBOARD)}
                  className="flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-bold text-base border-2 transition-all duration-200 hover:bg-white hover:text-gray-900"
                  style={{ borderColor: 'rgba(255,255,255,0.3)', color: 'white' }}
                >
                  <span className="material-symbols-outlined">search</span>
                  Track My Complaint
                </button>
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap gap-5 mt-10">
                {[
                  { icon: 'lock', label: 'Govt. Encrypted' },
                  { icon: 'speed', label: '48hr Response SLA' },
                  { icon: 'verified_user', label: 'DPDP Compliant' },
                ].map(b => (
                  <div key={b.icon} className="flex items-center gap-1.5 text-xs text-white/60 font-medium">
                    <span className="material-symbols-outlined text-sm" style={{ color: 'var(--gov-gold)', fontVariationSettings: "'FILL' 1" }}>{b.icon}</span>
                    {b.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Visual card stack */}
            <div className="hidden lg:flex flex-col gap-4 animate-slide-right delay-200">
              {/* Complaint status card */}
              <div className="glass-panel rounded-2xl p-5 border" style={{ borderColor: 'rgba(255,255,255,0.2)' }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: '#dbeafe' }}>
                    <span className="material-symbols-outlined text-sm" style={{ color: '#1e40af', fontVariationSettings: "'FILL' 1" }}>construction</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white/50 uppercase tracking-wider">Case #CP-9821</p>
                    <p className="font-semibold text-white text-sm">Water Main Burst – 5th Ave</p>
                  </div>
                  <span className="ml-auto px-2.5 py-1 rounded-full text-xs font-bold" style={{ background: '#fee2e2', color: '#991b1b' }}>OPEN</span>
                </div>
                <div className="flex gap-4">
                  {[
                    { label: 'Submitted', val: '2h ago' },
                    { label: 'SLA', val: '22h left' },
                    { label: 'Ward', val: 'Ward 08' },
                  ].map(m => (
                    <div key={m.label}>
                      <p className="text-[10px] text-white/40 uppercase">{m.label}</p>
                      <p className="text-xs font-bold text-white">{m.val}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { val: '42', label: 'Open Tickets', color: '#f59e0b' },
                  { val: '12', label: 'Resolved Today', color: '#22c55e' },
                  { val: '3', label: 'SLA Breaches', color: '#ef4444' },
                  { val: '94%', label: 'Compliance Rate', color: '#60a5fa' },
                ].map(s => (
                  <div
                    key={s.label}
                    className="glass-panel rounded-xl p-4 border"
                    style={{ borderColor: 'rgba(255,255,255,0.15)' }}
                  >
                    <p className="text-2xl font-black text-white">{s.val}</p>
                    <p className="text-xs text-white/50 font-medium mt-0.5">{s.label}</p>
                    <div className="h-0.5 rounded-full mt-2" style={{ background: s.color, width: '40%' }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== STATS STRIP ===== */}
      <section style={{ background: 'white', borderBottom: '1px solid var(--gov-border)' }}>
        <div className="max-w-[1312px] mx-auto px-6 md:px-12 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map((s, i) => (
              <div key={i} className="flex items-center gap-4">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `${s.color}15` }}
                >
                  <span className="material-symbols-outlined text-xl" style={{ color: s.color, fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
                </div>
                <div>
                  <p className="text-2xl font-black" style={{ color: 'var(--gov-navy)' }}>{s.value}</p>
                  <p className="text-xs text-gray-500 font-medium">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="py-20 px-6 md:px-12" style={{ background: 'var(--gov-surface)' }}>
        <div className="max-w-[1312px] mx-auto">
          <div className="text-center mb-14">
            <p className="text-sm font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--gov-blue)' }}>Process</p>
            <h2 className="text-3xl md:text-4xl font-black" style={{ color: 'var(--gov-navy)' }}>How Civic Pulse Works</h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto">From submission to resolution in three simple steps.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connector line (desktop) */}
            <div className="hidden md:block absolute top-10 left-1/6 right-1/6 h-0.5" style={{ background: 'var(--gov-border)' }} />
            {HOW_IT_WORKS.map((step, i) => (
              <div key={i} className="flex flex-col items-center text-center animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-black mb-5 relative z-10"
                  style={{
                    background: 'linear-gradient(135deg, var(--gov-navy-dark), var(--gov-blue))',
                    color: 'white',
                    boxShadow: '0 8px 24px rgba(10,35,66,0.25)',
                  }}
                >
                  {step.step}
                </div>
                <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--gov-navy)' }}>{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed max-w-xs">{step.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <button
              onClick={() => handleActionClick(ROUTES.CITIZEN.SUBMIT_COMPLAINT)}
              className="gov-btn-primary"
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>add_circle</span>
              Get Started Now
            </button>
          </div>
        </div>
      </section>

      {/* ===== FEATURES GRID ===== */}
      <section className="py-20 px-6 md:px-12" style={{ background: 'white' }}>
        <div className="max-w-[1312px] mx-auto">
          <div className="text-center mb-14">
            <p className="text-sm font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--gov-blue)' }}>Features</p>
            <h2 className="text-3xl md:text-4xl font-black" style={{ color: 'var(--gov-navy)' }}>Designed for Efficiency</h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto">Everything you need to engage with your city's services, built for maximum accessibility and reliability.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className="rounded-2xl p-6 border transition-all duration-200 hover:shadow-lg hover:-translate-y-1 group animate-fade-in"
                style={{
                  borderColor: 'var(--gov-border)',
                  background: 'white',
                  animationDelay: `${i * 60}ms`,
                }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform duration-200 group-hover:scale-110"
                  style={{ background: f.bg }}
                >
                  <span className="material-symbols-outlined text-2xl" style={{ color: f.color, fontVariationSettings: "'FILL' 1" }}>{f.icon}</span>
                </div>
                <h3 className="text-base font-bold mb-2" style={{ color: 'var(--gov-navy)' }}>{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== RECENT UPDATES ===== */}
      <section className="py-20 px-6 md:px-12" style={{ background: 'var(--gov-surface)' }}>
        <div className="max-w-[1312px] mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--gov-blue)' }}>Latest</p>
              <h2 className="text-3xl font-black" style={{ color: 'var(--gov-navy)' }}>Recent Civic Updates</h2>
              <p className="text-gray-500 mt-1">Announcements and resolved issues in your community.</p>
            </div>
            <button
              onClick={() => handleActionClick(ROUTES.CITIZEN.DASHBOARD)}
              className="flex items-center gap-1.5 text-sm font-semibold hover:underline shrink-0"
              style={{ color: 'var(--gov-blue)' }}
            >
              View All Updates
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {NEWS.map((n, i) => (
              <div
                key={i}
                className="rounded-2xl border overflow-hidden bg-white hover:shadow-md transition-all duration-200 hover:-translate-y-1 cursor-pointer"
                style={{ borderColor: 'var(--gov-border)' }}
              >
                <div
                  className="h-2 w-full"
                  style={{ background: i === 0 ? 'var(--gov-blue)' : i === 1 ? 'var(--gov-green-light)' : 'var(--gov-gold)' }}
                />
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{
                        background: i === 0 ? 'rgba(21,101,192,0.1)' : i === 1 ? 'rgba(46,125,50,0.1)' : 'rgba(198,162,39,0.1)',
                      }}
                    >
                      <span
                        className="material-symbols-outlined text-lg"
                        style={{
                          color: i === 0 ? 'var(--gov-blue)' : i === 1 ? 'var(--gov-green-light)' : 'var(--gov-gold)',
                          fontVariationSettings: "'FILL' 1",
                        }}
                      >
                        {n.icon}
                      </span>
                    </div>
                    <span
                      className="px-2.5 py-1 rounded-full text-xs font-bold"
                      style={{
                        background: i === 0 ? '#dbeafe' : i === 1 ? '#dcfce7' : '#fef3c7',
                        color: i === 0 ? '#1e40af' : i === 1 ? '#166534' : '#92400e',
                      }}
                    >
                      {n.tag}
                    </span>
                  </div>
                  <h3 className="font-bold text-base mb-2" style={{ color: 'var(--gov-navy)' }}>{n.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed mb-4">{n.desc}</p>
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--gov-text-light)' }}>
                    <span className="material-symbols-outlined text-sm">calendar_today</span>
                    {n.date}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== ACCESSIBILITY TOOLBAR ===== */}
      <section className="py-8 px-6 md:px-12" style={{ background: 'var(--gov-navy)' }}>
        <div className="max-w-[1312px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-left">
            <h3 className="text-white font-bold text-lg flex items-center gap-2">
              <span className="material-symbols-outlined" style={{ color: 'var(--gov-gold)', fontVariationSettings: "'FILL' 1" }}>accessibility_new</span>
              Accessibility Tools
            </h3>
            <p className="text-white/60 text-sm mt-1">Customize your experience for better readability and accessibility.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleToggleContrast}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors hover:bg-white/10"
              style={{ borderColor: 'rgba(255,255,255,0.2)', color: 'white' }}
            >
              <span className="material-symbols-outlined text-sm">contrast</span>
              {highContrast ? 'Normal Contrast' : 'High Contrast'}
            </button>
            <button
              onClick={() => handleFontSize('up')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors hover:bg-white/10"
              style={{ borderColor: 'rgba(255,255,255,0.2)', color: 'white' }}
            >
              <span className="material-symbols-outlined text-sm">text_increase</span>
              Larger Text
            </button>
            <button
              onClick={() => handleFontSize('down')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors hover:bg-white/10"
              style={{ borderColor: 'rgba(255,255,255,0.2)', color: 'white' }}
            >
              <span className="material-symbols-outlined text-sm">text_decrease</span>
              Smaller Text
            </button>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer style={{ background: 'var(--gov-navy-dark)', color: 'rgba(255,255,255,0.7)' }}>
        <div className="max-w-[1312px] mx-auto px-6 md:px-12 py-14">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
            {/* Brand column */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center border-2"
                  style={{ borderColor: 'var(--gov-gold)', background: 'rgba(198,162,39,0.1)' }}
                >
                  <span className="material-symbols-outlined text-lg" style={{ color: 'var(--gov-gold)', fontVariationSettings: "'FILL' 1" }}>account_balance</span>
                </div>
                <div>
                  <div className="text-white font-black text-sm tracking-tight">CIVIC PULSE</div>
                  <div className="text-[9px] uppercase tracking-widest" style={{ color: 'var(--gov-gold)', opacity: 0.8 }}>Gov. Services Portal</div>
                </div>
              </div>
              <p className="text-sm leading-relaxed mb-4">
                An official digital platform for civic complaint management, citizen engagement, and municipal transparency.
              </p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>© 2026 Civic Pulse Government Solutions. All rights reserved.</p>
            </div>

            {/* Links columns */}
            {[
              {
                title: 'Services',
                links: ['Submit Complaint', 'Track Status', 'View Updates', 'Emergency Services'],
              },
              {
                title: 'Government',
                links: ['About Us', 'Department Directory', 'Ward Information', 'RTI Portal'],
              },
              {
                title: 'Support',
                links: ['Help Center', 'Contact Us', 'Privacy Policy', 'Terms of Service'],
              },
            ].map((col, i) => (
              <div key={i}>
                <h4 className="text-white font-bold text-sm mb-4">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map(link => (
                    <li key={link}>
                      <a
                        href="#"
                        className="text-sm hover:text-white transition-colors"
                        onClick={e => e.preventDefault()}
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Emergency bar */}
          <div
            className="rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 border"
            style={{ background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.25)' }}
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-2xl" style={{ color: '#fca5a5', fontVariationSettings: "'FILL' 1" }}>emergency</span>
              <div>
                <p className="text-white font-bold text-sm">Emergency? Call Directly</p>
                <p className="text-xs text-white/60">Do not use this portal for life-threatening emergencies</p>
              </div>
            </div>
            <div className="flex gap-4 text-sm">
              {[
                { label: 'Police', num: '100' },
                { label: 'Fire', num: '101' },
                { label: 'Medical', num: '108' },
              ].map(e => (
                <a
                  key={e.label}
                  href={`tel:${e.num}`}
                  className="flex flex-col items-center px-4 py-1.5 rounded-lg border font-bold transition-colors hover:bg-white/10"
                  style={{ borderColor: 'rgba(255,255,255,0.2)', color: 'white' }}
                >
                  <span className="text-lg">{e.num}</span>
                  <span className="text-xs text-white/60">{e.label}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Bottom bar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 mt-8 pt-6 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Powered by Civic Pulse Platform v2.4.1 · Compliant with Government IT Standards 2023
            </p>
            <div className="flex gap-1">
              {['W3C', 'WCAG 2.1 AA', 'DPDP'].map(badge => (
                <span
                  key={badge}
                  className="text-xs px-2 py-0.5 rounded border font-mono"
                  style={{ borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.4)' }}
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
