import { useEffect, useRef, useState } from "react"
import hljs from "highlight.js/lib/core"
import python from "highlight.js/lib/languages/python"
import { Editor } from "./editor"

hljs.registerLanguage("python", python)

function highlight(code) {
  return hljs.highlight(code, { language: "python" }).value
}

function useOutput(strategy, reset) {
  const [text, setText] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    if (!reset) return
    setText("")
    setError("")
  }, [reset])

  useEffect(() => {
    if (!strategy) {
      setText("")
      setError("")
      return
    }
    const controller = new AbortController()
    const decoder = new TextDecoder()
    fetch(`/api/strategies/${encodeURIComponent(strategy)}/output`, {
      credentials: "include",
      signal: controller.signal,
    }).then(async (response) => {
      if (!response.ok || !response.body) {
        throw new Error(`output stream failed: ${response.status}`)
      }
      const reader = response.body.getReader()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        setText((current) => {
          const next = current + chunk
          return next.slice(-200000)
        })
      }
    }).catch((e) => {
      if (!controller.signal.aborted) setError(e.message)
    })
    return () => controller.abort()
  }, [strategy])

  return { text, error }
}

export function StrategyEditor({ strategy, reset, code, onCode }) {
  const output = useOutput(strategy, reset)
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex min-h-0 flex-[3] flex-col overflow-hidden">
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
          <Editor
            value={code}
            onValueChange={onCode}
            highlight={highlight}
            padding={16}
            placeholder="# write your strategy here"
            textareaClassName="outline-none"
            className="min-w-full font-mono text-xs text-white"
            style={{
              fontFamily: '"SF Mono", "Menlo", "Monaco", "Consolas", monospace',
              caretColor: "white",
            }}
          />
        </div>
      </div>
      <div className="flex min-h-[180px] flex-[2] flex-col overflow-hidden border-t border-white/[0.06]">
        <div className="shrink-0 border-b border-white/[0.06] bg-white/[0.02] px-4 py-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-white/45">
            Output
          </span>
        </div>
        <div className="flex min-h-0 flex-1 flex-col">
          <OutputView
            output={output.text}
            error={output.error}
            emptyText="No output yet. Run this strategy to see output."
          />
        </div>
      </div>
    </div>
  )
}

function OutputView({ output, error, emptyText }) {
  const scrollRef = useRef(null)

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [output])

  if (error) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center p-8 text-sm text-red-300">
        {error}
      </div>
    )
  }

  if (!output) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center p-8 text-sm text-white/30">
        {emptyText}
      </div>
    )
  }
  return (
    <pre
      ref={scrollRef}
      className="min-h-0 flex-1 overflow-y-auto whitespace-pre-wrap break-words bg-sky-950/20 p-4 font-mono text-xs leading-5 text-white/80"
    >
      {output}
    </pre>
  )
}
