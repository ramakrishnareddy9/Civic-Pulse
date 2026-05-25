import { useNavigate } from 'react-router-dom'
import { useAuth } from '@hooks/useAuth'
import { ROUTES } from '@utils/constants'
import { useState } from 'react'

export function LandingPage() {
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuth()
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

  const handleToggleContrast = () => {
    setHighContrast(!highContrast)
    if (!highContrast) {
      document.body.classList.add('grayscale')
    } else {
      document.body.classList.remove('grayscale')
    }
  }

  return (
    <div className={`min-h-screen bg-background text-on-surface font-body-md ${highContrast ? 'contrast-125' : ''}`}>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-surface py-xl md:py-[120px] px-margin-mobile md:px-margin-desktop border-b border-outline-variant">
        <div className="max-w-[1312px] mx-auto grid grid-cols-1 lg:grid-cols-2 items-center gap-xl">
          <div className="z-10 text-center lg:text-left">
            <h1 className="font-headline-xl text-headline-xl text-primary mb-md font-bold leading-tight">
              Engage with Your City
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant mb-xl max-w-xl mx-auto lg:mx-0">
              Submit concerns, track city services, and stay informed about your community's progress with our unified civic platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-md justify-center lg:justify-start">
              <button 
                onClick={() => handleActionClick(ROUTES.CITIZEN.SUBMIT_COMPLAINT)}
                className="bg-primary text-on-primary px-lg py-md rounded-lg font-label-lg text-label-lg transition-transform active:scale-95 shadow-md hover:bg-primary-container cursor-pointer"
              >
                Submit a Complaint
              </button>
              <button 
                onClick={() => handleActionClick(ROUTES.CITIZEN.DASHBOARD)}
                className="border border-outline text-primary px-lg py-md rounded-lg font-label-lg text-label-lg transition-colors hover:bg-surface-container-low active:scale-95 cursor-pointer"
              >
                Track Status
              </button>
            </div>
          </div>
          <div className="hidden lg:block relative h-[500px] w-full bg-surface-container-high rounded-full overflow-hidden mui-card-shadow">
            <img 
              alt="Modern Cityscape" 
              className="absolute inset-0 w-full h-full object-cover mix-blend-multiply opacity-90" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAOF34iyIdo1-bvYxfVeKAV4y1lGTS6YCZIiYBdXbqQ8DxxOyk3qTDhQOuoWdJcLAR2I-VKCSUZzp2r8PiqWQQ-t6DCOWoyXjdAAHkEqc1mp5yjUwqdvJhuq9nFThApJP1FonJj6yRiMoyzqOcmr4FBaWcLWiwFnngK-cEbQuF21sv1GRg0PEUUg8TOriE9VlEm3NrhOYOUYU6dszhhvbDCVTS3gsqB5tX80ND6bRX2j4MpMHuRPgp3JRENzNkZPlPAhAtoHwNfXQo"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent"></div>
          </div>
        </div>
      </section>

      {/* Features Section (Bento Grid) */}
      <section className="py-xl px-margin-mobile md:px-margin-desktop bg-surface-container-lowest">
        <div className="max-w-[1312px] mx-auto">
          <div className="text-center mb-xl">
            <h2 className="font-headline-lg text-headline-lg text-primary mb-sm font-bold">Designed for Efficiency</h2>
            <div className="h-1 w-16 bg-primary mx-auto rounded-full"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
            {/* Feature 1 */}
            <div className="p-lg bg-surface border border-outline-variant rounded-xl mui-card-shadow hover:border-primary transition-all group text-left">
              <div className="w-12 h-12 rounded-lg bg-secondary-container flex items-center justify-center mb-md group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-primary text-[32px]">bolt</span>
              </div>
              <h3 className="font-headline-md text-headline-md text-primary mb-sm font-semibold">Fast Response</h3>
              <p className="font-body-md text-body-md text-on-surface-variant">Automated routing ensures your concerns reach the right department in seconds, reducing wait times significantly.</p>
            </div>
            {/* Feature 2 */}
            <div className="p-lg bg-surface border border-outline-variant rounded-xl mui-card-shadow hover:border-primary transition-all group text-left">
              <div className="w-12 h-12 rounded-lg bg-secondary-container flex items-center justify-center mb-md group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-primary text-[32px]">visibility</span>
              </div>
              <h3 className="font-headline-md text-headline-md text-primary mb-sm font-semibold">Transparent Tracking</h3>
              <p className="font-body-md text-body-md text-on-surface-variant">Real-time dashboards show exactly where your request stands in the lifecycle, from submission to final resolution.</p>
            </div>
            {/* Feature 3 */}
            <div className="p-lg bg-surface border border-outline-variant rounded-xl mui-card-shadow hover:border-primary transition-all group text-left">
              <div className="w-12 h-12 rounded-lg bg-secondary-container flex items-center justify-center mb-md group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-primary text-[32px]">smartphone</span>
              </div>
              <h3 className="font-headline-md text-headline-md text-primary mb-sm font-semibold">Mobile Accessibility</h3>
              <p className="font-body-md text-body-md text-on-surface-variant">Report issues on the go with our fully responsive web platform, designed for seamless use on any mobile device.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Updates Section */}
      <section className="py-xl px-margin-mobile md:px-margin-desktop bg-surface-container-low">
        <div className="max-w-[1312px] mx-auto text-left">
          <div className="flex justify-between items-end mb-xl">
            <div>
              <h2 className="font-headline-lg text-headline-lg text-primary font-bold">Recent Updates</h2>
              <p className="font-body-md text-body-md text-on-surface-variant">What's happening in your ward</p>
            </div>
            <button className="text-primary font-label-lg text-label-lg flex items-center gap-xs hover:underline cursor-pointer">
              View All <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
            {/* News Item 1 */}
            <div className="flex flex-col md:flex-row bg-surface rounded-xl overflow-hidden mui-card-shadow border border-outline-variant h-full">
              <div className="md:w-1/3 h-48 md:h-full relative overflow-hidden">
                <img 
                  alt="City Maintenance" 
                  className="absolute inset-0 w-full h-full object-cover" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuD4wnPmcnp8YvfEBAHvhCxTyRvgKlXMHArOig9fuFE2fgPxWa9Q0P_nSgy5d_GubBHWAti1jc0uunxTr-29MgisKTB19GgPAkZden--z1wQ2nwOkgaxB1yLVhjX_hRqqNAm044qCgWnChwANV1Sdm7_p8J45TpL0PegI37rXVOgkIT-vQ8INN7iX1T1Wp5xGlYsE1HA4fEEqsdRWQG-HjdJnhTbb8LmbNpd19E7SVNgn-JZU8SPJXzIaxDUE7nc4-0YKoZwURnNsoA"
                />
              </div>
              <div className="p-lg md:w-2/3 flex flex-col justify-center">
                <span className="bg-secondary-container text-on-secondary-container text-label-md font-label-md px-sm py-[2px] rounded-full w-fit mb-sm">Infrastructure</span>
                <h4 className="font-headline-md text-headline-md text-primary mb-sm leading-tight font-semibold">New Smart Lighting Initiative in Ward 4</h4>
                <p className="font-body-md text-body-md text-on-surface-variant mb-md">Upgrading 500 street lamps to LED with IoT connectivity for better energy management and safety.</p>
                <span className="text-label-md font-label-md text-outline">October 24, 2024</span>
              </div>
            </div>
            {/* News Item 2 */}
            <div className="flex flex-col md:flex-row bg-surface rounded-xl overflow-hidden mui-card-shadow border border-outline-variant h-full">
              <div className="md:w-1/3 h-48 md:h-full relative overflow-hidden">
                <img 
                  alt="Public Service" 
                  className="absolute inset-0 w-full h-full object-cover" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuC359UXklwwq4NsvAbA1nFRHUN7bkTiN1TVzGvGqWW6glYjhYf2s62XeCfsQHz68NTmkR5iiQGoaoI2_oKwnof7-LQb1InrMmGH_JKuZZpCgpQNRoCbfnG11L6makVr8MuUdI6MKxgg7J8XtBMZckXLqUeGbK_WWa3DPKFKRzmlHsfjgr7VJTt-5Bk_ifNFQ8TwQErrIrZ94lAkxj_CmRQBC5AD-k5AazpRcaUKnT0eVSrdkdtsARbaSRRJR3XBoK5QmtXiKth8PCA"
                />
              </div>
              <div className="p-lg md:w-2/3 flex flex-col justify-center">
                <span className="bg-secondary-container text-on-secondary-container text-label-md font-label-md px-sm py-[2px] rounded-full w-fit mb-sm">Community</span>
                <h4 className="font-headline-md text-headline-md text-primary mb-sm leading-tight font-semibold">Digital Literacy Workshops Launched</h4>
                <p className="font-body-md text-body-md text-on-surface-variant mb-md">Expanding access to technology training across three central libraries to bridge the digital divide.</p>
                <span className="text-label-md font-label-md text-outline">October 22, 2024</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Accessibility CTA / NICE */}
      <section className="py-lg px-margin-mobile md:px-margin-desktop bg-primary text-on-primary">
        <div className="max-w-[1312px] mx-auto flex flex-col md:flex-row items-center justify-between gap-md text-center md:text-left">
          <div>
            <h5 className="font-headline-sm text-headline-md font-bold mb-xs">Accessibility is our Priority</h5>
            <p className="font-body-md text-body-md opacity-90">Need a high-contrast mode or larger text? Toggle your preferences here.</p>
          </div>
          <div className="flex gap-sm justify-center">
            <button 
              onClick={handleToggleContrast}
              className="border border-on-primary/30 px-md py-sm rounded-lg hover:bg-on-primary/10 transition-colors flex items-center gap-xs font-label-lg text-label-lg cursor-pointer"
            >
              <span className="material-symbols-outlined">contrast</span> {highContrast ? 'Normal Contrast' : 'High Contrast'}
            </button>
            <button className="border border-on-primary/30 px-md py-sm rounded-lg hover:bg-on-primary/10 transition-colors flex items-center gap-xs font-label-lg text-label-lg cursor-pointer">
              <span className="material-symbols-outlined">text_increase</span> Text Size
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

