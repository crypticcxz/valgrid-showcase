import { useEffect, useRef } from "react"

export function GoogleButton({
  before,
  className,
  client,
  onCredential,
  size = "large",
  text = "continue_with",
  width = 320,
}) {
  const button = useRef(null)

  useEffect(() => {
    if (!client || !button.current) return

    const init_ = () => {
      button.current.innerHTML = ""
      window.google.accounts.id.initialize({
        client_id: client,
        callback: onCredential,
      })
      window.google.accounts.id.renderButton(button.current, {
        type: "standard",
        theme: "filled_black",
        size,
        text,
        shape: "rectangular",
        width,
      })
    }

    if (window.google?.accounts?.id) {
      init_()
      return
    }
    const interval = setInterval(() => {
      if (window.google?.accounts?.id) {
        clearInterval(interval)
        init_()
      }
    }, 100)
    return () => clearInterval(interval)
  }, [client, onCredential, size, text, width])

  if (!client) return null
  return (
    <>
      {before}
      <div className={className} ref={button} />
    </>
  )
}
