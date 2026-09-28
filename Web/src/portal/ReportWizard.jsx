import { useState, useEffect } from "react";
import { ArrowLeft, Check, ChevronRight, ChevronDown, Clock, Loader2, Send, AlertCircle, Lightbulb, ThumbsUp } from "lucide-react";
import { api } from "../lib/api";
import { categoryStyle, OTHER_CATEGORY } from "./categoryIcon";
import { Michi } from "../components/ui/Michi";

const OTHER = "__otro__";
const STEPS = ["Categoría", "Problema", "Detalles"];

function Stepper({ step }) {
  return (
    <ol className="flex items-center gap-2 mb-6">
      {STEPS.map((label, i) => {
        const done = i < step, current = i === step;
        return (
          <li key={label} className="flex items-center gap-2 flex-1 last:flex-none">
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
              done ? "bg-success text-white" : current ? "bg-brand text-white" : "bg-surface border border-line-strong text-faint"
            }`}>
              {done ? <Check size={14} strokeWidth={3} /> : i + 1}
            </span>
            <span className={`text-sm font-medium hidden sm:inline ${current ? "text-ink" : "text-faint"}`}>{label}</span>
            {i < STEPS.length - 1 && <span className={`flex-1 h-0.5 rounded ${done ? "bg-success" : "bg-line"}`} />}
          </li>
        );
      })}
    </ol>
  );
}

function OptionCard({ selected, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left bg-surface rounded-xl border p-4 flex items-center gap-3 transition ${
        selected ? "border-brand ring-2 ring-brand/20" : "border-line hover:border-brand/40 hover:shadow-sm"
      }`}
    >
      {children}
    </button>
  );
}

// Soluciones del foro de la misma categoría: a veces el usuario lo resuelve sin esperar
function ForoSugerencias({ categoria }) {
  const [items, setItems] = useState([]);
  const [open, setOpen]   = useState(null);

  useEffect(() => {
    api.get(`/foro?categoria=${encodeURIComponent(categoria)}&orden=utiles&limit=3`).then(setItems).catch(() => setItems([]));
  }, [categoria]);

  if (items.length === 0) return null;
  return (
    <div className="rounded-xl border border-warning/30 bg-warning/5 p-4">
      <p className="text-sm font-semibold text-ink flex items-center gap-2">
        <Lightbulb size={16} className="text-warning" /> Antes de enviar: quizá esto lo resuelva
      </p>
      <div className="mt-2.5 flex flex-col gap-1.5">
        {items.map(p => (
          <div key={p.id} className="bg-surface rounded-lg border border-line">
            <button onClick={() => setOpen(open === p.id ? null : p.id)} className="w-full px-3 py-2.5 flex items-center gap-2 text-left">
              <span className="flex-1 text-sm font-medium text-ink">{p.Titulo}</span>
              <span className="text-xs text-faint inline-flex items-center gap-1"><ThumbsUp size={11} /> {p.util_si}</span>
              <ChevronDown size={15} className={`text-faint transition-transform ${open === p.id ? "rotate-180" : ""}`} />
            </button>
            {open === p.id && (
              <div className="px-3 pb-3 text-sm text-ink-2 whitespace-pre-wrap leading-relaxed border-t border-line pt-2.5">
                {p.Solucion}
              </div>
            )}
          </div>
        ))}
      </div>
      <p className="text-xs text-muted mt-2">¿No te sirvió? Continúa y envía tu reporte.</p>
    </div>
  );
}

export function ReportWizard({ onCancel, onCreated, onOpenTicket, onHome }) {
  const [step, setStep]             = useState(0);
  const [categorias, setCategorias] = useState(null);
  const [categoria, setCategoria]   = useState(null);   // nombre o OTHER
  const [otraCategoria, setOtraCategoria] = useState("");
  const [incidentes, setIncidentes] = useState(null);
  const [incidente, setIncidente]   = useState(null);   // objeto o OTHER
  const [descripcion, setDescripcion] = useState("");
  const [sending, setSending]       = useState(false);
  const [error, setError]           = useState("");
  const [result, setResult]         = useState(null);   // { kind: "ticket" | "otro", id }

  // Se carga el catálogo completo una vez: sirve para las categorías, sus ejemplos y el paso 2
  const [catalogo, setCatalogo] = useState([]);
  useEffect(() => {
    api.get("/incidentes")
      .then(rows => {
        setCatalogo(rows);
        const porCategoria = new Map();
        for (const r of rows) {
          if (!porCategoria.has(r.Categoria)) porCategoria.set(r.Categoria, []);
          porCategoria.get(r.Categoria).push(r.Incidente);
        }
        setCategorias([...porCategoria].map(([name, ejemplos]) => ({ name, ejemplos })));
      })
      .catch(err => setError(err.message));
  }, []);

  const pickCategoria = cat => {
    setCategoria(cat);
    setIncidente(null);
    setError("");
    if (cat === OTHER) { setIncidente(OTHER); setStep(2); return; }
    setIncidentes(catalogo.filter(i => i.Categoria === cat));
    setStep(1);
  };

  const pickIncidente = inc => { setIncidente(inc); setStep(2); };

  const back = () => {
    setError("");
    if (step === 2 && categoria === OTHER) setStep(0);
    else if (step > 0) setStep(step - 1);
    else onCancel();
  };

  const submit = async () => {
    const desc = descripcion.trim();
    if (desc.length < 10) { setError("Cuéntanos un poco más (al menos 10 caracteres)."); return; }
    if (categoria === OTHER && !otraCategoria.trim()) { setError("Indica de qué se trata el problema."); return; }

    setSending(true); setError("");
    try {
      if (incidente === OTHER) {
        // No encaja en el catálogo: lo revisa el equipo y lo convierte en ticket
        const row = await api.post("/otros-incidentes", {
          Categoria:   categoria === OTHER ? otraCategoria.trim() : categoria,
          Descripcion: desc,
          Prioridad:   "Pendiente",
        });
        setResult({ kind: "otro", id: row.id });
      } else {
        const row = await api.post("/tickets", { Incidente_ID: incidente.id, Descripcion: desc });
        setResult({ kind: "ticket", id: row.id });
      }
      onCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  // ── Confirmación ──────────────────────────────────────────
  if (result) {
    return (
      <div className="bg-surface rounded-2xl border border-line p-8 sm:p-10 text-center max-w-lg mx-auto">
        <Michi pose="celebrate" size={170} className="mx-auto -mt-2 mb-2" title="¡Michi celebra!" />
        <h2 className="text-xl font-semibold text-ink">¡Miau-ravilloso! Recibimos tu reporte</h2>
        {result.kind === "ticket" ? (
          <p className="text-muted mt-2">
            Creamos el ticket <b className="text-ink font-mono">TK-{String(result.id).padStart(4, "0")}</b> y ya está asignado al equipo de soporte.
            Te responderemos por aquí.
          </p>
        ) : (
          <p className="text-muted mt-2">
            El equipo de soporte revisará tu reporte y lo convertirá en un ticket. Podrás verlo en <b>Mis tickets</b>.
          </p>
        )}
        <div className="flex flex-col sm:flex-row gap-2 justify-center mt-6">
          {result.kind === "ticket" && (
            <button onClick={() => onOpenTicket(result.id)} className="h-10 px-5 rounded-lg bg-brand hover:bg-brand-hover text-white text-sm font-semibold">
              Ver mi ticket
            </button>
          )}
          <button onClick={onHome} className="h-10 px-5 rounded-lg border border-line-strong text-sm font-semibold text-ink-2 hover:bg-hover">
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  const catName = categoria === OTHER ? (otraCategoria || "Otro") : categoria;

  return (
    <div>
      <button onClick={back} className="text-sm text-muted hover:text-ink flex items-center gap-1.5 mb-4">
        <ArrowLeft size={15} /> {step === 0 ? "Cancelar" : "Atrás"}
      </button>
      <h1 className="text-2xl font-semibold text-ink tracking-tight mb-1">Reportar un problema</h1>
      <p className="text-muted mb-6">Solo tres pasos. Así el problema llega directo a la persona indicada.</p>

      <Stepper step={step} />

      {error && (
        <div className="mb-4 flex items-center gap-2 text-sm text-danger bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">
          <AlertCircle size={15} /> {error}
        </div>
      )}

      {/* Paso 1: categoría */}
      {step === 0 && (
        <>
          <h2 className="font-semibold text-ink mb-3">¿Con qué tienes problemas?</h2>
          {!categorias ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-faint" /></div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[...categorias, { name: OTHER, ejemplos: [] }].map(({ name, ejemplos }) => {
                const isOther = name === OTHER;
                const { Icon, tint, desc } = isOther ? OTHER_CATEGORY : categoryStyle(name);
                return (
                  <button
                    key={name} onClick={() => pickCategoria(name)}
                    className={`bg-surface rounded-xl border p-4 flex items-start gap-3.5 text-left transition hover:border-brand/40 hover:shadow-md ${
                      categoria === name ? "border-brand ring-2 ring-brand/20" : "border-line"
                    } ${isOther ? "border-dashed" : ""}`}
                  >
                    <span className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${tint}`}><Icon size={22} /></span>
                    <span className="flex-1 min-w-0">
                      <span className="block font-semibold text-ink">{isOther ? "Otro" : name}</span>
                      {/* Explicación genérica; si la categoría no la tiene, se usan los ejemplos del catálogo */}
                      {desc && <span className="block text-sm text-muted leading-snug mt-0.5">{desc}</span>}
                      {ejemplos.length > 0 && (
                        <span className="block text-xs text-faint mt-1.5 line-clamp-2">
                          Ej.: {ejemplos.slice(0, 3).join(", ")}{ejemplos.length > 3 ? "…" : ""}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Paso 2: tipo de problema */}
      {step === 1 && (
        <>
          <h2 className="font-semibold text-ink mb-3">¿Qué está pasando con <span className="text-brand">{categoria}</span>?</h2>
          {!incidentes ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-faint" /></div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {incidentes.map(inc => (
                <OptionCard key={inc.id} selected={incidente?.id === inc.id} onClick={() => pickIncidente(inc)}>
                  <span className="flex-1">
                    <span className="block font-medium text-ink">{inc.Incidente}</span>
                    {inc.Tiempo && (
                      <span className="text-xs text-faint flex items-center gap-1 mt-0.5"><Clock size={12} /> Solución estimada: {inc.Tiempo}</span>
                    )}
                  </span>
                  <ChevronRight size={18} className="text-faint" />
                </OptionCard>
              ))}
              <OptionCard selected={incidente === OTHER} onClick={() => pickIncidente(OTHER)}>
                <span className="flex-1">
                  <span className="block font-medium text-ink">Otro problema de {categoria}</span>
                  <span className="text-xs text-faint">No aparece en la lista</span>
                </span>
                <ChevronRight size={18} className="text-faint" />
              </OptionCard>
            </div>
          )}
        </>
      )}

      {/* Paso 3: descripción */}
      {step === 2 && (
        <div className="bg-surface rounded-2xl border border-line p-5 sm:p-6 flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-muted">Tu reporte:</span>
            <span className="px-2.5 py-1 rounded-lg bg-brand-soft text-brand font-medium">{catName}</span>
            {incidente && incidente !== OTHER && (
              <span className="px-2.5 py-1 rounded-lg bg-subtle border border-line text-ink-2 font-medium">{incidente.Incidente}</span>
            )}
          </div>

          {categoria !== OTHER && <ForoSugerencias categoria={categoria} />}

          {categoria === OTHER && (
            <div>
              <label className="text-sm font-semibold text-ink-2 block mb-1.5">¿De qué se trata?</label>
              <input
                value={otraCategoria} onChange={e => setOtraCategoria(e.target.value)}
                placeholder="Ej.: Proyector de la sala, teléfono de escritorio…"
                className="w-full h-10 px-3 rounded-lg border border-line-strong bg-field text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 placeholder:text-faint"
              />
            </div>
          )}

          <div>
            <label className="text-sm font-semibold text-ink-2 block mb-1.5">Describe el problema</label>
            <textarea
              value={descripcion} onChange={e => setDescripcion(e.target.value)} rows={6} autoFocus
              placeholder="¿Qué pasa? ¿Desde cuándo? ¿Aparece algún mensaje de error? ¿Dónde estás (piso, oficina)?"
              className="w-full px-3 py-2.5 rounded-lg border border-line-strong bg-field text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 placeholder:text-faint resize-none leading-relaxed"
            />
            <p className="text-xs text-faint mt-1">Cuantos más detalles, más rápido lo resolvemos.</p>
          </div>

          <div className="flex justify-end gap-2">
            <button onClick={back} className="h-10 px-4 rounded-lg border border-line-strong text-sm font-semibold text-ink-2 hover:bg-hover">
              Atrás
            </button>
            <button
              onClick={submit} disabled={sending}
              className="h-10 px-5 rounded-lg bg-brand hover:bg-brand-hover text-white text-sm font-semibold flex items-center gap-2 disabled:opacity-60"
            >
              {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              Enviar reporte
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
