import {
  Children,
  isValidElement,
  useEffect,
  useMemo,
  useRef,
} from "react"
import ReactMarkdown from "react-markdown"
import rehypeHighlight from "rehype-highlight"
import "highlight.js/styles/github-dark.css"
import { Icon, ICONS } from "./icons"
import { AI_MODELS, isFailedMessage } from "./misc"
import { TEMPLATES } from "./templates"

const markdownPlugins = [rehypeHighlight]

function textFrom(children) {
  return Children.toArray(children)
    .map((child) => {
      if (typeof child === "string" || typeof child === "number") {
        return String(child)
      }
      if (isValidElement(child)) return textFrom(child.props.children)
      return ""
    })
    .join("")
}

function CodeActions({ code, onApplyCode, onCopyCode }) {
  return (
    <div className="pointer-events-none absolute inset-x-2 bottom-2 z-10 flex justify-end gap-2">
      {onApplyCode && (
        <button
          type="button"
          onClick={() => onApplyCode(code)}
          className="pointer-events-auto rounded bg-[#03111f] px-1.5 py-0.5 text-[0.7rem] font-semibold text-white shadow-sm shadow-black/25 hover:text-sky-200"
        >
          Apply
        </button>
      )}
      {onCopyCode && (
        <button
          type="button"
          onClick={() => onCopyCode(code)}
          className="pointer-events-auto rounded bg-[#03111f] px-1.5 py-0.5 text-[0.7rem] font-semibold text-white shadow-sm shadow-black/25 hover:text-sky-200"
        >
          Copy
        </button>
      )}
    </div>
  )
}

export function markdown({ onApplyCode, onCopyCode }) {
  return {
    pre({ children }) {
      const code = textFrom(children).replace(/\n$/, "")
      return (
        <div className="relative my-2 rounded-md border border-white/[0.08] bg-sky-950/40">
          <CodeActions
            code={code}
            onApplyCode={onApplyCode}
            onCopyCode={onCopyCode}
          />
          <pre className="overflow-x-auto p-3 pb-9 text-xs">
            {children}
          </pre>
        </div>
      )
    },
    code({ className, children }) {
      const raw = String(children)
      const block = Boolean(className) || raw.includes("\n")
      if (block) return <code className={className}>{children}</code>
      return (
        <code className="rounded bg-white/[0.08] px-1 py-0.5 text-[0.85em] font-mono text-sky-300">
          {children}
        </code>
      )
    },
    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
    ul: ({ children }) => (
      <ul className="list-disc pl-5 mb-2 space-y-0.5">{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className="list-decimal pl-5 mb-2 space-y-0.5">{children}</ol>
    ),
    h1: ({ children }) => (
      <h1 className="text-base font-bold mt-2 mb-1">{children}</h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-sm font-bold mt-2 mb-1">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-sm font-semibold mt-2 mb-1">{children}</h3>
    ),
    a: ({ children, href }) => (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="text-sky-400 hover:text-sky-300 underline"
      >
        {children}
      </a>
    ),
  }
}

export function ChatMessages({
  messages,
  markdownComponents,
  responding,
  onTemplate,
  showTemplates,
}) {
  const scrollRef = useRef(null)
  const visible = useMemo(
    () => messages.filter((m) => m.content),
    [messages],
  )

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [visible, responding])

  return (
    <div ref={scrollRef} className="relative flex-1 overflow-y-auto px-4 lg:px-6">
      <div className="mx-auto max-w-3xl flex flex-col gap-4 py-6">
        {showTemplates && visible.length === 0 && !responding && (
          <TemplateChoices onChoose={onTemplate} />
        )}
        {visible.map((m) => (
          <div
            key={m.id}
            className={
              m.role === "user"
                ? "ml-auto max-w-[80%] rounded-2xl bg-sky-600 px-4 py-2.5 text-sm text-white whitespace-pre-wrap break-words"
                : "max-w-[85%] rounded-2xl bg-white/[0.04] border border-white/[0.06] px-4 py-2.5 text-sm text-white/90 break-words"
            }
          >
            {m.role === "user" ? (
              <>
                {m.content}
                {isFailedMessage(m) && (
                  <p className="mt-2 text-xs text-red-100/80">
                    Assistant response failed.
                  </p>
                )}
              </>
            ) : (
              <ReactMarkdown
                components={markdownComponents}
                rehypePlugins={markdownPlugins}
              >
                {m.content}
              </ReactMarkdown>
            )}
          </div>
        ))}
        {responding && (
          <div className="max-w-[85%] rounded-2xl border border-white/[0.06] bg-white/[0.04] px-4 py-3 text-sm text-white/70">
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/45">Responding</span>
              <span className="flex items-center gap-1" aria-hidden="true">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-sky-300" />
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-sky-300 [animation-delay:120ms]" />
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-sky-300 [animation-delay:240ms]" />
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function TemplateChoices({ onChoose }) {
  return (
    <div className="py-8">
      <div className="mb-5">
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          New strategy
        </h1>
        <p className="mt-2 text-sm text-white/45">
          Pick a template or describe what you want to build.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {TEMPLATES.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onChoose(item)}
            className="group flex min-h-[128px] flex-col rounded-lg border border-white/[0.08] bg-white/[0.02] p-4 text-left transition-colors hover:border-sky-500/30 hover:bg-sky-500/[0.04]"
          >
            <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-md border border-white/[0.08] bg-white/[0.03] text-white/55 group-hover:border-sky-500/30 group-hover:text-sky-300">
              <Icon d={ICONS.plus} size={15} />
            </div>
            <p className="text-sm font-semibold text-white">{item.name}</p>
            <p className="mt-2 line-clamp-2 text-xs leading-5 text-white/45">
              {item.summary}
            </p>
          </button>
        ))}
      </div>
    </div>
  )
}

export function ChatComposer({ model, onModel, draft, onDraft, onSend }) {
  return (
    <form
      onSubmit={onSend}
      className="border-t border-white/[0.04] px-4 py-3 lg:px-6"
    >
      <div className="mx-auto flex max-w-3xl items-end gap-2">
        <textarea
          value={draft}
          onChange={(e) => onDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              onSend(e)
            }
          }}
          rows={1}
          placeholder="Message the consultant…"
          className="max-h-40 flex-1 resize-none rounded-xl border border-white/[0.08] bg-transparent px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-sky-500/40"
        />
        <select
          value={model}
          onChange={(event) => onModel(event.target.value)}
          aria-label="Chat model"
          className="h-10 shrink-0 rounded-lg border border-white/[0.08] bg-transparent px-2 text-xs text-white/50 outline-none hover:text-white focus:border-sky-500/40"
        >
          {AI_MODELS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={!draft.trim()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-600 text-white transition-colors hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-30"
          aria-label="Send"
        >
          <Icon d={ICONS.send} size={14} />
        </button>
      </div>
    </form>
  )
}
