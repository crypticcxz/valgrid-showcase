export async function api(method, path, body) {
  const options = {
    method,
    credentials: "include",
  }
  if (body) {
    options.headers = { "Content-Type": "application/json" }
    options.body = JSON.stringify(body)
  }
  const response = await fetch(path, options)
  if (!response.ok) {
    let error = `request failed with status ${response.status}`
    const text = await response.text()
    if (text) {
      const err = JSON.parse(text)
      if (err.error) error = err.error
    }
    throw new Error(error)
  }
  return response.json()
}
