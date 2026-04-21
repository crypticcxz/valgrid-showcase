export function parseJson<T>(text: string): T {
	return JSON.parse(text) as T
}

export async function parseJsonResponse<T>(res: Response): Promise<T> {
	return (await res.json()) as T
}
