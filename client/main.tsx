import { render } from "solid-js/web"
import { App } from "./app.tsx"
import "./global.css"
import "./styles.css"

const root = document.getElementById("root")
if (root) {
	render(() => <App />, root)
}
