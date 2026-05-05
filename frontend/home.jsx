import { useEffect, useState } from "react"
import { Link, NavLink, useLocation } from "react-router-dom"
import logoImg from "./public/logo.png"
import heroBg from "./public/hero_bg.png"
import featureChartImg from "./public/p-1.png"
import featureFlowImg from "./public/p-2.png"
import stepOneImg from "./public/step-1.png"

const appSteps = [
  {
    step: "1",
    title: "Connect Your Wallet",
    content:
      "Link your crypto wallet securely to ValGrid. We support major wallets and a frictionless onboarding flow.",
  },
  {
    step: "2",
    title: "Build Your Bot with AI",
    content:
      "Describe your strategy and let AI generate the code instantly. Edit, tweak, and fully customize your bot to match exactly what you want to run.",
  },
  {
    step: "3",
    title: "Deploy & Monitor",
    content:
      "Launch your bot and monitor real-time performance with analytics and activity history.Launch your strategy with a few clicks. No servers, no infrastructure — Valgrid handles it. Track performance in real time, adjust your strategy, and let it run 24/7.",
  },
]

const faqs = [
  {
    question: "What is valgrid?",
    answer:
      "Valgrid is an AI-powered platform where you can create, edit, and deploy automated trading bots. Its where you go from idea → AI-generated bot → live automated strategy, all in one place. Describe your strategy, generate the code, customize it, and run your bot 24/7 across markets—all in one place.",
  },
  {
    question: "Is valgrid free?",
    answer:
      "Yes. The platform is free to access with a small execution fee per trade and no subscription.",
  },
  {
    question: "How do i use valgrid?",
    answer:
      "Create your account, connect wallet, configure your grid parameters, and activate your bot.",
  },
  {
    question: "Can I run multiple grids at once?",
    answer:
      "Yes. Multiple bots can run in parallel across different pairs and configurations.",
  },
]

/** Shown on pricing cards until final amounts are set */
const PRICING_PLACEHOLDER = "TBD"

const pricingPlans = [
  {
    name: "Starter",
    priceNote: "per month",
    description: "Get started with one bot and core templates.",
    features: ["1 active strategy", "Standard templates", "Community support"],
    highlighted: false,
  },
  {
    name: "Growth",
    priceNote: "per month",
    description: "Scale up with more automation and faster execution.",
    features: ["Up to 5 strategies", "Priority routes", "Email support"],
    highlighted: true,
  },
  {
    name: "Pro",
    priceNote: "per month",
    description: "For active traders who need depth and analytics.",
    features: ["Unlimited strategies", "Advanced analytics", "Priority support"],
    highlighted: false,
  },
  {
    name: "Enterprise",
    priceNote: "custom",
    description: "Custom limits, SLAs, and dedicated onboarding.",
    features: ["Dedicated infrastructure", "SLA & reviews", "Account manager"],
    highlighted: false,
  },
]

/** Replace with your waitlist inbox or hook this form to Formspree / API */
const WAITLIST_EMAIL = "waitlist@valgrid.co"

const heroNavPillClass =
  "shrink-0 rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-[#06050c] shadow-md ring-1 ring-black/5 transition hover:bg-neutral-100 sm:px-3.5 sm:py-2 sm:text-xs md:text-sm lg:max-xl:px-2 lg:max-xl:py-1 lg:max-xl:text-[10px] lg:max-xl:leading-none xl:px-3.5 xl:py-2 xl:text-xs"

const heroNavStartClass =
  "ml-auto inline-flex shrink-0 items-center gap-2 rounded-full bg-[#06050c] py-1.5 pl-3 pr-2.5 text-[11px] font-semibold uppercase tracking-wide text-white shadow-lg ring-1 ring-white/10 transition hover:bg-[#1a1a1e] sm:py-2 sm:pl-4 sm:pr-3 sm:text-sm lg:max-xl:gap-1 lg:max-xl:py-1 lg:max-xl:pl-2.5 lg:max-xl:pr-2 lg:max-xl:text-[10px] lg:max-xl:tracking-normal xl:gap-2 xl:py-2 xl:pl-4 xl:pr-3 xl:text-sm"

/** Pill nav + Start — image panel only (lg+); mobile uses hamburger menu instead */
function HeroAnchorPills() {
  return (
    <div className="scrollbar-none hidden w-full min-w-0 shrink-0 flex-nowrap items-center gap-1.5 overflow-x-auto overscroll-x-contain px-3 pb-1.5 pt-2.5 sm:gap-2 sm:px-5 sm:pb-1 sm:pt-4 lg:flex lg:max-xl:gap-1 lg:max-xl:px-4 lg:max-xl:pb-1 lg:max-xl:pt-4 xl:gap-2 xl:px-6 xl:pb-1 xl:pt-5">
      <a href="#features" className={heroNavPillClass}>
        Why Valgrid?
      </a>
      <a href="#pricing" className={heroNavPillClass}>
        Pricing
      </a>
      <a href="#faq" className={heroNavPillClass}>
        Docs
      </a>
      <a href="#footer" className={heroNavPillClass}>
        Contact
      </a>
      <Link to="/strategies" className={heroNavStartClass}>
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#7BD0F9] shadow-[0_0_10px_rgba(123,208,249,0.9)] lg:max-xl:h-1 lg:max-xl:w-1 xl:h-1.5 xl:w-1.5" aria-hidden />
        Start
      </Link>
    </div>
  )
}

