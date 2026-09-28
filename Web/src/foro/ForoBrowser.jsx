import { useState, useEffect, useCallback } from "react";
import { Search, X, ThumbsUp, MessageSquare, Eye, Loader2, Plus, CheckCircle2 } from "lucide-react";
import { api } from "../lib/api";
import { categoryStyle } from "../portal/categoryIcon";
import { ForoPost } from "./ForoPost";
import { Michi } from "../components/ui/Michi";

export const fechaCorta = iso => iso
  ? new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })
  : "";

/**
 * Foro de soluciones: buscador, filtro por categoría y lista de casos resueltos.
 * Al abrir una publicación muestra el detalle (votos y comentarios).
 */
export function ForoBrowser({ onReport }) {
  const [q, setQ]                 = useState("");
  const [categoria, setCategoria] = useState("");
  const [orden, setOrden]         = useState("recientes");
  const [items, setItems]         = useState(null);
  const [categorias, setCats]     = useState([]);
  const [error, setError]         = useState("");
  const [openId, setOpenId]       = useState(null);

  const load = useCallback(async () => {
    setError("");
    try {
      const params = new URLSearchParams({ orden });
      if (q.trim()) params.set("q", q.trim());
      if (categoria) params.set("categoria", categoria);
      setItems(await api.get(`/foro?${params}`));
    } catch (err) {
      setError(err.message);
      setItems([]);
    }
  }, [q, categoria, orden]);

  // Búsqueda con pequeño retardo mientras se escribe
  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  useEffect(() => {
    api.get("/foro/categorias").then(setCats).catch(() => {});
  }, []);

  if (openId) {
    return <ForoPost id={openId} onBack={() => { setOpenId(null); load(); }} onReport={onReport} />;
  }

  return (
    <div className="flex flex-col gap-5">
      <section className="rounded-2xl bg-surface border border-line p-6">
        <div className="flex items-start gap-4">
          <Michi pose="magnifier" size={96} className="flex-shrink-0 -my-3 -ml-2" title="Michi busca soluciones" />
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-ink tracking-tight">Foro de soluciones</h1>
            <p className="text-muted mt-1">
              Problemas que otras personas ya tuvieron y cómo se resolvieron. Todos los casos se publican de forma anónima.
            </p>
          </div>
        </div>
        <div className="mt-5 flex items-center gap-2 h-11 px-3.5 rounded-xl border border-line-strong bg-field focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20">
          <Search size={17} className="text-faint" />
          <input
            value={q} onChange={e => setQ(e.target.value)}
            placeholder="Busca tu problema: «impresora no imprime», «wifi lento», «contraseña»…"
            className="flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-faint"
          />
          {q && <button onClick={() => setQ("")} className="text-faint hover:text-ink"><X size={15} /></button>}
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-2">
        {[{ Categoria: "", total: null }, ...categorias].map(c => (
          <button
            key={c.Categoria || "todas"} onClick={() => setCategoria(c.Categoria)}
            className={`h-8 px-3 rounded-full text-sm font-medium border transition-colors ${
              categoria === c.Categoria ? "bg-brand text-white border-brand" : "bg-surface text-ink-2 border-line hover:border-brand/40"
            }`}
          >
            {c.Categoria || "Todas"}{c.total != null && <span className="opacity-70"> · {c.total}</span>}
          </button>
        ))}
        <select
          value={orden} onChange={e => setOrden(e.target.value)}
          className="ml-auto h-8 px-2.5 rounded-lg border border-line bg-surface text-sm text-ink-2 outline-none"
        >
          <option value="recientes">Más recientes</option>
          <option value="utiles">Más útiles</option>
        </select>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      {items === null ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-faint" /></div>
      ) : items.length === 0 ? (
        <div className="bg-surface rounded-xl border border-line py-10 px-6 text-center">
          <Michi pose="sad" size={110} className="mx-auto mb-1" title="" />
          <p className="font-medium text-ink">Michi no encontró soluciones para tu búsqueda</p>
          <p className="text-sm text-muted mt-1">Prueba con otras palabras o repórtalo para que el equipo te ayude.</p>
          {onReport && (
            <button onClick={onReport} className="mt-4 h-10 px-4 rounded-lg bg-brand hover:bg-brand-hover text-white text-sm font-semibold inline-flex items-center gap-1.5">
              <Plus size={16} /> Reportar un problema
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {items.map(p => {
            const { Icon, tint } = categoryStyle(p.Categoria ?? "");
            return (
              <button
                key={p.id} onClick={() => setOpenId(p.id)}
                className="group bg-surface rounded-xl border border-line p-4 flex items-start gap-4 text-left hover:border-brand/40 hover:shadow-md transition"
              >
                <span className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${tint}`}><Icon size={20} /></span>
                <span className="flex-1 min-w-0">
                  <span className="flex items-center gap-2">
                    <span className="font-semibold text-ink group-hover:text-brand">{p.Titulo}</span>
                  </span>
                  <span className="block text-sm text-muted line-clamp-2 mt-0.5">{p.Problema}</span>
                  <span className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-faint">
                    <span className="inline-flex items-center gap-1 text-success font-semibold"><CheckCircle2 size={13} /> Solucionado</span>
                    {p.Categoria && <span>{p.Categoria}</span>}
                    <span className="inline-flex items-center gap-1"><ThumbsUp size={12} /> {p.util_si}</span>
                    <span className="inline-flex items-center gap-1"><MessageSquare size={12} /> {p.comentarios}</span>
                    <span className="inline-flex items-center gap-1"><Eye size={12} /> {p.Vistas}</span>
                    <span>{fechaCorta(p.published_at)}</span>
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
