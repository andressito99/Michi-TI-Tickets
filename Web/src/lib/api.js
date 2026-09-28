// Cliente HTTP para la API Node (backend/). En desarrollo Vite redirige /api → localhost:3000.
const BASE_URL = (import.meta.env.VITE_API_URL ?? "/api").replace(/\/$/, "");

let token = null;
let onUnauthorized = null;

export const setToken = t => { token = t; };
export const setUnauthorizedHandler = fn => { onUnauthorized = fn; };

async function request(method, path, body) {
  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("No se pudo conectar con el servidor. ¿Está corriendo el backend?");
  }

  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    if (res.status === 401 && token && onUnauthorized) onUnauthorized();
    throw new Error(data?.error ?? `Error ${res.status}`);
  }
  return data;
}

export const api = {
  get:    path       => request("GET",    path),
  post:   (path, b)  => request("POST",   path, b ?? {}),
  patch:  (path, b)  => request("PATCH",  path, b),
  delete: path       => request("DELETE", path),
};