export function Home() {
  const { hash } = useLocation()
  const [activeIndex, setActiveIndex] = useState(null)
  const [waitlistEmail, setWaitlistEmail] = useState("")
  const [waitlistMessage, setWaitlistMessage] = useState(null)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  function handleWaitlistSubmit(e) {
    e.preventDefault()
    const trimmed = waitlistEmail.trim()
    if (!trimmed) return
    const subject = encodeURIComponent("ValGrid waitlist signup")
    const body = encodeURIComponent(`Please add this email to the waitlist:\n\n${trimmed}`)
    window.location.href = `mailto:${WAITLIST_EMAIL}?subject=${subject}&body=${body}`
    setWaitlistMessage("Opening your email app — send the message to complete signup.")
    setWaitlistEmail("")
  }

  useEffect(() => {
    if (!hash) return
    const node = document.querySelector(hash)
    if (node) node.scrollIntoView({ behavior: "smooth" })
  }, [hash])

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#06050c] text-white">
      <section className="relative grid min-h-0 w-full grid-cols-1 grid-rows-[minmax(0,1fr)_minmax(26svh,34svh)] gap-0 bg-white pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)] font-['Poppins',system-ui,sans-serif] text-[#06050c] antialiased max-lg:h-[100svh] max-lg:max-h-[100svh] max-lg:overflow-hidden sm:grid-rows-[minmax(0,1fr)_minmax(28svh,36svh)] lg:h-[100svh] lg:max-h-[100svh] lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:grid-rows-1 lg:gap-3 lg:overflow-x-visible lg:overflow-y-hidden lg:pb-0 lg:pt-0 lg:items-stretch xl:gap-4">
        {/* Left: compact mobile stack fits in upper fraction of 100svh */}
        <div className="isolate grid min-h-0 w-full grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden px-4 pb-3 pt-3 max-lg:h-full max-lg:min-h-0 sm:px-6 sm:pb-4 sm:pt-4 lg:h-full lg:max-h-full lg:grid-rows-[auto_minmax(0,1fr)_auto] lg:px-8 lg:pb-10 lg:pt-9 xl:px-10 xl:pb-11 xl:pt-11 xl:pl-12 xl:pr-10 [@media(max-height:720px)]:pb-3 [@media(max-height:720px)]:pt-3 lg:[@media(max-height:720px)]:py-6">
          <header className="shrink-0">
            <div className="mb-2 flex items-start justify-between gap-3 sm:mb-8 lg:mb-4">
              <Link
                to="/"
                className="hero-logo-in text-[1.4rem] font-medium tracking-[0.02em] text-[#111111] lowercase max-lg:leading-none sm:text-[1.85rem]"
                onClick={() => setMobileNavOpen(false)}
              >
                sooma
              </Link>
              <button
                type="button"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#06050c]/10 bg-white text-[#06050c] shadow-sm transition hover:bg-neutral-50 sm:h-10 sm:w-10 lg:hidden"
                aria-expanded={mobileNavOpen}
                aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
                onClick={() => setMobileNavOpen((open) => !open)}
              >
                <span className="sr-only">Menu</span>
                <span className="flex flex-col gap-1">
                  <span className="h-0.5 w-5 rounded-full bg-[#06050c]/85" />
                  <span className="h-0.5 w-5 rounded-full bg-[#06050c]/85" />
                </span>
              </button>
            </div>

            {mobileNavOpen && (
              <div className="mb-6 rounded-2xl border border-[#06050c]/10 bg-neutral-50 p-3 shadow-sm lg:hidden">
                <div className="flex flex-col gap-0.5">
                  <NavLink
                    to="/"
                    end
                    onClick={() => setMobileNavOpen(false)}
                    className={({ isActive }) =>
                      "flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium " +
                      (isActive ? "bg-white text-[#06050c] shadow-sm" : "text-[#06050c]/75 hover:bg-white/80")
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span
                          className={
                            "h-1.5 w-1.5 rounded-full " + (isActive ? "bg-[#0094BC]" : "bg-transparent")
                          }
                          aria-hidden
                        />
                        Home
                      </>
                    )}
                  </NavLink>
                  <GlassNavAnchorMobile href="#features" onNavigate={() => setMobileNavOpen(false)}>
                    Why Valgrid?
                  </GlassNavAnchorMobile>
                  <GlassNavAnchorMobile href="#pricing" onNavigate={() => setMobileNavOpen(false)}>
                    Pricing
                  </GlassNavAnchorMobile>
                  <GlassNavAnchorMobile href="#faq" onNavigate={() => setMobileNavOpen(false)}>
                    Docs
                  </GlassNavAnchorMobile>
                  <GlassNavAnchorMobile href="#footer" onNavigate={() => setMobileNavOpen(false)}>
                    Contact
                  </GlassNavAnchorMobile>
                  <Link
                    to="/strategies"
                    className="mt-1 rounded-xl bg-[#06050c] px-4 py-3 text-center text-sm font-semibold text-white hover:bg-[#1a1a1e]"
                    onClick={() => setMobileNavOpen(false)}
                  >
                    Sign in
                  </Link>
                </div>
              </div>
            )}
          </header>

          <div className="min-h-0 overflow-hidden lg:scrollbar-none lg:overflow-y-auto lg:overscroll-y-contain [-webkit-overflow-scrolling:touch]">
            <div className="flex flex-col justify-start gap-0 py-2 max-lg:py-1 sm:py-6 lg:min-h-full lg:justify-center lg:py-6">
            <div className="hero-copy-block-in">
            <h1 className="max-w-[min(100%,24rem)] text-[clamp(1.35rem,4.5vw+0.35rem,3.5rem)] font-semibold leading-[1.12] tracking-[-0.02em] text-[#111111] max-lg:max-w-none sm:max-w-[26ch] lg:max-w-[min(100%,22ch)] lg:text-[clamp(1.65rem,2.2vw+0.75rem,3.25rem)] lg:leading-[1.1] xl:max-w-[26ch] xl:text-[clamp(1.85rem,2vw+0.85rem,4rem)]">
              <span className="block">Unleash your</span>
              <span className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 sm:mt-4 sm:gap-x-3">
                <span
                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-pink-300 via-pink-400 to-rose-500 px-2 align-middle shadow-[0_6px_16px_rgba(244,114,182,0.22)] sm:h-11 sm:w-auto sm:px-3.5"
                  aria-hidden
                >
                  <svg className="h-3.5 w-3.5 text-white drop-shadow-sm sm:h-5 sm:w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                </span>
                <span className="min-w-0 text-[0.92em] leading-tight sm:text-[1em]">is here to listen</span>
              </span>
              <span className="mt-1.5 block sm:mt-4">without judgment</span>
            </h1>
            <p className="mt-2 max-w-xl text-[0.8125rem] font-light leading-snug text-[#555555] sm:mt-8 sm:text-lg sm:leading-relaxed">
              Your wellness assistant is here 24/7. Feeling anxious or burned out? It supports you safely and anonymously
            </p>
            <div className="mt-3 sm:mt-9 lg:mt-7">
              <Link
                to="/strategies"
                className="group inline-flex h-10 items-center gap-2 rounded-full bg-black px-5 text-[10px] font-bold uppercase tracking-[0.18em] text-white shadow-[0_8px_28px_rgba(0,0,0,0.12)] transition hover:bg-neutral-900 sm:h-[3.75rem] sm:gap-3 sm:px-9 sm:text-[12px] lg:h-12"
              >
                TALK TO SOMA
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-black transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 sm:h-10 sm:w-10">
                  <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M17 7H8M17 7v9" />
                  </svg>
                </span>
              </Link>
            </div>
            </div>
          </div>
          </div>

          <div className="hero-watch-in relative z-[1] shrink-0 border-t border-neutral-200 bg-white pt-3 sm:pt-6 lg:pt-5 [@media(max-height:720px)]:pt-3">
            <a
              href="#how-it-works"
              className="group flex max-w-lg gap-1.5 rounded-xl border border-neutral-200 bg-neutral-50 p-2 pr-2 transition hover:border-neutral-300 hover:bg-white sm:gap-3 sm:rounded-2xl sm:p-4 sm:pr-5"
            >
              <span className="flex w-8 shrink-0 flex-col justify-center self-stretch rounded-l-lg bg-black py-1.5 text-center text-[8px] font-bold uppercase leading-tight tracking-wider text-white sm:w-11 sm:rounded-l-xl sm:py-2 sm:text-[10px]">
                Watch
              </span>
              <img
                src={stepOneImg}
                alt=""
                className="h-14 w-14 shrink-0 rounded-lg object-cover sm:h-[4.75rem] sm:w-[4.75rem] sm:rounded-xl"
                width={96}
                height={96}
              />
              <div className="min-w-0 flex-1 py-0.5">
                <p className="text-[11px] font-medium leading-snug text-black sm:text-[15px] sm:leading-snug">
                  Learn how the AI supports your mental health and keeps your data private
                </p>
                <span className="mt-1 inline-block rounded-full bg-pink-100 px-2 py-0.5 text-[10px] font-semibold text-pink-700 sm:mt-2 sm:px-2.5 sm:text-[11px]">
                  5 minutes
                </span>
              </div>
            </a>
          </div>
        </div>

        {/* Right column — fills grid cell; inner panel uses height 100% (no fixed svh mins) */}
        <div className="relative flex min-h-0 w-full min-w-0 flex-col p-2 pt-0.5 sm:p-3 lg:h-full lg:min-h-0 lg:p-4 lg:pl-2 lg:pr-5 lg:pt-6 xl:pr-6">
          <div className="hero-panel-in relative flex h-full min-h-[26svh] w-full flex-1 flex-col overflow-hidden rounded-[1.15rem] border border-white/30 bg-[#0b1424] shadow-[0_28px_90px_rgba(0,0,0,0.22)] sm:min-h-[28svh] sm:rounded-[1.75rem] lg:min-h-0 lg:rounded-[2.25rem]">
            <img
              src={heroBg}
              alt=""
              className="pointer-events-none absolute inset-0 h-full w-full object-cover"
              decoding="async"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-black/15 to-black/30" aria-hidden />

            <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden overflow-x-hidden overscroll-y-contain lg:overflow-y-auto lg:scrollbar-none">
              <div className="hero-panel-nav-in min-w-0 shrink-0">
                <HeroAnchorPills />
              </div>

              <div className="hero-panel-stats-in mt-auto w-full max-w-full shrink-0 px-2 pb-2 pt-1 sm:px-4 sm:pb-5 sm:pt-3 lg:px-6 lg:pb-6">
                <div className="max-lg:origin-bottom max-lg:scale-[0.82] max-lg:[@media(min-height:700px)]:scale-90 lg:scale-100">
                  <HeroStatsGlassStack embedInPanel />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="bg-[#06050c] px-4 py-16 sm:px-8 sm:py-20 lg:px-16 xl:px-32">
        <h2 className="bg-gradient-to-b from-white via-[#B4F1FF] to-[#7BD0F9] bg-clip-text px-2 py-8 text-center text-4xl font-bold text-transparent sm:py-10 sm:text-5xl md:text-6xl lg:text-7xl">
          Why Valgrid?
        </h2>
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-4 lg:grid-cols-3">
          <FeatureCard
            title="Build bots instantly, no setup"
            description="Valgrid removes the friction of getting started. You don’t need to set up servers, manage infrastructure, or connect multiple tools. You can go from idea to a working trading bot directly inside the platform, with a clean interface that simplifies even complex strategies."
            className="col-span-1 bg-[#7BD0F9] lg:col-span-2 lg:min-h-[300px]"
            image={{
              src: featureFlowImg,
              alt: "build bots visualization",
              width: 3000,
              height: 2000,
              className:
                "relative z-0 mx-auto mt-10 block w-full max-w-[95%] rounded-2xl object-cover sm:mt-12 md:absolute md:-bottom-12 md:left-0 md:mt-0 md:h-auto md:w-auto md:max-w-none md:scale-125 lg:-bottom-10",
            }}
          />
          <FeatureCard
            title="AI-powered strategy creation"
            description="Instead of writing everything from scratch, Valgrid lets you generate trading bots using AI. You can describe your idea, have the system generate code, and then edit or refine it to fit your strategy."
            className="col-span-1 bg-[#B4F1FF]"
          />
          <FeatureCard
            title="Deploy and run in one place"
            description="Valgrid is an all-in-one environment where you can build, backtest, and deploy your bots seamlessly. Once deployed, your strategies run 24/7 across markets without requiring constant monitoring, allowing you to stay active in the market without being glued to a screen."
            className="col-span-1 min-h-0 bg-[#7BD0F9] sm:min-h-[500px] lg:col-span-3 lg:min-h-[600px] xl:min-h-[300px]"
            image={{
              src: featureChartImg,
              alt: "deploy and run visualization",
              width: 500,
              height: 500,
              className:
                "relative z-0 mx-auto mt-8 block h-auto w-full max-w-[280px] rounded-2xl object-contain sm:max-w-[360px] md:absolute md:bottom-[-7rem] md:z-0 md:mx-0 md:mt-0 md:max-h-[min(52vw,420px)] md:w-[min(480px,58vw)] md:max-w-none md:object-cover md:-right-[40%] lg:bottom-[-8rem] xl:-bottom-32 xl:right-[5%]",
            }}
          />
        </div>
        <div className="mt-10 flex justify-center">
          <Link
            to="/strategies"
            className="inline-flex h-10 items-center rounded-full bg-[#0094BC] px-8 text-sm font-semibold text-white transition-colors hover:bg-[#00aad8]"
          >
            Learn More
          </Link>
        </div>
      </section>

      <section id="how-it-works" className="relative bg-[#06050c] px-4 py-12 sm:p-8 lg:p-16 xl:p-32">
        <div className="relative z-10 mx-auto w-full max-w-7xl">
          <div className="mb-16 text-center lg:mb-20">
          <h2 className="mb-6 bg-gradient-to-b from-white to-[#7BD0F9] bg-clip-text text-4xl font-bold text-transparent sm:text-5xl md:text-6xl lg:text-7xl">
              How It Works
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-white/50 md:text-xl">
              Get started in three simple steps. Automate your trading and let
              ValGrid work for you.
            </p>
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0d0b14]">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#7BD0F9]/45 to-transparent" />
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute left-1/2 top-1/2 h-[400px] w-[800px] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(ellipse_at_center,rgb(123_208_249_/_0.12),transparent_70%)]" />
              <div className="absolute -left-20 -top-20 h-[350px] w-[350px] bg-[radial-gradient(circle,rgb(180_241_255_/_0.09),transparent_70%)]" />
              <div className="absolute -bottom-20 -right-20 h-[350px] w-[350px] bg-[radial-gradient(circle,rgb(0_148_188_/_0.08),transparent_70%)]" />
            </div>
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.025]"
              style={{
                backgroundImage:
                  "linear-gradient(rgb(123 208 249 / 0.28) 1px, transparent 1px), linear-gradient(90deg, rgb(123 208 249 / 0.28) 1px, transparent 1px)",
                backgroundSize: "50px 50px",
              }}
            />

            <div className="relative z-10 border-b border-white/[0.06] px-6 py-5 lg:px-12">
              <div className="mx-auto flex max-w-2xl items-center justify-center gap-3 lg:justify-between lg:gap-0">
                {appSteps.map((step, index) => (
                  <div key={step.step} className="contents">
                    <div className="flex items-center gap-2.5">
                      <div className="relative">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#7BD0F9]/40 bg-[#0094BC]/15 shadow-[0_0_15px_rgb(123_208_249_/_0.2)]">
                          <span className="text-sm font-bold text-[#7BD0F9]">
                            {step.step}
                          </span>
                        </div>
                      </div>
                      <span className="hidden text-sm font-medium text-white/50 sm:block">
                        {step.title}
                      </span>
                    </div>
                    {index < appSteps.length - 1 && (
                      <div className="mx-4 hidden flex-1 items-center lg:flex">
                        <div className="h-px flex-1 bg-gradient-to-r from-[#7BD0F9]/30 to-[#0094BC]/15" />
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 14 14"
                          fill="none"
                          className="-ml-px shrink-0 text-[#7BD0F9]/35"
                        >
                          <path
                            d="M5 3l4 4-4 4"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="relative z-10 p-6 lg:p-10">
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-0">
                {appSteps.map((item, index) => {
                  const isLast = index === appSteps.length - 1
                  return (
                    <div
                      key={item.step}
                      className={
                        "flex flex-col lg:px-8 first:lg:pl-0 last:lg:pr-0 " +
                        (!isLast ? "lg:border-r lg:border-white/[0.06]" : "")
                      }
                    >
                      <div className="group relative mb-6 flex h-52 w-full items-center justify-center overflow-hidden rounded-2xl lg:h-56">
                        <div className="absolute inset-0 rounded-2xl border border-white/[0.05] bg-[#080712]" />
                        <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(ellipse_at_center,rgb(123_208_249_/_0.06),transparent_70%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#7BD0F9]/20 to-transparent" />
                        <div className="relative z-10 flex h-full w-full items-center justify-center">
                          {index === 0 ? (
                            <img
                              src={stepOneImg}
                              alt="Wallet connection"
                              width={200}
                              height={200}
                              className="object-contain"
                            />
                          ) : index === 1 ? (
                            <AiCodeEditDeployIllustration />
                          ) : (
                            <MonitorIllustration />
                          )}
                        </div>
                      </div>

                      <h3 className="mb-2 text-xl font-semibold text-white lg:text-2xl">
                        {item.title}
                      </h3>
                      <p className="text-sm leading-relaxed text-white/40 lg:text-base">
                        {item.content}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
          <div className="mt-10 flex justify-center">
            <a
              href="#waitlist"
              className="inline-flex h-12 items-center rounded-full bg-[#0094BC] px-8 text-sm font-semibold text-white shadow-[0_0_30px_rgb(0_148_188_/_0.25)] transition-all duration-300 hover:bg-[#00aad8] hover:shadow-[0_0_40px_rgb(123_208_249_/_0.35)]"
            >
              Join waitlist
            </a>
          </div>
        </div>
      </section>

      <section id="pricing" className="relative bg-[#06050c] px-4 py-16 sm:px-6 sm:py-24 lg:px-12">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-24 h-[320px] w-[min(900px,90vw)] -translate-x-1/2 bg-[radial-gradient(ellipse_at_center,rgb(123_208_249_/_0.08),transparent_65%)]" />
        </div>
        <div className="relative z-10 mx-auto max-w-7xl">
          <div className="mb-14 text-center">
            <h2 className="mb-4 inline-block w-full overflow-visible bg-gradient-to-b from-white to-[#7BD0F9] bg-clip-text pb-2 text-4xl font-bold leading-snug text-transparent sm:text-5xl md:text-6xl">
              Pricing
            </h2>
            <p className="mx-auto max-w-2xl text-base text-white/45 md:text-lg">
              Four plans for every stage of your automation journey. Final prices will be announced soon.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            {pricingPlans.map((plan) => (
              <div
                key={plan.name}
                className={
                  "relative flex flex-col overflow-hidden rounded-3xl border bg-[#0d0b14] p-6 transition-all duration-300 hover:-translate-y-0.5 " +
                  (plan.highlighted
                    ? "border-[#7BD0F9]/45 shadow-[0_0_40px_rgb(123_208_249_/_0.12)]"
                    : "border-white/[0.08] hover:border-[#7BD0F9]/25")
                }
              >
                {plan.highlighted && (
                  <div className="absolute right-4 top-4 rounded-full border border-[#7BD0F9]/30 bg-[#0094BC]/20 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#7BD0F9]">
                    Popular
                  </div>
                )}
                <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-bold tracking-tight text-white">{PRICING_PLACEHOLDER}</span>
                  <span className="text-sm text-white/40">{plan.priceNote}</span>
                </div>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-white/45">{plan.description}</p>
                <ul className="mt-6 space-y-2.5 border-t border-white/[0.06] pt-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex gap-2 text-sm text-white/55">
                      <span className="mt-0.5 shrink-0 text-[#4ade80]" aria-hidden>
                        ✓
                      </span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href="#waitlist"
                  className="mt-8 inline-flex h-11 w-full items-center justify-center rounded-full border border-white/[0.1] bg-[#06050c] text-sm font-semibold text-white transition-colors hover:border-[#7BD0F9]/35 hover:bg-[#0f0d17]"
                >
                  Join waitlist
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="waitlist" className="border-y border-white/[0.06] bg-[#06050c] px-4 py-16 sm:px-6 sm:py-20 lg:px-12">
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0d0b14] px-4 py-10 sm:px-10 sm:py-12 lg:px-14">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgb(123_208_249_/_0.08),transparent_55%)]" />
          <div className="relative z-10">
            <h2 className="text-center text-3xl font-bold text-white md:text-4xl">Join the waitlist</h2>
            <p className="mt-3 text-center text-sm leading-relaxed text-white/45 md:text-base">
              Leave your email and we will notify you when new plans and features go live.
            </p>
            <form onSubmit={handleWaitlistSubmit} className="mx-auto mt-8 w-full">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
                <label className="sr-only" htmlFor="waitlist-email">
                  Email address
                </label>
                <input
                  id="waitlist-email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  required
                  placeholder="you@example.com"
                  value={waitlistEmail}
                  onChange={(ev) => setWaitlistEmail(ev.target.value)}
                  className="min-h-12 flex-1 rounded-full border border-white/[0.1] bg-[#06050c] px-5 text-sm text-white outline-none ring-0 placeholder:text-white/25 focus:border-[#7BD0F9]/40 focus:shadow-[0_0_20px_rgb(123_208_249_/_0.15)]"
                />
                <button
                  type="submit"
                  className="inline-flex h-12 shrink-0 items-center justify-center rounded-full bg-[#0094BC] px-8 text-sm font-semibold text-white shadow-[0_0_30px_rgb(0_148_188_/_0.25)] transition-all hover:bg-[#00aad8] hover:shadow-[0_0_40px_rgb(123_208_249_/_0.35)] sm:px-10"
                >
                  Join waitlist
                </button>
              </div>
              {waitlistMessage && (
                <p className="mt-4 text-center text-sm text-[#7BD0F9]/90">{waitlistMessage}</p>
              )}
              <p className="mt-4 text-center text-xs text-white/30">
                By submitting, you agree to hear from ValGrid about product updates. Unsubscribe anytime.
              </p>
            </form>
          </div>
        </div>
      </section>

      <section id="faq" className="bg-[#06050c] px-4 py-16 sm:px-6 sm:py-24 lg:px-12">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-4 bg-gradient-to-b from-white to-[#7BD0F9] bg-clip-text px-2 text-center text-4xl font-bold text-transparent sm:text-5xl md:text-6xl">
            Frequently Asked Questions
          </h2>
          <p className="mb-10 text-center text-white/40">Everything you need to know about ValGrid</p>
          <ul className="space-y-4">
            {faqs.map((item, index) => {
              const open = activeIndex === index
              return (
                <li
                  key={item.question}
                  className="overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0d0b14] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#7BD0F9]/25 hover:bg-[#0f0d17]"
                >
                  <button
                    type="button"
                    onClick={() => setActiveIndex(open ? null : index)}
                    className="flex w-full min-w-0 items-start justify-between gap-3 px-4 py-5 text-left sm:px-6"
                  >
                    <span className="min-w-0 flex-1 text-base font-medium leading-snug sm:text-lg">{item.question}</span>
                    <span className="text-xl text-white/70">{open ? "-" : "+"}</span>
                  </button>
                  {open && (
                    <p className="border-t border-white/[0.04] px-4 pb-6 pt-2 text-sm leading-7 text-white/45 sm:px-6">
                      {item.answer}
                    </p>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      </section>

      <section className="w-full bg-[#06050c] px-4 py-16 sm:px-6 sm:py-20 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0d0b14]">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#7BD0F9]/45 to-transparent" />
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute left-1/2 top-1/2 h-[350px] w-[700px] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(ellipse_at_center,rgb(123_208_249_/_0.12),transparent_70%)]" />
              <div className="absolute -left-20 -top-20 h-[300px] w-[300px] bg-[radial-gradient(circle,rgb(180_241_255_/_0.09),transparent_70%)]" />
              <div className="absolute -bottom-20 -right-20 h-[300px] w-[300px] bg-[radial-gradient(circle,rgb(0_148_188_/_0.08),transparent_70%)]" />
            </div>
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage:
                  "linear-gradient(rgb(123 208 249 / 0.25) 1px, transparent 1px), linear-gradient(90deg, rgb(123 208 249 / 0.25) 1px, transparent 1px)",
                backgroundSize: "60px 60px",
              }}
            />

            <div className="relative z-10 px-5 py-12 text-center sm:px-8 sm:py-16 lg:px-16 lg:py-24">
              <h2 className="mx-auto max-w-2xl text-4xl font-bold leading-[1.1] tracking-tight text-white md:text-5xl lg:text-[3.5rem]">
                Automate your trading,
                <br />
                capture every{" "}
                <span className="bg-gradient-to-r from-[#7BD0F9] to-[#B4F1FF] bg-clip-text font-light italic text-transparent">
                  opportunity
                </span>
              </h2>

              <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-white/55 md:text-lg">
                Deploy grid bots that work 24/7 on Solana. Set your range, pick a
                template, and let intelligent automation handle the rest.
              </p>

              <div className="mt-8 flex justify-center">
                <Link
                  to="/strategies"
                  className="inline-flex h-12 items-center rounded-lg bg-[#0094BC] px-8 text-sm font-semibold text-white shadow-[0_0_30px_rgb(0_148_188_/_0.25)] transition-all duration-300 hover:bg-[#00aad8] hover:shadow-[0_0_40px_rgb(123_208_249_/_0.35)]"
                >
                  Start free today
                  <span className="ml-2">→</span>
                </Link>
              </div>

              <div className="mt-6 flex items-center justify-center gap-4 text-xs font-medium text-white/30">
                <span>No KYC required</span>
                <span className="h-3 w-px bg-white/[0.08]" />
                <span>Non-custodial</span>
                <span className="h-3 w-px bg-white/[0.08]" />
                <span>Start in 60 seconds</span>
              </div>
            </div>

            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#7BD0F9]/30 to-transparent" />
          </div>
        </div>
      </section>

      <footer id="footer" className="border-t border-white/[0.08] bg-[#06050c]">
        <div className="mx-auto max-w-6xl px-6 pb-8 pt-16 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
            <div className="space-y-5">
              <div className="flex items-center gap-2">
                <img src={logoImg} alt="Valgrid" className="h-8 w-8" />
                <span className="text-lg font-bold">
                  <span className="text-[#7BD0F9]">Val</span>grid
                </span>
              </div>
              <p className="max-w-xs text-sm text-white/35">
                Automated grid trading on Solana. Deploy bots that capture every market swing.
              </p>
            </div>
            <FooterColumn
              label="Menu"
              links={[
                { title: "Home", href: "/" },
                { title: "Pricing", href: "#pricing" },
                { title: "Docs", href: "#faq" },
                { title: "Sign In", href: "/strategies" },
              ]}
            />
            <FooterColumn
              label="Resources"
              links={[
                { title: "Grid Trading", href: "#features" },
                { title: "How It Works", href: "#how-it-works" },
                { title: "Waitlist", href: "#waitlist" },
                { title: "FAQ", href: "#faq" },
              ]}
            />
            <FooterColumn
              label="Support"
              links={[
                { title: "Contact Us", href: "#footer" },
                { title: "Terms of Service", href: "/terms" },
                { title: "Privacy Policy", href: "/privacy" },
              ]}
            />
          </div>
          <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/[0.08] pt-6 sm:flex-row">
            <p className="text-xs text-white/20">&copy; {new Date().getFullYear()} Valgrid. All rights reserved.</p>
            <div className="flex items-center gap-5">
              <Link to="/privacy" className="text-xs text-white/20 hover:text-[#7BD0F9]/80">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-xs text-white/20 hover:text-[#7BD0F9]/80">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}

function FeatureCard({ title, description, className, image }) {
  return (
    <article
      className={
        "group mx-auto w-full overflow-hidden rounded-2xl text-[#06050c] transition-all duration-300 hover:-translate-y-1 " +
        className
      }
    >
      <div
        className="relative h-full overflow-hidden rounded-2xl bg-[radial-gradient(88%_100%_at_top,rgba(255,255,255,0.5),rgba(255,255,255,0))] transition-shadow duration-300 group-hover:shadow-[0_18px_40px_rgba(0,0,0,0.28)]"
        style={{
          boxShadow:
            "0 10px 32px rgba(34, 42, 53, 0.12), 0 1px 1px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(34, 42, 53, 0.05), 0 4px 6px rgba(34, 42, 53, 0.08), 0 24px 108px rgba(47, 48, 55, 0.10)",
        }}
      >
        <div
          className={
            "relative h-full px-4 sm:px-10 " +
            (image ? "pb-8 pt-12 sm:pb-12 sm:pt-16 md:py-20" : "py-20")
          }
        >
          <div className={image ? "relative z-10 max-w-2xl" : ""}>
            <h3 className="text-left text-2xl font-semibold">{title}</h3>
            <p className="mt-4 text-left text-base/7 text-[#06050c]/70">{description}</p>
          </div>
          {image && (
            <img
              src={image.src}
              width={image.width}
              height={image.height}
              alt={image.alt}
              className={image.className}
              decoding="async"
            />
          )}
        </div>
      </div>
    </article>
  )
}

function GlassNavAnchorMobile({ href, children, onNavigate }) {
  return (
    <a
      href={href}
      className="block rounded-xl px-4 py-3 text-sm font-medium text-[#06050c]/85 transition-colors hover:bg-white/35"
      onClick={onNavigate}
    >
      {children}
    </a>
  )
}

function HeroStatsGlassStack({ embedInPanel = false }) {
  return (
    <div
      className={
        embedInPanel ? "w-full min-w-0" : "mx-auto w-full min-w-0 max-w-[400px] shrink-0 lg:mx-0 lg:w-full lg:max-w-none"
      }
    >
      <div
        className={
          embedInPanel
            ? "relative overflow-hidden rounded-2xl border border-white/20 bg-white/[0.07] p-2 shadow-[0_20px_60px_rgba(0,0,0,0.42),inset_0_1px_0_rgba(255,255,255,0.12)] ring-1 ring-inset ring-white/10 backdrop-blur-2xl backdrop-saturate-150 sm:rounded-[1.35rem] sm:bg-white/[0.09] sm:p-3 md:p-4"
            : "relative overflow-hidden rounded-[1.25rem] border border-[#7BD0F9]/35 bg-gradient-to-br from-[#0094BC] via-[#086f8a] to-[#062432] p-1.5 shadow-[0_20px_48px_rgba(0,80,110,0.42)] max-md:rounded-xl sm:rounded-[1.5rem] sm:p-3 md:p-3.5 lg:rounded-[1.75rem] lg:p-4"
        }
      >
        <div
          className={
            embedInPanel
              ? "pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_-10%,rgba(180,241,255,0.35),transparent_55%)]"
              : "pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_25%_0%,rgba(180,241,255,0.22),transparent_55%)]"
          }
        />
        <div
          className={
            embedInPanel
              ? "pointer-events-none absolute inset-0 bg-[linear-gradient(155deg,rgba(255,255,255,0.18)_0%,rgba(255,255,255,0.04)_42%,transparent_68%)]"
              : "pointer-events-none absolute inset-0 bg-[linear-gradient(160deg,rgba(255,255,255,0.06)_0%,transparent_40%)]"
          }
        />
        {embedInPanel && (
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/25 via-transparent to-transparent" aria-hidden />
        )}
        <div className="relative z-10 flex flex-col">
          <div className="mx-auto h-0.5 w-9 shrink-0 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.45)] max-md:h-px max-md:w-7 sm:w-10" />
          <div className="mt-0.5 flex min-w-0 items-center justify-center gap-0.5 text-center text-[7px] font-medium leading-tight text-white/90 max-md:leading-none sm:mt-1.5 sm:gap-1.5 sm:text-[9px] md:mt-2 md:text-[10px] lg:text-xs">
            <svg
              className="h-3 w-3 shrink-0 text-white/95 max-md:h-2.5 max-md:w-2.5 sm:h-3.5 sm:w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.75}
              aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-center">Non-custodial automation · Solana network</span>
          </div>
          <div
            className={
              embedInPanel
                ? "mt-2 grid grid-cols-2 gap-2 sm:mt-2.5 sm:gap-3"
                : "mt-1 grid grid-cols-2 gap-1 md:mt-3.5 md:flex md:flex-col md:gap-2.5"
            }
          >
            <HeroStatGlassCard
              embedInPanel={embedInPanel}
              tag="Volume"
              badge="Live"
              value="$0"
              sublabel="Total Trading Volume"
            />
            <HeroStatGlassCard
              embedInPanel={embedInPanel}
              tag="Reliability"
              badge="Real-time"
              value="99.9%"
              sublabel="Uptime"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function HeroStatGlassCard({ tag, badge, value, sublabel, embedInPanel = false }) {
  return (
    <div
      className={
        embedInPanel
          ? "relative overflow-hidden rounded-xl border border-white/25 bg-white/12 p-2 shadow-[0_8px_32px_rgba(0,0,0,0.22),inset_0_1px_0_rgba(255,255,255,0.22)] backdrop-blur-xl backdrop-saturate-150 sm:rounded-2xl sm:p-3 lg:rounded-3xl lg:p-4"
          : "relative overflow-hidden rounded-md border border-white/30 bg-white/[0.14] p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-md max-md:backdrop-blur-sm sm:rounded-xl sm:p-3 lg:rounded-2xl lg:p-4"
      }
    >
      <div
        className={
          embedInPanel
            ? "pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.22] via-white/[0.06] to-transparent"
            : "pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.08] to-transparent"
        }
      />
      <div className="relative flex items-start justify-between gap-0.5 max-md:gap-0.5 sm:gap-1.5">
        <span className="text-[10px] font-bold tracking-tight text-white sm:text-sm md:text-[15px]">{tag}</span>
        <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full border border-white/25 bg-black/25 px-1 py-px text-[7px] font-semibold uppercase tracking-wide text-white/85 sm:gap-1 sm:px-2 sm:py-0.5 sm:text-[10px]">
          <svg className="h-2.5 w-2.5 text-[#B4F1FF] sm:h-3 sm:w-3" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
            <rect x="1" y="10" width="3" height="5" rx="0.5" />
            <rect x="6" y="6" width="3" height="9" rx="0.5" />
            <rect x="11" y="2" width="3" height="13" rx="0.5" />
          </svg>
          {badge}
        </span>
      </div>
      <div className="relative mt-1 flex flex-wrap items-end justify-between gap-1 sm:mt-2 md:mt-3 sm:gap-2">
        <div className="min-w-0">
          <p className="bg-gradient-to-b from-white via-[#B4F1FF] to-[#7BD0F9] bg-clip-text text-xl font-bold tabular-nums leading-none tracking-tight text-transparent max-md:text-[1.15rem] sm:text-4xl md:text-[2.75rem] lg:text-5xl">
            {value}
          </p>
          <p className="mt-0.5 text-[9px] font-medium leading-tight text-white/60 max-md:line-clamp-2 sm:mt-1 sm:text-xs md:text-sm">
            {sublabel}
          </p>
        </div>
        <div className="hidden shrink-0 items-center gap-1 rounded-full border border-white/20 bg-black/30 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white sm:inline-flex">
          <svg className="h-3.5 w-3.5 text-[#7BD0F9]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          24/7
        </div>
      </div>
      <HeroStatBarDecoration />
    </div>
  )
}

function HeroStatBarDecoration() {
  const bars = [14, 22, 12, 26, 16, 24, 11, 28, 18, 20, 13, 25, 17, 21, 15, 23, 12, 27, 19, 14, 24, 16, 22, 18, 20, 13, 26, 15, 23, 17, 21, 19]
  return (
    <div className="relative mt-1 hidden h-5 origin-bottom scale-y-[0.72] items-end justify-between gap-px border-t border-white/10 pt-1 opacity-80 sm:mt-2 sm:h-8 sm:scale-y-100 sm:pt-2 md:flex md:h-9">
      {bars.map((h, i) => (
        <div
          key={i}
          className="min-w-[2px] flex-1 rounded-[1px] bg-gradient-to-t from-white/50 to-white"
          style={{ height: `${h}px` }}
        />
      ))}
    </div>
  )
}

function AiCodeEditDeployIllustration() {
  const panelStroke = "currentColor"
  const ink = "rgba(255,255,255,0.55)"
  const inkDim = "rgba(255,255,255,0.22)"
  return (
    <svg
      viewBox="0 0 260 130"
      className="h-auto w-full max-w-[260px] text-[#7BD0F9]"
      role="img"
      aria-label="AI generates code, you edit, then deploy live"
    >
      <defs>
        <linearGradient id="aiCodeLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#7BD0F9" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#7BD0F9" stopOpacity="0.55" />
        </linearGradient>
      </defs>

      {/* --- AI code --- */}
      <rect x="8" y="18" width="74" height="94" rx="6" fill="currentColor" fillOpacity="0.04" stroke={panelStroke} strokeWidth="0.6" strokeOpacity="0.12" />
      <text x="14" y="30" fontSize="5.5" fill="currentColor" fillOpacity="0.45" fontWeight="600">
        AI → Code
      </text>
      <rect x="52" y="22" width="22" height="10" rx="2" fill="#0094BC" fillOpacity="0.25" stroke="currentColor" strokeWidth="0.4" strokeOpacity="0.35" />
      <text x="63" y="29" fontSize="4.5" fill="currentColor" fillOpacity="0.9" textAnchor="middle" fontWeight="700">
        AI
      </text>
      <text x="14" y="44" fontSize="5" fill={inkDim} fontFamily="ui-monospace, monospace">
        strategy.ts
      </text>
      <rect x="14" y="50" width="44" height="3" rx="1" fill={inkDim} />
      <rect x="14" y="57" width="58" height="3" rx="1" fill={inkDim} />
      <rect x="14" y="64" width="36" height="3" rx="1" fill="url(#aiCodeLineGrad)" />
      <rect x="14" y="71" width="52" height="3" rx="1" fill={inkDim} />
      <circle cx="18" cy="86" r="2.5" fill="#4ade80" fillOpacity="0.9" />
      <text x="24" y="88" fontSize="5" fill="#4ade80" fillOpacity="0.85" fontWeight="600">
        generated
      </text>

      {/* arrow 1 */}
      <path d="M 86 64 L 98 64 M 94 60 L 98 64 L 94 68" fill="none" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.35" strokeLinecap="round" strokeLinejoin="round" />

      {/* --- Edit --- */}
      <rect x="102" y="18" width="74" height="94" rx="6" fill="currentColor" fillOpacity="0.04" stroke={panelStroke} strokeWidth="0.6" strokeOpacity="0.12" />
      <text x="108" y="30" fontSize="5.5" fill="currentColor" fillOpacity="0.45" fontWeight="600">
        Edit
      </text>
      <text x="108" y="44" fontSize="5" fill={inkDim} fontFamily="ui-monospace, monospace">
        strategy.ts
      </text>
      <rect x="108" y="50" width="48" height="3" rx="1" fill={inkDim} />
      <rect x="108" y="57" width="62" height="3" rx="1" fill={inkDim} />
      <rect x="108" y="64" width="54" height="10" rx="2" fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.35" />
      <rect x="112" y="67" width="38" height="3" rx="1" fill="currentColor" fillOpacity="0.5" />
      <rect x="152" y="65" width="1.2" height="8" fill="#B4F1FF" className="animate-pulse" />
      <text x="108" y="88" fontSize="5" fill={ink} fillOpacity="0.5">
        tweak params · logic
      </text>

      {/* arrow 2 */}
      <path d="M 180 64 L 192 64 M 188 60 L 192 64 L 188 68" fill="none" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.35" strokeLinecap="round" strokeLinejoin="round" />

      {/* --- Deploy --- */}
      <rect x="196" y="18" width="58" height="94" rx="6" fill="currentColor" fillOpacity="0.04" stroke={panelStroke} strokeWidth="0.6" strokeOpacity="0.12" />
      <text x="202" y="30" fontSize="5.5" fill="currentColor" fillOpacity="0.45" fontWeight="600">
        Deploy
      </text>
      <rect x="204" y="40" width="42" height="22" rx="4" fill="#4ade80" fillOpacity="0.08" stroke="#4ade80" strokeWidth="0.6" strokeOpacity="0.55" />
      <path
        d="M 225 45 L 225 52 M 222 48 L 225 45 L 228 48"
        fill="none"
        stroke="#4ade80"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeOpacity="0.95"
      />
      <text
        x="225"
        y="58"
        fontSize="6"
        fill="#4ade80"
        fontWeight="700"
        fontFamily="ui-monospace, monospace"
        textAnchor="middle"
      >
        RUN
      </text>
      <circle cx="218" cy="78" r="2.5" fill="#4ade80" />
      <text x="224" y="80" fontSize="5" fill="#4ade80" fillOpacity="0.9" fontWeight="600">
        live
      </text>
      <text x="225" y="98" fontSize="4.8" fill={ink} fillOpacity="0.35" textAnchor="middle">
        one click
      </text>
    </svg>
  )
}

function MonitorIllustration() {
  return (
    <svg width="160" height="140" viewBox="0 0 160 140" className="text-[#7BD0F9]">
      <defs>
        <linearGradient id="monitorFillStatic" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#4ade80" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#4ade80" stopOpacity="0.01" />
        </linearGradient>
      </defs>
      <circle cx="28" cy="12" r="3" fill="#4ade80" />
      <text x="36" y="15" fontSize="7" fill="#4ade80" fontWeight="600">LIVE</text>
      {[24, 43, 62, 82].map((y) => (
        <line key={y} x1="20" y1={y} x2="140" y2={y} stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.1" />
      ))}
      <path d="M 20,72 L 35,62 L 48,67 L 60,52 L 72,58 L 85,46 L 98,42 L 110,50 L 122,38 L 135,42 L 140,34 L 140,82 L 20,82 Z" fill="url(#monitorFillStatic)" />
      <path d="M 20,72 L 35,62 L 48,67 L 60,52 L 72,58 L 85,46 L 98,42 L 110,50 L 122,38 L 135,42 L 140,34" fill="none" stroke="#6ee7b7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="20" y="92" width="120" height="40" rx="5" fill="currentColor" fillOpacity="0.04" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.08" />
      <line x1="60" y1="97" x2="60" y2="127" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.08" />
      <line x1="100" y1="97" x2="100" y2="127" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.08" />
      <text x="40" y="106" fontSize="5.5" fill="currentColor" fillOpacity="0.35" textAnchor="middle">P&L</text>
      <text x="40" y="120" fontSize="8.5" fill="#4ade80" textAnchor="middle" fontWeight="700">+$42.8</text>
      <text x="80" y="106" fontSize="5.5" fill="currentColor" fillOpacity="0.35" textAnchor="middle">Trades</text>
      <text x="80" y="120" fontSize="8.5" fill="white" textAnchor="middle" fontWeight="700">24</text>
      <text x="120" y="106" fontSize="5.5" fill="currentColor" fillOpacity="0.35" textAnchor="middle">Win %</text>
      <text x="120" y="120" fontSize="8.5" fill="#4ade80" textAnchor="middle" fontWeight="700">78%</text>
    </svg>
  )
}

function FooterColumn({ label, links }) {
  return (
    <div>
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-white/50">{label}</h3>
      <ul className="space-y-2.5">
        {links.map((link) => (
          <li key={link.title}>
            {String(link.href).startsWith("/") ? (
              <Link to={link.href} className="text-sm text-white/30 hover:text-[#7BD0F9]">
                {link.title}
              </Link>
            ) : (
              <a href={link.href} className="text-sm text-white/30 hover:text-[#7BD0F9]">
                {link.title}
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
