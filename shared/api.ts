export const API_BASE = "/api"

export const routes = {
	auth: {
		register: `${API_BASE}/auth/register`,
		login: `${API_BASE}/auth/login`,
		me: `${API_BASE}/auth/me`,
	},
	deployments: {
		list: `${API_BASE}/deployments`,
		create: `${API_BASE}/deployments`,
		get: (id: string) => `${API_BASE}/deployments/${id}`,
		delete: (id: string) => `${API_BASE}/deployments/${id}`,
		upload: (id: string) => `${API_BASE}/deployments/${id}/upload`,
		start: (id: string) => `${API_BASE}/deployments/${id}/start`,
		stop: (id: string) => `${API_BASE}/deployments/${id}/stop`,
		restart: (id: string) => `${API_BASE}/deployments/${id}/restart`,
		logs: (id: string) => `${API_BASE}/deployments/${id}/logs`,
		metrics: (id: string) => `${API_BASE}/deployments/${id}/metrics`,
		events: (id: string) => `${API_BASE}/deployments/${id}/events`,
		update: (id: string) => `${API_BASE}/deployments/${id}`,
		redeploy: (id: string) => `${API_BASE}/deployments/${id}/redeploy`,
		quickDeploy: `${API_BASE}/deployments/quick`,
	},
} as const
