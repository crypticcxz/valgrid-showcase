import { Route, Router } from "@solidjs/router"
import { Layout } from "./components/common/layout.tsx"
import { Dashboard } from "./pages/dashboard.tsx"
import { DeploymentDetail } from "./pages/deploymentDetail.tsx"
import { Login } from "./pages/login.tsx"
import { NewDeployment } from "./pages/newDeployment.tsx"
import { Register } from "./pages/register.tsx"

export function App() {
	return (
		<Router root={Layout}>
			<Route path="/login" component={Login} />
			<Route path="/register" component={Register} />
			<Route path="/" component={Dashboard} />
			<Route path="/deploy/new" component={NewDeployment} />
			<Route path="/deploy/:id" component={DeploymentDetail} />
		</Router>
	)
}
