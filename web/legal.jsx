import { Link } from "react-router-dom"
import { Icon, ICONS } from "./icons"

export function LegalPage({ type }) {
  const page = {
    terms: {
      title: "Terms of Service",
      intro:
        "These terms govern your use of Valgrid. By using the platform, you agree to operate within these rules and applicable laws.",
      sections: [
        {
          heading: "1. Platform scope",
          paragraphs: [
            "Valgrid provides tooling for AI-assisted strategy creation, code editing, and runtime controls. We provide software infrastructure, not financial advice.",
            "You remain fully responsible for strategy logic, trade decisions, and any execution outcomes from your account activity.",
          ],
        },
        {
          heading: "2. Account and access",
          paragraphs: [
            "You are responsible for maintaining control of connected authentication methods and session access.",
            "You must not share access in ways that compromise account integrity or violate security expectations.",
          ],
        },
        {
          heading: "3. Acceptable use",
          bullets: [
            "Do not upload malicious code, exploit infrastructure, or attempt unauthorized system access.",
            "Do not use Valgrid for fraud, market abuse, sanctions violations, or other unlawful conduct.",
            "Do not misuse automation features in a way that degrades service reliability for other users.",
          ],
        },
        {
          heading: "4. Risk and performance",
          paragraphs: [
            "Trading involves risk. Strategy outputs, AI suggestions, and execution results are not guaranteed.",
            "You must independently test and validate strategy behavior before running with meaningful capital.",
          ],
        },
        {
          heading: "5. Service availability",
          paragraphs: [
            "We may update features, enforce usage limits, or perform maintenance to protect platform health.",
            "Valgrid is provided as-is and as-available, without warranties of uninterrupted uptime or fitness for a specific purpose.",
          ],
        },
        {
          heading: "6. Termination",
          paragraphs: [
            "We may suspend or terminate access for abuse, policy violations, or legal requirements.",
            "You may stop using the service at any time.",
          ],
        },
      ],
    },
    privacy: {
      title: "Privacy Policy",
      intro:
        "This policy explains what data Valgrid handles and how it is used to provide core product functionality.",
      sections: [
        {
          heading: "1. Data we process",
          bullets: [
            "Account and authentication metadata required for sign-in and session management.",
            "Wallet identifiers and strategy-related records needed to operate workspace features.",
            "Strategy code, AI chat context, runtime metadata, and product telemetry needed for execution workflows.",
          ],
        },
        {
          heading: "2. How we use data",
          paragraphs: [
            "We use data to operate strategy creation flows, power AI-assisted edits, run execution controls, and improve reliability.",
            "We also use operational logs and usage signals to monitor performance, diagnose issues, and prevent abuse.",
          ],
        },
        {
          heading: "3. Cookies and sessions",
          paragraphs: [
            "Valgrid uses authentication cookies and related session mechanisms to keep you signed in and protect account access.",
            "Disabling required session features may limit platform functionality.",
          ],
        },
        {
          heading: "4. User responsibilities",
          bullets: [
            "Do not place private keys, seed phrases, or highly sensitive personal data in prompts, strategy code, or notes.",
            "Only connect wallets and services you are authorized to use.",
          ],
        },
        {
          heading: "5. Security and retention",
          paragraphs: [
            "We apply reasonable safeguards to protect platform data and service integrity.",
            "Retention periods may vary based on legal, security, and operational requirements.",
          ],
        },
        {
          heading: "6. Policy updates",
          paragraphs: [
            "We may update this policy as the product evolves. Continued use after updates means you accept the revised policy.",
          ],
        },
      ],
    },
  }[type]

  return (
    <main className="min-h-screen bg-[#06050c] px-5 py-8 text-white sm:px-6 sm:py-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-full border border-white/[0.12] bg-[#06050c] px-4 py-2 text-sm font-medium text-white/80 transition-colors hover:border-[#7BD0F9]/35 hover:bg-[#0f0d17] hover:text-white"
        >
          <span className="inline-flex rotate-180 text-white/70">
            <Icon d={ICONS.arrowRight} size={13} />
          </span>
          Back to Valgrid
        </Link>

        <article className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0a0a0e]/90 shadow-[0_20px_60px_rgb(0_0_0_/_0.35)]">
          <header className="border-b border-white/[0.08] px-5 py-5 sm:px-7 sm:py-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
              Legal
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              {page.title}
            </h1>
            <p className="mt-3 max-w-[72ch] text-sm leading-7 text-white/55 sm:text-base">
              {page.intro}
            </p>
          </header>

          <div className="space-y-0 divide-y divide-white/[0.06] px-5 sm:px-7">
            {page.sections.map((section) => (
              <section key={section.heading} className="py-6 sm:py-7">
                <h2 className="text-xl font-semibold tracking-tight text-white">
                  {section.heading}
                </h2>

                {section.paragraphs
                  ? section.paragraphs.map((paragraph) => (
                      <p key={paragraph} className="mt-4 text-sm leading-7 text-white/55 sm:text-base">
                        {paragraph}
                      </p>
                    ))
                  : null}

                {section.bullets ? (
                  <ul className="mt-4 space-y-3">
                    {section.bullets.map((bullet) => (
                      <li key={bullet} className="flex items-start gap-3 text-sm leading-7 text-white/55 sm:text-base">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#7BD0F9]" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}
          </div>
        </article>
      </div>
    </main>
  )
}
