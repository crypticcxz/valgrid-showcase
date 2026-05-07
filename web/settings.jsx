import { useCallback, useState } from "react"
import { useLiveQuery } from "@tanstack/react-db"
import { archived, updateFields } from "./collections"
import { useToast } from "./toast"
import { GoogleButton } from "./google-button"
import { shortDate } from "./misc"

const inputClass =
  "min-w-0 w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-sm text-white outline-none ring-0 placeholder:text-white/35 motion-safe:transition motion-safe:duration-200 focus:border-teal-500/35 focus:shadow-[0_0_0_1px_rgb(20_184_166_/_0.15)]"

const subtleBtnClass =
  "inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#0094BC] px-6 text-sm font-semibold text-white shadow-[0_0_30px_rgb(0_148_188_/_0.25)] motion-safe:transition motion-safe:duration-300 hover:bg-[#00aad8] hover:shadow-[0_0_40px_rgb(123_208_249_/_0.35)]"

export function Settings({
  me,
  google,
  account: accountCollection,
  envVars,
}) {
  const toast = useToast()
  const { data: envData = [] } = useLiveQuery(envVars)
  const envRows = [...envData].sort((a, b) => a.name.localeCompare(b.name))
  const [envName, setEnvName] = useState("")
  const [envValue, setEnvValue] = useState("")
  const [reveal, setReveal] = useState({})

  const credential = useCallback(
    async (response) => {
      try {
        accountCollection.update(me.id, (draft) => {
          draft.id_token = response.credential
        })
        toast("Google connected.", { variant: "success" })
      } catch (e) {
        toast(e?.message, { variant: "error" })
      }
    },
    [accountCollection, me.id, toast],
  )

  const saveEnv = (event) => {
    event.preventDefault()
    const name = envName.trim().toUpperCase()
    if (!name) return
    try {
      envVars.insert({
        id: crypto.randomUUID(),
        account_id: me.id,
        name,
        secret_value: envValue,
      })
      setEnvName("")
      setEnvValue("")
      toast("Saved securely.", { variant: "success" })
    } catch (e) {
      toast(e?.message || "Secret save failed", { variant: "error" })
    }
  }

  const replaceEnv = (envVar, value) => {
    if (typeof value !== "string" || value.length === 0) return
    updateFields(envVars, envVar.id, { secret_value: value })
    setReveal((current) => ({ ...current, [envVar.id]: "" }))
    toast("Replacement saved.", { variant: "success" })
  }

  const archiveEnv = (envVar) => {
    archived(envVars, envVar.id, true)
    toast("Removed from this account.", { variant: "success" })
  }

  return (
    <div className="mx-auto max-w-3xl space-y-10 pb-8">
      <header className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/45">
          Settings
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Account Settings
        </h1>
        <p className="text-sm leading-relaxed text-white/50 sm:text-base">
          Profile, sign-in, and secrets that power your strategies.
        </p>
      </header>

      <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0a0a0e]/90 shadow-[0_24px_80px_rgb(0_0_0_/_0.45)] backdrop-blur-sm divide-y divide-white/[0.06]">
        <SettingsSection icon={IconMail} title="Account information">
          <div className="space-y-0">
            <InfoRow
              label="Tier"
              value={
                <span className="inline-flex items-center rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-teal-200/95 capitalize">
                  {me.tier}
                </span>
              }
            />
            {me.created_at && (
              <InfoRow
                label="Member since"
                value={
                  <span className="text-white tabular-nums">
                    {shortDate(me.created_at)}
                  </span>
                }
              />
            )}
            <InfoRow
              label="Account ID"
              value={
                <code className="rounded-lg border border-white/[0.08] bg-black/40 px-2.5 py-1 font-mono text-[11px] text-white/90">
                  {me.id}
                </code>
              }
            />
          </div>
        </SettingsSection>

        <SettingsSection icon={IconShield} title="Login methods">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
            <div className="min-w-0 space-y-1.5">
              <p className="text-base font-semibold text-white">Google</p>
              <p className="max-w-[52ch] text-sm leading-relaxed text-white/45">
                {me.google_sub
                  ? "Signed in with Google for this workspace."
                  : "Link Google to recover access and sync identity."}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-stretch gap-3 sm:items-end">
              <span
                className={
                  me.google_sub
                    ? "inline-flex w-fit rounded-full border border-teal-500/35 bg-teal-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-teal-200/90"
                    : "inline-flex w-fit rounded-full border border-white/[0.10] bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white/55"
                }
              >
                {me.google_sub ? "Linked" : "Not linked"}
              </span>
              {google?.client ? (
                <div className="rounded-full border border-teal-500/40 bg-teal-500/[0.06] p-1 shadow-[0_0_24px_rgb(20_184_166_/_0.08)]">
                  <GoogleButton
                    client={google?.client}
                    onCredential={credential}
                    size="medium"
                    text={me.google_sub ? "continue_with" : "signup_with"}
                    width={240}
                  />
                </div>
              ) : null}
            </div>
          </div>
        </SettingsSection>

        <SettingsSection icon={IconLock} title="Secret environment variables">
          <p className="mb-6 max-w-[65ch] text-sm leading-relaxed text-white/45">
            Stored encrypted per account. Keys must be uppercase. Replacing a
            value updates the stored secret for future runs.
          </p>
          <form
            onSubmit={saveEnv}
            className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end sm:gap-x-4"
          >
            <Field label="Variable name" hint="Uppercase identifier">
              <input
                value={envName}
                onChange={(event) => setEnvName(event.target.value)}
                placeholder="OPENAI_API_KEY"
                className={`${inputClass} font-mono`}
              />
            </Field>
            <Field label="Secret value" hint="Stored encrypted">
              <input
                value={envValue}
                onChange={(event) => setEnvValue(event.target.value)}
                type="password"
                placeholder="Secret value"
                className={inputClass}
              />
            </Field>
            <div className="flex items-end">
              <button type="submit" className={`${subtleBtnClass} w-full sm:w-auto`}>
                <IconSave className="h-4 w-4 text-white/80" aria-hidden />
                Add secret
              </button>
            </div>
          </form>

          {envRows.length === 0 ? (
            <SecretsEmptyState />
          ) : (
            <ul className="mt-8 space-y-0 divide-y divide-white/[0.06] rounded-xl border border-white/[0.06] bg-black/25">
              {envRows.map((envVar) => (
                <li
                  key={envVar.id}
                  className="motion-safe:transition-colors motion-safe:duration-200 grid grid-cols-1 gap-4 p-4 hover:bg-white/[0.02] sm:grid-cols-[minmax(0,1fr)_minmax(11rem,13rem)_auto] sm:items-center sm:gap-x-4 md:p-5"
                >
                  <div className="min-w-0">
                    <p className="truncate font-mono text-sm font-medium tracking-tight text-white">
                      {envVar.name}
                    </p>
                    <p className="mt-1 text-[11px] font-medium uppercase tracking-wider text-white/35">
                      Updated {shortDate(envVar.updated_at)}
                    </p>
                  </div>
                  <input
                    value={reveal[envVar.id] ?? ""}
                    onChange={(event) =>
                      setReveal((current) => ({
                        ...current,
                        [envVar.id]: event.target.value,
                      }))
                    }
                    type="password"
                    placeholder="New value"
                    className={inputClass}
                  />
                  <div className="flex shrink-0 flex-wrap gap-2 md:flex-nowrap md:justify-self-end">
                    <button
                      type="button"
                      onClick={() => replaceEnv(envVar, reveal[envVar.id])}
                      className="inline-flex h-9 items-center justify-center rounded-full bg-[#0094BC] px-4 text-xs font-semibold text-white shadow-[0_0_24px_rgb(0_148_188_/_0.22)] motion-safe:transition motion-safe:duration-300 hover:bg-[#00aad8] hover:shadow-[0_0_32px_rgb(123_208_249_/_0.32)]"
                    >
                      Replace
                    </button>
                    <button
                      type="button"
                      onClick={() => archiveEnv(envVar)}
                      className="inline-flex h-9 items-center justify-center rounded-full border border-white/[0.12] bg-[#06050c] px-4 text-xs font-semibold text-white/85 motion-safe:transition motion-safe:duration-200 hover:border-[#7BD0F9]/35 hover:bg-[#0f0d17]"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SettingsSection>
      </div>
    </div>
  )
}

function SettingsSection({ icon: Icon, title, children }) {
  return (
    <section className="px-5 py-8 sm:px-10">
      <div className="mb-6 flex items-center gap-3">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-white/65"
          aria-hidden
        >
          <Icon className="h-5 w-5" strokeWidth={1.5} />
        </span>
        <h2 className="text-lg font-semibold tracking-tight text-white">
          {title}
        </h2>
      </div>
      {children}
    </section>
  )
}

function InfoRow({ label, value }) {
  return (
    <div className="flex flex-col gap-1 border-t border-white/[0.06] py-4 first:border-t-0 first:pt-0 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:py-5">
      <span className="text-sm font-medium text-white/45">{label}</span>
      <div className="text-sm font-medium text-white sm:text-right">{value}</div>
    </div>
  )
}

function Field({ label, hint, children }) {
  return (
    <div className="space-y-2">
      <div>
        <label className="text-sm font-semibold text-white">{label}</label>
        {hint ? (
          <p className="mt-0.5 text-xs text-white/40">{hint}</p>
        ) : null}
      </div>
      {children}
    </div>
  )
}

function SecretsEmptyState() {
  return (
    <div
      className="motion-safe:animate-in motion-safe:fade-in motion-safe:duration-500 mt-8 rounded-xl border border-dashed border-white/[0.08] bg-white/[0.02] px-4 py-14 text-center motion-reduce:animate-none sm:px-6"
      role="status"
      aria-live="polite"
    >
      <div
        className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.03]"
        aria-hidden
      >
        <IconLock className="h-7 w-7 text-teal-400/80" strokeWidth={1.25} />
      </div>
      <p className="text-base font-semibold text-white">Vault is ready</p>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-white/45">
        Add keys your strategies need to reach brokers, models, and webhooks.
        Everything here stays encrypted for this account.
      </p>
    </div>
  )
}

function IconMail(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
      />
    </svg>
  )
}

function IconShield(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
      />
    </svg>
  )
}

function IconLock(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
      />
    </svg>
  )
}

function IconSave(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-8H7v8" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 3v5h8" />
    </svg>
  )
}
