import { createContext, useContext, useState, useCallback } from "react"

const ToastContext = createContext(() => {})

let next = 0

const variants = {
  error: "bg-red-500/10 border-red-500/30 text-red-300",
  success: "bg-emerald-500/10 border-emerald-500/30 text-emerald-300",
  info: "bg-sky-950/95 border-white/[0.08] text-white",
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const toast_ = useCallback((message, opts = {}) => {
    const id = next++
    setToasts((t) => [...t, { id, message, variant: opts.variant }])
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id))
    }, opts.duration ?? 3000)
  }, [])

  return (
    <ToastContext.Provider value={toast_}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none max-w-sm">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={
              "rounded-lg border px-4 py-3 text-sm shadow-2xl pointer-events-auto backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 " +
              (variants[t.variant] ?? variants.info)
            }
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
