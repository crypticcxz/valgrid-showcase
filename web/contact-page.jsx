import { useState } from "react"
import { Link } from "react-router-dom"
import logoImg from "./public/logo.png"

/** Mail recipient for the contact form (mailto until API exists) */
const CONTACT_EMAIL = "contact@valgrid.co"

const pillNavClass =
  "shrink-0 rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-[#06050c] shadow-md ring-1 ring-black/5 transition hover:bg-neutral-100 sm:text-xs"

export function ContactPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [notice, setNotice] = useState(null)

  function handleSubmit(e) {
    e.preventDefault()
    const trimmedMsg = message.trim()
    if (!trimmedMsg || !email.trim()) return
    const body = [
      name.trim() ? `Name: ${name.trim()}` : null,
      `Email: ${email.trim()}`,
      "",
      trimmedMsg,
    ]
      .filter(Boolean)
      .join("\n")
    const q = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject.trim() || "ValGrid contact")}&body=${encodeURIComponent(body)}`
    window.location.href = q
    setNotice("Opening your email app — send the message to reach us.")
    setMessage("")
  }

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#06050c] font-['Montserrat',system-ui,sans-serif] antialiased text-white">
      <header className="sticky top-0 z-20 border-b border-white/[0.08] bg-[#06050c]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="inline-flex items-center gap-2 text-[1.25rem] font-medium tracking-[0.02em] text-white sm:text-[1.5rem]">
            <img src={logoImg} alt="" width={36} height={36} className="h-9 w-9 shrink-0 object-contain" decoding="async" />
            <span className="leading-none">
              <span className="text-[#7BD0F9]">Val</span>Grid
            </span>
          </Link>
          <nav className="flex flex-wrap items-center justify-end gap-2 sm:gap-2.5">
            <Link to="/#features" className={pillNavClass}>
              Why Valgrid?
            </Link>
            <Link to="/#pricing" className={pillNavClass}>
              Pricing
            </Link>
            <Link to="/#faq" className={pillNavClass}>
              Docs
            </Link>
            <Link
              to="/strategies"
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#06050c] py-1.5 pl-3 pr-2.5 text-[11px] font-semibold uppercase tracking-wide text-white shadow-lg ring-1 ring-white/10 transition hover:bg-[#1a1a1e] sm:py-2 sm:pl-4 sm:pr-3 sm:text-xs"
            >
              Start
            </Link>
          </nav>
        </div>
      </header>

      <div className="pointer-events-none absolute inset-x-0 top-[52px] h-[420px] bg-[radial-gradient(ellipse_at_50%_0%,rgb(123_208_249_/_0.09),transparent_58%)] sm:top-16" />

      <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-12 sm:px-6 sm:pb-24 sm:pt-16 lg:px-8 lg:pb-28">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="bg-gradient-to-b from-white via-[#B4F1FF] to-[#7BD0F9] bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl">
            Contact us
          </h1>
          <p className="mt-4 text-base leading-relaxed text-white/55 sm:text-lg">
            Questions about ValGrid, partnerships, or press? Send a message — we read every note.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,280px)] lg:gap-12 lg:items-start">
          <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0d0b14] p-6 shadow-[0_28px_90px_rgba(0,0,0,0.35)] sm:p-8 lg:p-10">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_40%_0%,rgb(123_208_249_/_0.08),transparent_55%)]" />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(160deg,rgba(255,255,255,0.05)_0%,transparent_45%)]" />
            <form onSubmit={handleSubmit} className="relative z-10 space-y-5">
              <div>
                <label htmlFor="contact-name" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/45">
                  Name
                </label>
                <input
                  id="contact-name"
                  type="text"
                  name="name"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full rounded-xl border border-white/[0.1] bg-[#06050c] px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-[#7BD0F9]/40 focus:shadow-[0_0_20px_rgb(123_208_249_/_0.12)]"
                />
              </div>
              <div>
                <label htmlFor="contact-email" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/45">
                  Email <span className="text-[#7BD0F9]">*</span>
                </label>
                <input
                  id="contact-email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-white/[0.1] bg-[#06050c] px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-[#7BD0F9]/40 focus:shadow-[0_0_20px_rgb(123_208_249_/_0.12)]"
                />
              </div>
              <div>
                <label htmlFor="contact-subject" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/45">
                  Subject
                </label>
                <input
                  id="contact-subject"
                  type="text"
                  name="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="How can we help?"
                  className="w-full rounded-xl border border-white/[0.1] bg-[#06050c] px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-[#7BD0F9]/40 focus:shadow-[0_0_20px_rgb(123_208_249_/_0.12)]"
                />
              </div>
              <div>
                <label htmlFor="contact-message" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/45">
                  Message <span className="text-[#7BD0F9]">*</span>
                </label>
                <textarea
                  id="contact-message"
                  name="message"
                  required
                  rows={6}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us what you need..."
                  className="min-h-[140px] w-full resize-y rounded-xl border border-white/[0.1] bg-[#06050c] px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-[#7BD0F9]/40 focus:shadow-[0_0_20px_rgb(123_208_249_/_0.12)]"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-full bg-[#0094BC] py-3 text-sm font-semibold text-white shadow-[0_0_30px_rgb(0_148_188_/_0.25)] transition hover:bg-[#00aad8] hover:shadow-[0_0_40px_rgb(123_208_249_/_0.35)] sm:w-auto sm:px-12"
              >
                Send message
              </button>
              {notice && <p className="text-center text-sm text-[#7BD0F9]/90">{notice}</p>}
              <p className="text-center text-xs text-white/30">
                By submitting, you agree we may reply using the email you provide. See our{" "}
                <Link to="/privacy" className="text-[#7BD0F9]/80 underline-offset-2 hover:underline">
                  Privacy Policy
                </Link>
                .
              </p>
            </form>
          </div>

          <aside className="space-y-8 rounded-3xl border border-white/[0.06] bg-[#0d0b14]/80 p-6 backdrop-blur-sm sm:p-8">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-white/45">Email</h2>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="mt-2 inline-block text-lg font-medium text-[#7BD0F9] transition hover:text-[#B4F1FF]"
              >
                {CONTACT_EMAIL}
              </a>
            </div>
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-white/45">Response time</h2>
              <p className="mt-2 text-sm leading-relaxed text-white/50">
                We typically reply within a few business days. For account-specific issues, sign in and use in-app support when available.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}
