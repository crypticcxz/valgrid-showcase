import { useCallback, useState } from "react"
import { useLiveQuery } from "@tanstack/react-db"
import { archived, updateFields } from "./collections"
import { PageHeader } from "./layout"
import { useToast } from "./toast"
import { GoogleButton } from "./google-button"
import { shortDate } from "./misc"

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
        toast("Google linked", { variant: "success" })
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
      toast("Secret saved", { variant: "success" })
    } catch (e) {
      toast(e?.message || "Secret save failed", { variant: "error" })
    }
  }

  const replaceEnv = (envVar, value) => {
    if (typeof value !== "string" || value.length === 0) return
    updateFields(envVars, envVar.id, { secret_value: value })
    setReveal((current) => ({ ...current, [envVar.id]: "" }))
    toast("Secret updated", { variant: "success" })
  }

  const archiveEnv = (envVar) => {
    archived(envVars, envVar.id, true)
  }

  return (
    <div className="space-y-8 max-w-3xl">
      <PageHeader
        label="Account"
        title="Settings"
        description="Manage your profile and connections."
      />

      <Section title="Account">
        <Row
          label="Tier"
          value={
            <span className="rounded-full border border-sky-500/20 bg-sky-500/10 px-2 py-0.5 text-xs text-sky-400 capitalize">
              {me.tier}
            </span>
          }
        />
        {me.created_at && (
          <Row
            label="Member since"
            value={shortDate(me.created_at)}
          />
        )}
        <Row
          label="Account ID"
          value={<code className="font-mono text-xs">{me.id}</code>}
        />
      </Section>

      <Section title="Login methods">
        <MethodRow
          label="Google"
          value={me.google_sub && "Google account linked"}
          status={me.google_sub && "Linked"}
          action={
            <GoogleButton
              client={google?.client}
              onCredential={credential}
              size="medium"
              text={me.google_sub ? "continue_with" : "signup_with"}
              width={240}
            />
          }
        />
      </Section>

      <Section title="Secret environment variables">
        <form
          onSubmit={saveEnv}
          className="flex flex-col gap-2 px-4 py-3 sm:flex-row"
        >
          <input
            value={envName}
            onChange={(event) => setEnvName(event.target.value)}
            placeholder="OPENAI_API_KEY"
            className="min-w-0 flex-1 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-white outline-none placeholder:text-white/25 focus:border-sky-500/40"
          />
          <input
            value={envValue}
            onChange={(event) => setEnvValue(event.target.value)}
            type="password"
            placeholder="Secret value"
            className="min-w-0 flex-1 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-white outline-none placeholder:text-white/25 focus:border-sky-500/40"
          />
          <button
            type="submit"
            className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500"
          >
            Add
          </button>
        </form>
        {envRows.map((envVar) => (
          <div
            key={envVar.id}
            className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate font-mono text-sm text-white">{envVar.name}</p>
              <p className="text-xs text-white/35">
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
              className="min-w-0 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-white outline-none placeholder:text-white/25 focus:border-sky-500/40 sm:w-48"
            />
            <button
              type="button"
              onClick={() => replaceEnv(envVar, reveal[envVar.id])}
              className="rounded-lg border border-white/[0.08] px-3 py-2 text-xs font-medium text-white/60 hover:bg-white/[0.05] hover:text-white"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={() => archiveEnv(envVar)}
              className="rounded-lg border border-red-500/20 px-3 py-2 text-xs font-medium text-red-300 hover:bg-red-500/10"
            >
              Remove
            </button>
          </div>
        ))}
      </Section>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <section>
      <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-white/40">
        {title}
      </h2>
      <div className="rounded-2xl border border-white/[0.08] bg-[#03111f] divide-y divide-white/[0.06]">
        {children}
      </div>
    </section>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-sm text-white/60">{label}</span>
      <span className="text-sm text-white">{value}</span>
    </div>
  )
}

function MethodRow({ label, value, status, action }) {
  return (
    <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm text-white">{label}</p>
        <p className="text-xs text-white/45">{value}</p>
      </div>
      <div className="flex items-center gap-3">
        <span className="rounded-full border border-white/[0.08] px-2 py-0.5 text-xs text-white/55">
          {status}
        </span>
        {action}
      </div>
    </div>
  )
}
