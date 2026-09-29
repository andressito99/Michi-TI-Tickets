// Cliente HTTP para la API Node (backend/). En desarrollo Vite redirige /api → localhost:3000.
export const BASE_URL = (import.meta.env.VITE_API_URL ?? "/api").replace(/\/$/, "");

let token = null;
let onUnauthorized = null;

export const setToken = t => { token = t; };
export const getToken = () => token;
export const setUnauthorizedHandler = fn => { onUnauthorized = fn; };

/**
 * @param {string} method
 * @param {string} path
 * @param {object|FormData} [body]  Un FormData se envía como multipart (para subir imágenes)
 * @param {"json"|"blob"} [as]
 */
async function request(method, path, body, as = "json") {
  const isForm = body instanceof FormData;
  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        // Con FormData el navegador pone el Content-Type (con el "boundary") automáticamente
        ...(body !== undefined && !isForm ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
    });
  } catch {
    throw new Error("No se pudo conectar con el servidor. ¿Está corriendo el backend?");
  }

  if (res.ok && as === "blob") return res.blob();
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
  /** Sube un FormData (multipart). */
  upload: (path, formData) => request("POST", path, formData),
  /** Descarga un archivo protegido (las <img> no pueden enviar el token por sí solas). */
  blob:   path       => request("GET", path, undefined, "blob"),
};
