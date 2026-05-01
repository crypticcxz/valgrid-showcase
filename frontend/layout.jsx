export function PageShell({ children }) {
  return (
    <main className="flex-1 flex bg-[#03111f]">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-sky-500/[0.03] rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-sky-500/[0.03] rounded-full blur-3xl" />
      </div>
      <div className="flex-1 min-w-0 overflow-y-auto">
        <div className="relative w-full max-w-[1480px] mx-auto px-4 py-6 md:px-8 md:py-8">
          {children}
        </div>
      </div>
      <div className="w-72 shrink-0 hidden xl:block" aria-hidden="true" />
    </main>
  )
}

export function FullShell({ children }) {
  return (
    <main className="flex-1 min-w-0 overflow-hidden bg-[#03111f]">
      {children}
    </main>
  )
}

export function PageHeader({ label, title, description, children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="space-y-1 sm:space-y-2">
        {label && (
          <p className="text-white/50 text-xs sm:text-sm font-bold tracking-widest uppercase">
            {label}
          </p>
        )}
        <h2 className="text-2xl sm:text-3xl lg:text-5xl font-bold leading-tight text-white">
          {title}
        </h2>
        {description && (
          <p className="text-sm sm:text-lg text-white/50 leading-relaxed mt-1 sm:mt-2">
            {description}
          </p>
        )}
      </div>
      {children}
    </div>
  )
}
