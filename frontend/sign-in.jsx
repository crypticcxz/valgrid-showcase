import { useCallback, useState } from "react"
import { googleLogin, login } from "./auth"
import { Icon, ICONS } from "./icons"
import { GoogleButton } from "./google-button"

export function SignIn({ google, onSignedIn }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const click = async () => {
    setBusy(true)
    setError(null)
    try {
      const me = await login()
      if (me) {
        onSignedIn(me)
      }
    } catch (e) {
      console.error(e)
      setError(e?.message)
    } finally {
      setBusy(false)
    }
  }

  const credential = useCallback(
    async (response) => {
      setError(null)
      try {
        const me = await googleLogin(response.credential)
        onSignedIn(me)
      } catch (e) {
        console.error(e)
        setError(e?.message)
      }
    },
    [onSignedIn],
  )

  return (
    <div
      className="relative min-h-screen flex flex-col items-center justify-center p-6"
      style={{
        background:
          "radial-gradient(circle at 50% 135%, rgba(14,165,233,0.35) 33%, rgba(2,132,199,0.20) 51%, rgba(8,47,73,0.10) 62%, #03111f 85%)",
      }}
    >
      <div className="mb-12">
        <span className="text-2xl font-bold tracking-tight text-white">
          Valgrid
        </span>
      </div>

      <div className="w-full max-w-md">
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-sky-950/60 backdrop-blur-xl shadow-2xl shadow-sky-950/30">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-500/30 to-transparent" />

          <div className="relative px-5 sm:px-8 py-8 sm:py-10">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-white mb-2">
                Sign in to your account
              </h1>
              <p className="text-sm text-white/40">
                Access your trading dashboard
              </p>
            </div>

            <div className="space-y-4">
              <button
                type="button"
                onClick={click}
                disabled={busy}
                className="flex items-center justify-center w-full h-12 rounded-lg text-sm font-semibold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background:
                    "linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)",
                }}
              >
                {busy ? "Connecting…" : "Connect wallet"}
              </button>

              {error && (
                <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}

              <GoogleButton
                client={google?.client}
                className="flex justify-center"
                onCredential={credential}
                before={
                  <div className="relative flex items-center py-2">
                    <div className="flex-1 border-t border-white/[0.06]" />
                    <span className="px-3 text-xs text-white/30 font-medium">
                      or
                    </span>
                    <div className="flex-1 border-t border-white/[0.06]" />
                  </div>
                }
              />
            </div>

            <div className="mt-6 pt-6 border-t border-white/[0.06]">
              <div className="flex items-center justify-center gap-6 text-xs text-white/30">
                <div className="flex items-center gap-1.5">
                  <Icon d={ICONS.shield} size={14} />
                  <span>Non-custodial</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Icon d={ICONS.lock} size={14} />
                  <span>Encrypted</span>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-sky-500/20 to-transparent" />
        </div>

        <p className="text-center text-xs mt-6 text-white/40">
          By signing in, you agree to our{" "}
          <a
            href="/terms"
            className="text-sky-400 hover:text-sky-300 underline-offset-2 hover:underline transition-colors"
          >
            Terms
          </a>{" "}
          and{" "}
          <a
            href="/privacy"
            className="text-sky-400 hover:text-sky-300 underline-offset-2 hover:underline transition-colors"
          >
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  )
}
