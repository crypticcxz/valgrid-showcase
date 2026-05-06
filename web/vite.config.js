import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

/** Bun resolves `./public/...` from disk; Vite serves `public/` at `/`. Rewrite for dev + build. */
function faviconPublicPath() {
  return {
    name: "valgrid-favicon-public-path",
    transformIndexHtml(html) {
      return html.replace(/\.\/public\/logo\.png/g, "/logo.png")
    },
  }
}

export default defineConfig({
  plugins: [react(), faviconPublicPath()],
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    outDir: "dist",
    sourcemap: false,
  },
})
