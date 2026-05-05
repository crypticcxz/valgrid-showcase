import { useCallback, useEffect, useRef, useState } from "react"
import { Link, NavLink, useLocation } from "react-router-dom"
import logoImg from "./public/logo.png"
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

const heroStripItems = [
  {
    icon: "shield",
    text: "Non-custodial by design—your keys and strategies stay under your control.",
  },
  {
    icon: "zap",
    text: "Go from prompt to live bot fast with AI-generated code you can edit anytime.",
  },
  {
    icon: "clipboard",
    text: "Build, deploy, and monitor in one workspace—no duct-taped toolchain.",
  },
  {
    icon: "award",
    text: "Monitoring and safeguards so your automation runs with confidence.",
  },
  {
    icon: "globe",
    text: "Connect venues and markets without juggling tabs or separate tools.",
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
      <section className="relative flex min-h-[100svh] flex-col overflow-x-clip rounded-b-[2rem] bg-[radial-gradient(circle_at_50%_65%,#B4F1FF_45%,#7BD0F9_54%,#0094BC_70%,#06050c_85%)] max-md:h-[100svh] max-md:max-h-[100svh] max-md:min-h-0 max-md:overflow-hidden md:h-[100svh] md:max-h-[100svh] md:overflow-hidden lg:rounded-b-[2.2rem] lg:bg-[radial-gradient(circle_at_50%_135%,#B4F1FF_45%,#7BD0F9_55%,#0094BC_68%,#06050c_91%)]">
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-b-[2rem] lg:rounded-b-[2.2rem]">
          <div className="absolute inset-0 bg-[linear-gradient(105deg,transparent_0%,rgba(255,255,255,0.16)_40%,rgba(255,255,255,0.05)_50%,transparent_62%)] opacity-[0.55]" />
          <div className="absolute -left-[20%] top-0 h-full w-[55%] bg-[linear-gradient(95deg,rgba(255,255,255,0.22),transparent_65%)] opacity-40 blur-2xl" />
          <div
            className="absolute inset-0 opacity-[0.28]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(90deg, transparent, transparent 68px, rgba(255,255,255,0.09) 68px, rgba(255,255,255,0.09) 69px)",
            }}
          />
        </div>

        <nav className="relative z-30 shrink-0 px-3 py-2 max-md:py-1.5 sm:px-5 sm:py-2.5 lg:px-12 lg:py-3">
          <div className="relative mx-auto flex max-w-7xl items-center justify-between gap-4">
            <Link
              to="/"
              className="relative z-10 flex shrink-0 items-center gap-2"
              onClick={() => setMobileNavOpen(false)}
            >
              <img src={logoImg} alt="Valgrid" className="h-8 w-8 drop-shadow-sm" />
              <span className="text-lg font-semibold tracking-tight text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.25)] sm:text-xl">
                ValGrid
              </span>
            </Link>

            <div className="absolute left-1/2 top-1/2 z-0 hidden -translate-x-1/2 -translate-y-1/2 lg:block">
              <div className="flex w-max max-w-[min(100%,520px)] items-center gap-0.5 rounded-full border border-white/50 bg-white/35 px-1 py-1 shadow-[0_8px_40px_rgba(0,100,130,0.12)] backdrop-blur-xl">
                <NavLink
                  to="/"
                  end
                  className={({ isActive }) =>
                    "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors " +
                    (isActive
                      ? "bg-white/55 text-[#06050c] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]"
                      : "text-[#06050c]/75 hover:bg-white/30 hover:text-[#06050c]")
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span
                        className={
                          "h-1.5 w-1.5 shrink-0 rounded-full " +
                          (isActive ? "bg-[#0094BC] shadow-[0_0_8px_rgb(0_148_188_/_0.7)]" : "bg-transparent")
                        }
                        aria-hidden
                      />
                      Home
                    </>
                  )}
                </NavLink>
                <GlassNavAnchor href="#features" onNavigate={() => setMobileNavOpen(false)}>
                  Why Valgrid?
                </GlassNavAnchor>
                <GlassNavAnchor href="#pricing" onNavigate={() => setMobileNavOpen(false)}>
                  Pricing
                </GlassNavAnchor>
                <GlassNavAnchor href="#faq" onNavigate={() => setMobileNavOpen(false)}>
                  Docs
                </GlassNavAnchor>
                <GlassNavAnchor href="#footer" onNavigate={() => setMobileNavOpen(false)}>
                  Contact
                </GlassNavAnchor>
              </div>
            </div>

            <div className="relative z-10 flex w-[5.5rem] shrink-0 justify-end sm:w-24 lg:w-28">
              <button
                type="button"
                className="flex h-10 flex-col items-center justify-center gap-1 rounded-full border border-white/50 bg-white/30 px-3.5 shadow-[0_4px_24px_rgba(0,100,130,0.1)] backdrop-blur-xl transition hover:bg-white/45 lg:hidden"
                aria-expanded={mobileNavOpen}
                aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
                onClick={() => setMobileNavOpen((open) => !open)}
              >
                <span className="h-0.5 w-5 rounded-full bg-[#06050c]/85" />
                <span className="h-0.5 w-5 rounded-full bg-[#06050c]/85" />
              </button>
            </div>
          </div>

          {mobileNavOpen && (
            <div className="mx-auto mt-4 max-w-7xl rounded-2xl border border-white/50 bg-white/40 p-3 shadow-[0_16px_48px_rgba(0,100,130,0.15)] backdrop-blur-xl lg:hidden">
              <div className="flex flex-col gap-1">
                <NavLink
                  to="/"
                  end
                  onClick={() => setMobileNavOpen(false)}
                  className={({ isActive }) =>
                    "flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium " +
                    (isActive ? "bg-white/60 text-[#06050c]" : "text-[#06050c]/85 hover:bg-white/35")
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
                  Contact Us
                </GlassNavAnchorMobile>
                <Link
                  to="/strategies"
                  className="mt-1 rounded-xl bg-[#0094BC]/15 px-4 py-3 text-center text-sm font-semibold text-[#06050c] hover:bg-[#0094BC]/25"
                  onClick={() => setMobileNavOpen(false)}
                >
                  Sign In
                </Link>
              </div>
            </div>
          )}
        </nav>

        <div className="relative z-10 flex min-h-0 w-full flex-1 flex-col justify-start px-3 py-0.5 max-md:min-h-0 max-md:flex-1 max-md:overflow-hidden max-md:py-1 sm:px-5 sm:py-2 md:justify-center md:overflow-hidden md:py-2 lg:px-12 lg:py-3">
          <div className="relative z-10 mx-auto w-full min-h-0 min-w-0 max-w-7xl py-0 sm:py-0.5 lg:py-1">
            <div className="grid grid-cols-1 items-center gap-1.5 max-md:gap-2 sm:gap-4 md:gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(240px,min(100%,380px))] lg:gap-5 xl:gap-8">
              <div className="mx-auto w-full min-w-0 max-w-2xl text-center lg:mx-0 lg:max-w-[min(36rem,100%)] lg:text-left">
                <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-[#06050c]/45 sm:text-[11px]">
                  ValGrid
                </p>
                <h1 className="mt-1 text-[clamp(1.35rem,4vw+0.2rem,3.35rem)] font-bold leading-[1.07] tracking-[-0.03em] text-[#06050c] max-md:mt-1 md:text-[clamp(1.65rem,2.8vw+0.5rem,3.5rem)] lg:mt-2 lg:text-5xl lg:leading-[1.02] xl:text-6xl">
                  Build Your Bot
                </h1>
                <p className="mx-auto mt-1.5 max-w-[26rem] text-[12px] font-normal leading-snug text-[#06050c]/65 max-md:mt-1.5 sm:mt-2.5 sm:text-[15px] sm:leading-relaxed lg:mx-0 lg:max-w-lg lg:text-base lg:leading-relaxed">
                  Build and deploy your automation bot with zero set up!
                </p>
                <div className="mt-2 flex justify-center max-md:mt-2 sm:mt-4 lg:justify-start lg:mt-5">
                  <Link
                    to="/strategies"
                    className="group inline-flex h-10 max-md:h-9 max-md:px-5 max-md:text-[13px] items-center gap-2 rounded-full bg-white px-6 text-sm font-semibold tracking-wide text-[#06050c] shadow-[0_12px_40px_rgba(6,5,12,0.12)] ring-1 ring-white/80 transition hover:bg-[#f8fcff] hover:shadow-[0_16px_48px_rgba(0,148,188,0.18)] sm:h-11 sm:px-7 lg:h-12 lg:px-8"
                  >
                    Get started
                    <svg
                      className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                      aria-hidden
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M17 7H8M17 7v9" />
                    </svg>
                  </Link>
                </div>
              </div>
              <HeroStatsGlassStack />
            </div>
          </div>
        </div>

        <div className="relative z-10 w-full shrink-0 px-3 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-0 max-md:pb-1 sm:px-5 sm:pb-3 sm:pt-1 lg:px-8 lg:pb-5">
          <div className="relative mx-auto w-full min-w-0 max-w-7xl">
            <div className="mb-1 flex w-full min-w-0 items-center max-md:mb-1 sm:mb-3 lg:mb-4" role="presentation">
              <span
                className="h-0.5 w-8 shrink-0 rounded-full bg-[#0094BC] shadow-[0_0_14px_rgba(0,148,188,0.45)] sm:w-11"
                aria-hidden
              />
              <span className="h-px min-w-0 flex-1 bg-gradient-to-r from-[#06050c]/22 via-[#06050c]/12 to-transparent" />
            </div>
            <div className="flex flex-col items-stretch gap-1.5 max-md:gap-1.5 sm:gap-3 md:flex-row md:items-center md:gap-2.5 lg:gap-4">
              <div className="order-2 hidden shrink-0 justify-center md:order-1 md:flex md:w-[clamp(118px,19vw,240px)]">
                <HeroCornerOrbitBox text="AI CODE • EDIT • DEPLOY • " />
              </div>
              <div className="order-1 min-h-[4.85rem] min-w-0 flex-1 max-md:min-h-[4.85rem] sm:min-h-[7.25rem] md:order-2 md:min-h-[7.75rem] lg:min-h-[8.5rem]">
                <HeroStripInteractiveDeck />
              </div>
              <div className="order-3 flex w-full shrink-0 justify-center pb-1 max-md:pb-1.5 md:w-[clamp(118px,19vw,240px)] md:pb-0">
                <HeroCornerOrbitBox text="AI CODE • EDIT • DEPLOY • " />
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

function HeroStripIcon({ name }) {
  const common = "h-6 w-6"
  switch (name) {
    case "shield":
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
      )
    case "zap":
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )
    case "clipboard":
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
          />
        </svg>
      )
    case "award":
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
          />
        </svg>
      )
    case "globe":
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      )
    default:
      return null
  }
}

