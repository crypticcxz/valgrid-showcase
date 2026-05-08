import { createRoot } from "react-dom/client"
import { useEffect, useState } from "react"
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom"
import { useAccount, useMe } from "./auth"
import { SignIn } from "./sign-in"
import { PageShell, FullShell } from "./layout"
import { Home } from "./home"
import {
  Archive,
  Strategies,
  StrategySidebar,
} from "./strategies-list"
import { accountEnvVars, accounts, notifications, strategies, wallet } from "./data"
import { StrategyDetail } from "./strategy-detail"
import { Wallets } from "./wallets"
import { Analytics } from "./analytics"
import { Settings } from "./settings"
import { Profile } from "./profile"
import { LegalPage } from "./legal"
import { PublicStrategy } from "./public-strategy"
import { Notifications } from "./notifications"
import { ToastProvider } from "./toast"
import { ContactPage } from "./contact-page"
import { DocsPage } from "./docs"

function App() {
  const {
    account: accountId,
    google,
    sessionAccount,
    signin,
    signout,
    loading,
  } = useAccount()
  const location = useLocation()
  if (location.pathname === "/terms") return <LegalPage type="terms" />
  if (location.pathname === "/privacy") return <LegalPage type="privacy" />
  if (location.pathname === "/contact") return <ContactPage />
  if (location.pathname === "/docs") return <DocsPage />
  if (location.pathname.startsWith("/share/strategies/"))
    return <Share accountId={accountId} />
  if (location.pathname === "/") return <Home />
  if (loading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-[#03111f] px-4 text-center text-sm text-white/50">
        Loading…
      </div>
    )
  }
  if (!accountId) {
    return <SignIn google={google} onSignedIn={(me) => signin(me.id)} />
  }
  return <AuthedApp accountId={accountId} google={google} sessionAccount={sessionAccount} signout={signout} />
}

function ScrollToTopOnPathChange() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" })
  }, [pathname])

  return null
}

function AuthedApp({ accountId, google, sessionAccount, signout }) {
  const location = useLocation()
  const navigate = useNavigate()
  const match = location.pathname.match(/^\/strategies\/([^/]+)$/)
  const selected = match
    ? decodeURIComponent(match[1])
    : null

  const accountCollection = accounts(accountId)
  const wallets = wallet(accountId)
  const store = strategies(accountId)
  const envVars = accountEnvVars(accountId)
  const inbox = notifications(accountId)
  const me = useMe(accountCollection, wallets, accountId, sessionAccount)
  const [sidebar, setSidebar] = useState(true)
  const [strategySearch, setStrategySearch] = useState("")

  if (!me.ready) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-2 bg-[#03111f] px-6 text-center text-sm text-white/50">
        <p>Syncing your account…</p>
        <p className="max-w-md text-xs text-white/35">
          If this never finishes, check the browser console and that the
          Electric sync service is running.
        </p>
      </div>
    )
  }

  return (
    <div className="flex h-screen w-full bg-[#03111f] text-white">
      {sidebar ? (
        <StrategySidebar
          me={me}
          store={store}
          search={strategySearch}
          onSearch={setStrategySearch}
          onSignOut={signout}
          pathname={location.pathname}
          activeStrategy={selected}
          onCollapse={() => setSidebar(false)}
        />
      ) : (
        <button
          type="button"
          onClick={() => setSidebar(true)}
          className="absolute left-3 top-3 z-20 rounded-lg border border-white/[0.08] bg-[#03111f]/90 p-2 text-white/55 shadow-lg backdrop-blur hover:bg-white/[0.04] hover:text-white"
          aria-label="Show sidebar"
          title="Show sidebar"
        >
          <span className="text-sm">☰</span>
        </button>
      )}
      <Routes>
        <Route
          path="/strategies/:id"
          element={
            <FullShell>
              <Detail collection={store} />
            </FullShell>
          }
        />
        <Route
          path="/wallets"
          element={
            <PageShell>
              <Wallets me={me} collection={wallets} />
            </PageShell>
          }
        />
        <Route
          path="/analytics"
          element={
            <PageShell>
              <Analytics account={accountId} store={store} />
            </PageShell>
          }
        />
        <Route
          path="/notifications"
          element={
            <PageShell>
              <Notifications collection={inbox} />
            </PageShell>
          }
        />
        <Route
          path="/archive"
          element={
            <PageShell>
              <Archive collection={store} />
            </PageShell>
          }
        />
        <Route
          path="/settings"
          element={
            <PageShell>
              <Settings
                me={me}
                google={google}
                account={accountCollection}
                envVars={envVars}
              />
            </PageShell>
          }
        />
        <Route
          path="/profile"
          element={
            <PageShell>
              <Profile me={me} store={store} />
            </PageShell>
          }
        />
        <Route
          path="/strategies"
          element={
            <PageShell>
              <Strategies
                me={me}
                collection={store}
                onOpen={(id) =>
                  navigate(`/strategies/${encodeURIComponent(id)}`, {
                    replace: true,
                  })
                }
              />
            </PageShell>
          }
        />
        <Route path="*" element={<Navigate to="/strategies" replace />} />
      </Routes>
    </div>
  )
}

function Detail({ collection }) {
  const { id } = useParams()
  return <StrategyDetail key={id} id={id} collection={collection} />
}

function Share({ accountId }) {
  const { pathname } = useLocation()
  const id = decodeURIComponent(pathname.replace(/^\/share\/strategies\//, ""))
  return <PublicStrategy account={accountId} id={id} />
}

const element = document.getElementById("root")
const root = globalThis.__valgridRoot ?? createRoot(element)
globalThis.__valgridRoot = root

root.render(
  <ToastProvider>
    <BrowserRouter
      future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
    >
      <ScrollToTopOnPathChange />
      <App />
    </BrowserRouter>
  </ToastProvider>,
)
