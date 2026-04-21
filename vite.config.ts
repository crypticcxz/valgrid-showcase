import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "vite"
import solid from "vite-plugin-solid"

export default defineConfig({
	root: "client/",
	publicDir: "../public",
	envPrefix: "VALGRID_",
	build: {
		outDir: "../web",
		emptyOutDir: true,
		sourcemap: false,
	},
	server: {
		hmr: { overlay: false },
		proxy: {
			"/api": {
				target: "http://localhost:3001",
				changeOrigin: true,
			},
			"/ws": {
				target: "ws://localhost:3001",
				ws: true,
			},
		},
	},
	plugins: [solid(), tailwindcss()],
})