function HeroCornerOrbitBox({ text }) {
  return (
    <div className="pointer-events-none flex shrink-0 justify-center">
      <HeroOrbitDisc text={text} />
    </div>
  )
}

function HeroStripInteractiveDeck() {
  const n = heroStripItems.length
  const [activeIndex, setActiveIndex] = useState(0)
  const zoneRef = useRef(null)

  const pickIndexFromX = useCallback(
    (clientX) => {
      const el = zoneRef.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const t = (clientX - r.left) / Math.max(r.width, 1)
      const x = Math.min(1, Math.max(0, t))
      const idx = Math.round(x * (n - 1))
      setActiveIndex(idx)
    },
    [n],
  )

  return (
    <div
      ref={zoneRef}
      className="relative flex h-full min-h-[4.65rem] cursor-ew-resize select-none flex-col overflow-hidden rounded-[1.1rem] border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] max-md:min-h-[4.65rem] max-md:rounded-[1rem] sm:min-h-[7rem] sm:rounded-[1.5rem] md:min-h-[7.5rem] md:rounded-[1.75rem] lg:min-h-[8rem]"
      onMouseMove={(e) => pickIndexFromX(e.clientX)}
      onTouchMove={(e) => {
        const t = e.touches[0]
        if (t) pickIndexFromX(t.clientX)
      }}
      role="region"
      aria-label="Product highlights"
    >
      {/* Blur only behind UI — text stays on its own layer (avoids fuzzy copy with backdrop-filter) */}
      <div
        className="pointer-events-none absolute inset-0 rounded-[inherit] bg-white/[0.22] backdrop-blur-xl"
        aria-hidden
      />
      <div className="relative z-10 flex min-h-0 flex-1 flex-col px-1.5 py-1.5 max-md:py-1 max-md:pb-1 sm:px-3 sm:py-3">
      <p className="pointer-events-none mb-0.5 text-center text-[7px] font-semibold uppercase tracking-[0.14em] text-[#06050c]/45 max-md:mb-0 sm:mb-1 sm:text-[9px] sm:tracking-[0.2em] md:text-[10px]">
        Hover · drag right to explore
      </p>
      <div className="relative min-h-[2.65rem] flex-1 overflow-hidden max-md:min-h-[2.65rem] sm:min-h-[5rem] md:min-h-[5.25rem] lg:min-h-[5.75rem]">
        <div
          className="flex [backface-visibility:hidden] transition-[transform] duration-700 ease-out motion-reduce:transition-none motion-reduce:duration-0"
          style={{
            width: `${n * 100}%`,
            transform: `translate3d(-${(activeIndex / n) * 100}%, 0, 0)`,
          }}
        >
          {heroStripItems.map((item, i) => (
            <div
              key={item.icon + String(i)}
              className="flex shrink-0 items-start gap-2 px-1 max-md:gap-1.5 sm:gap-4 sm:px-3"
              style={{ width: `${100 / n}%` }}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/55 bg-white/45 text-[#06050c] shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] max-md:h-7 max-md:w-7 max-md:rounded-md sm:h-10 sm:w-10 md:rounded-xl">
                <HeroStripIcon name={item.icon} />
              </div>
              <p className="min-w-0 flex-1 text-left text-[11px] font-medium leading-snug tracking-normal text-[#06050c]/88 antialiased [overflow-wrap:anywhere] sm:text-sm md:text-[15px] md:leading-snug">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </div>
      <div className="pointer-events-none mt-1 flex justify-center gap-0.5 max-md:mt-1 sm:mt-2.5 sm:gap-1">
        {heroStripItems.map((_, i) => (
          <span
            key={String(i)}
            className={
              "h-1.5 rounded-full transition-all duration-300 " +
              (i === activeIndex ? "w-6 bg-[#0094BC]" : "w-1.5 bg-[#06050c]/25")
            }
            aria-hidden
          />
        ))}
      </div>
      </div>
    </div>
  )
}

function GlassNavAnchor({ href, children, onNavigate }) {
  return (
    <a
      href={href}
      className="rounded-full px-3 py-2 text-sm font-medium text-[#06050c]/78 transition-colors hover:bg-white/35 hover:text-[#06050c] lg:px-4"
      onClick={onNavigate}
    >
      {children}
    </a>
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

function HeroStatsGlassStack() {
  return (
    <div className="mx-auto w-full min-w-0 max-w-[400px] shrink-0 lg:mx-0 lg:w-full lg:max-w-none">
      <div className="relative overflow-hidden rounded-[1.25rem] border border-[#7BD0F9]/35 bg-gradient-to-br from-[#0094BC] via-[#086f8a] to-[#062432] p-1.5 shadow-[0_20px_48px_rgba(0,80,110,0.42)] max-md:rounded-xl sm:rounded-[1.5rem] sm:p-3 md:p-3.5 lg:rounded-[1.75rem] lg:p-4">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_25%_0%,rgba(180,241,255,0.22),transparent_55%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(160deg,rgba(255,255,255,0.06)_0%,transparent_40%)]" />
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
          <div className="mt-1 grid grid-cols-2 gap-1 md:mt-3.5 md:flex md:flex-col md:gap-2.5">
            <HeroStatGlassCard
              tag="Volume"
              badge="Live"
              value="$0"
              sublabel="Total Trading Volume"
            />
            <HeroStatGlassCard
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

function HeroStatGlassCard({ tag, badge, value, sublabel }) {
  return (
    <div className="relative overflow-hidden rounded-md border border-white/30 bg-white/[0.14] p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-md max-md:backdrop-blur-sm sm:rounded-xl sm:p-3 lg:rounded-2xl lg:p-4">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.08] to-transparent" />
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

/** Orbit ring diameter by viewport width (readable text; avoid height-only caps that force tiny fonts). */
function heroOrbitDiameterForWidth(w) {
  if (w < 360) return 76
  if (w < 400) return 80
  if (w < 480) return 96
  if (w < 640) return 118
  if (w < 768) return 126
  if (w < 1024) return 138
  if (w < 1280) return 150
  return 168
}

function HeroOrbitDisc({ text }) {
  return <CircularText text={text} />
}

function CircularText({ text }) {
  const letters = Array.from(text)
  const n = letters.length
  const [d, setD] = useState(() =>
    typeof window !== "undefined" ? heroOrbitDiameterForWidth(window.innerWidth) : 168,
  )

  useEffect(() => {
    const onResize = () => setD(heroOrbitDiameterForWidth(window.innerWidth))
    onResize()
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  const radius = d * 0.345
  const fontPx = Math.max(10, Math.round(d * 0.098))
  const logoSize = Math.round(d * 0.26)

  return (
    <div
      className="relative mx-auto animate-[spin_20s_linear_infinite] motion-reduce:animate-none"
      style={{ width: d, height: d }}
      aria-hidden
    >
      {letters.map((letter, i) => {
        const angleDeg = (360 / n) * i - 90
        return (
          <span
            key={`${letter}-${i}`}
            className="absolute left-1/2 top-1/2 block h-0 w-0"
            style={{ transform: `rotate(${angleDeg}deg) translateY(-${radius}px) translateZ(0)` }}
          >
            <span
              className="block -translate-x-1/2 font-black uppercase leading-none tracking-[0.02em] antialiased text-[#034859]"
              style={{
                fontSize: fontPx,
                textShadow: "0 1px 3px rgba(180, 241, 255, 0.75)",
              }}
            >
              {letter}
            </span>
          </span>
        )
      })}
      <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
        <img
          src={logoImg}
          alt=""
          width={logoSize}
          height={logoSize}
          className="block object-contain drop-shadow-[0_2px_10px_rgba(0,0,0,0.25)]"
          draggable={false}
        />
      </div>
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
