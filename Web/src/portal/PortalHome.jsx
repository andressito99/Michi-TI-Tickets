// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 andressito99 y los colaboradores del proyecto Michi · Soporte TI con siete vidas

import { useState } from "react";
import { Plus, Lightbulb, ChevronRight, MessageCircle, Hourglass, Loader2, RefreshCw, BookOpenCheck } from "lucide-react";
import { StatusBadge } from "../components/tickets/StatusBadge";
import { categoryStyle } from "./categoryIcon";
import { Michi } from "../components/ui/Michi";
import { MichiBuddy } from "../components/ui/MichiBuddy";
import { greeting, pick, TIPS } from "../utils/michiVoice";

const shortDate = iso => iso
  ? new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short" })
  : "";

function CategoryBadge({ name }) {
  const { Icon, tint } = categoryStyle(name);
  return (
    <span className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${tint}`}>
      <Icon size={20} />
    </span>
  );
}

export function PortalHome({ user, tickets, pending, loading, error, refresh, onReport, onOpenTicket, onForo }) {
  const [tab, setTab] = useState("active");
  const [tip, setTip] = useState(() => pick(TIPS));

  const active   = tickets.filter(t => t.status !== "resolved");
  const resolved = tickets.filter(t => t.status === "resolved");
  const list     = tab === "active" ? active : resolved;
  const firstName = (user.name || "").split(/[\s.]/)[0];
  const abiertos  = active.length + pending.length;

  return (
    <div className="flex flex-col gap-6">
      {/* Bienvenida */}
      <section className="rounded-2xl bg-navy paw-pattern text-white p-6 sm:p-8 sm:pr-56 relative overflow-hidden">
        <MichiBuddy
          pose={abiertos > 0 ? "headset" : "sleep"} size={210}
          className="hidden sm:flex absolute right-4 -bottom-3" title="Michi te saluda"
        />
        <p className="text-sm text-white/70">Michi · Soporte TI con siete vidas</p>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight mt-1">{greeting()}, <span className="capitalize">{firstName}</span></h1>
        <p className="text-white/80 mt-2 max-w-lg">
          {abiertos > 0
            ? `Tienes ${abiertos} ticket${abiertos > 1 ? "s" : ""} en marcha y Michi los vigila de cerca. ¿Algo más no funciona? Cuéntaselo.`
            : "Todo en orden: no tienes tickets abiertos, así que Michi aprovecha para dormir la siesta. Si algo falla, despiértalo."}
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            onClick={onReport}
            className="h-11 px-5 rounded-xl bg-white text-navy font-semibold text-sm flex items-center gap-2 hover:bg-white/90 transition-colors shadow-lg"
          >
            <Plus size={18} strokeWidth={2.5} /> Reportar un problema
          </button>
          <button
            onClick={onForo}
            className="h-11 px-4 rounded-xl bg-white/10 border border-white/20 text-white font-semibold text-sm flex items-center gap-2 hover:bg-white/15 transition-colors"
          >
            <BookOpenCheck size={17} /> Buscar en el foro de soluciones
          </button>
        </div>
        <button
          onClick={() => setTip(t => { let n = pick(TIPS); while (n === t) n = pick(TIPS); return n; })}
          title="Otro consejo"
          className="mt-5 max-w-lg text-left text-sm rounded-xl bg-white/8 border border-white/10 px-3.5 py-2.5 flex items-start gap-2.5 hover:bg-white/12 transition-colors"
        >
          <Lightbulb size={16} className="text-accent flex-shrink-0 mt-0.5" />
          <span><b className="text-accent">Consejo de Michi:</b> <span className="text-white/85">{tip}</span></span>
        </button>
      </section>

      {/* Mis tickets */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-lg font-semibold text-ink tracking-tight whitespace-nowrap">Mis tickets</h2>
          <button onClick={refresh} title="Actualizar" className="w-8 h-8 rounded-lg text-muted hover:bg-hover flex items-center justify-center">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
          <div className="ml-auto flex p-1 rounded-xl bg-surface border border-line">
            {[["active", "Activos", active.length + pending.length], ["resolved", "Resueltos", resolved.length]].map(([key, label, n]) => (
              <button
                key={key} onClick={() => setTab(key)}
                className={`h-8 px-3 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${
                  tab === key ? "bg-brand-soft text-brand" : "text-muted hover:text-ink"
                }`}
              >
                {label}
                <span className={`text-[11px] px-1.5 rounded-full ${tab === key ? "bg-brand text-white" : "bg-subtle text-muted"}`}>{n}</span>
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-danger mb-3">{error}</p>}

        {loading && tickets.length === 0 && pending.length === 0 ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-faint" /></div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {/* Reportes "Otros" que el equipo aún está revisando */}
            {tab === "active" && pending.map(p => (
              <div key={p._id} className="bg-surface rounded-xl border border-dashed border-line-strong p-4 flex items-start gap-4">
                <CategoryBadge name={p.categoria} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-ink truncate">{p.categoria}</p>
                    <span className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-subtle text-muted border border-line">
                      <Hourglass size={11} /> En revisión
                    </span>
                  </div>
                  <p className="text-sm text-muted line-clamp-2 mt-0.5">{p.descripcion}</p>
                  <p className="text-xs text-faint mt-1.5">
                    Enviado el {shortDate(p.rawFecha)} · El equipo de soporte lo está clasificando
                  </p>
                </div>
              </div>
            ))}

            {list.map(t => (
              <button
                key={t._id} onClick={() => onOpenTicket(t._id)}
                className="group bg-surface rounded-xl border border-line p-4 flex items-start gap-4 text-left hover:border-brand/40 hover:shadow-md transition"
              >
                <CategoryBadge name={t.category} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-ink truncate group-hover:text-brand">{t.title}</p>
                    <span className="ml-auto flex-shrink-0"><StatusBadge status={t.status} /></span>
                  </div>
                  <p className="text-xs text-faint mt-0.5">{t.id} · {t.category} · creado el {shortDate(t.rawFecha)}</p>
                  {t.lastMessage && !t.lastMessage.startsWith("[Sistema]") && (
                    <p className={`text-sm mt-2 flex items-start gap-1.5 ${t.lastFromSupport ? "text-ink-2" : "text-muted"}`}>
                      <MessageCircle size={14} className={`mt-0.5 flex-shrink-0 ${t.lastFromSupport ? "text-brand" : "text-faint"}`} />
                      <span className="line-clamp-1">
                        <span className="font-semibold">{t.lastFromSupport ? "Soporte" : "Tú"}:</span> {t.lastMessage}
                      </span>
                    </p>
                  )}
                </div>
                <ChevronRight size={18} className="text-faint self-center group-hover:text-brand" />
              </button>
            ))}

            {list.length === 0 && (tab === "resolved" || pending.length === 0) && (
              <div className="bg-surface rounded-xl border border-line py-12 text-center">
                <Michi pose="sleep" size={104} className="mx-auto mb-2" />
                <p className="text-sm font-medium text-ink">
                  {tab === "active" ? "No tienes tickets abiertos. ¡Michi está orgulloso!" : "Aún no tienes tickets resueltos"}
                </p>
                {tab === "active" && (
                  <p className="text-sm text-muted mt-1">Si algo no funciona, pulsa <b>Reportar un problema</b>.</p>
                )}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
