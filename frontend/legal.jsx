import { Link } from "react-router-dom"

export function LegalPage({ type }) {
  const page = {
    terms: {
      title: "Terms",
      body: [
        "Valgrid is provided for strategy development and testing. You are responsible for reviewing strategy code and understanding the risks before running it.",
        "Do not use the service to submit malicious code, abuse infrastructure, or violate applicable laws.",
        "The service is provided as-is without guarantees of trading performance, availability, or fitness for a particular purpose.",
      ],
    },
    privacy: {
      title: "Privacy Policy",
      body: [
        "Valgrid stores account, wallet, strategy, message, and runtime activity data needed to provide the product.",
        "Authentication cookies are used to keep you signed in. Connected wallet addresses may be associated with your account.",
        "Do not store wallet private keys or regulated personal data in strategy code or chat messages.",
      ],
    },
  }[type]

  return (
    <main className="min-h-screen bg-[#03111f] px-6 py-10 text-white">
      <div className="mx-auto max-w-2xl space-y-6">
        <Link
          to="/strategies"
          className="text-sm text-sky-400 hover:text-sky-300"
        >
          Valgrid
        </Link>
        <div className="space-y-3">
          <h1 className="text-3xl font-bold">{page.title}</h1>
          {page.body.map((paragraph) => (
            <p key={paragraph} className="text-sm leading-6 text-white/60">
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </main>
  )
}
