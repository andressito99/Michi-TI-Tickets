// Quita datos personales de un texto antes de publicarlo en el foro.
// Es una primera pasada automática: el admin siempre revisa el texto antes de publicar.

const escapeRegex = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Cada letra acepta sus variantes con tilde: "maria" encuentra "María" y "garcia" encuentra "García"
const VARIANTES_LETRA = { a: "aáàäâ", e: "eéèëê", i: "iíìïî", o: "oóòöô", u: "uúùüû", n: "nñ", c: "cç" };
const sinTildes = s => s.normalize("NFD").replace(/\p{M}/gu, "");
function patronSinTildes(nombre) {
  return [...sinTildes(nombre)].map(ch => {
    const variantes = VARIANTES_LETRA[ch.toLowerCase()];
    return variantes ? `[${variantes}${variantes.toUpperCase()}]` : escapeRegex(ch);
  }).join("");
}

/**
 * @param {string} text
 * @param {{ usuarios?: string[], soporte?: string[] }} nombres
 *   usuarios → se reemplazan por "[usuario]"; soporte → por "el equipo de soporte"
 */
export function anonimizar(text, { usuarios = [], soporte = [] } = {}) {
  let s = String(text ?? "");

  s = s.replace(/[\w.+-]+@[\w-]+(\.[\w-]+)+/g, "[correo]");
  // Teléfonos: 9 o más dígitos (así no se confunden con fechas como 2026-09-28)
  s = s.replace(/(?<!\w)\+?\d[\d\s().-]{6,}\d(?!\w)/g, m => (m.replace(/\D/g, "").length >= 9 ? "[teléfono]" : m));
  s = s.replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, "[IP]");

  const reemplazos = [
    ...variantes(usuarios).map(n => [n, "[usuario]"]),
    ...variantes(soporte).map(n => [n, "el equipo de soporte"]),
  ].sort((a, b) => b[0].length - a[0].length); // primero los nombres completos

  for (const [nombre, sustituto] of reemplazos) {
    const re = new RegExp(`(?<![\\p{L}\\p{N}])${patronSinTildes(nombre)}(?![\\p{L}\\p{N}])`, "giu");
    s = s.replace(re, sustituto);
  }
  return s.replace(/\[usuario\](\s+\[usuario\])+/g, "[usuario]");
}

// "Ana García" → ["Ana García", "Ana", "García"]; "juan.perez" → ["juan.perez", "juan", "perez"]
function variantes(nombres) {
  const set = new Set();
  for (const n of nombres) {
    const full = String(n ?? "").trim();
    if (full.length < 3) continue;
    set.add(full);
    for (const part of full.split(/[\s._-]+/)) if (part.length >= 3) set.add(part);
  }
  return [...set];
}
