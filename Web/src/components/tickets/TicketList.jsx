import { useState, useRef, useEffect } from "react";
import { Search, X, SlidersHorizontal, ChevronDown, Check, Clock, CheckCircle2, RefreshCw } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { PriorityIcon } from "./PriorityBadge";
import { Avatar } from "../ui/Avatar";
import { formatDuration } from "../../utils/ticketUtils";
import { Michi } from "../ui/Michi";

const FILTERS = [
  { key: "all",      label: "Tickets abiertos" },
  { key: "open",     label: "En proceso" },
  { key: "pending",  label: "Pendientes" },
  { key: "resolved", label: "Finalizados" },
  { key: "closed",   label: "Bloqueados" },
  { key: "urgent",   label: "Urgentes" },
];

// Color del reloj según cuánto tiempo lleva abierto el ticket
function elapsedStyle(status, rawFecha) {
  if (status === "resolved" || status === "closed") return { cls: "text-success", Icon: CheckCircle2 };
  if (!rawFecha) return { cls: "text-faint", Icon: Clock };
  const hours = (Date.now() - new Date(rawFecha)) / 3_600_000;
  if (hours < 4)  return { cls: "text-faint",       Icon: Clock };
  if (hours < 24) return { cls: "text-warning",     Icon: Clock };
  if (hours < 72) return { cls: "text-[#ea580c]",   Icon: Clock };
  return              { cls: "text-danger",      Icon: Clock };
}

export function shortDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "short", ...(sameYear ? {} : { year: "2-digit" }) });
}

function FilterMenu({ filter, setFilter, title }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const close = e => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const current = FILTERS.find(f => f.key === filter);
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 text-[15px] font-semibold text-ink hover:text-brand transition-colors"
      >
        {filter === "all" ? title : current?.label}
        <ChevronDown size={15} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute left-0 top-8 w-52 bg-surface rounded-xl border border-line shadow-xl z-30 py-1">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => { setFilter(f.key); setOpen(false); }}
              className="w-full px-3 py-2 text-sm text-left flex items-center gap-2 text-ink-2 hover:bg-hover"
            >
              <span className="w-4">{filter === f.key && <Check size={14} className="text-brand" />}</span>
              {f.key === "all" ? title : f.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function TicketList({
  title, tickets, selectedId, onSelect,
  filter, setFilter, agentFilter, setAgentFilter, agents,
  search, setSearch, loading, error, onRetry, className = "",
}) {
  const [showFilters, setShowFilters] = useState(agentFilter !== "all");

  return (
    <section className={`flex-shrink-0 bg-surface border-r border-line flex-col min-h-0 ${className}`}>
      {/* Cabecera */}
      <div className="px-4 pt-4 pb-3 flex items-center gap-2">
        <FilterMenu filter={filter} setFilter={setFilter} title={title} />
        <span className="text-xs text-faint font-medium">{tickets.length}</span>
        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={onRetry} title="Recargar"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:bg-hover transition-colors"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>
          {agents?.length > 0 && (
            <button
              onClick={() => setShowFilters(s => !s)} title="Filtros"
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                showFilters || agentFilter !== "all" ? "bg-brand-soft text-brand" : "text-muted hover:bg-hover"
              }`}
            >
              <SlidersHorizontal size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Búsqueda y filtros */}
      <div className="px-4 pb-3 flex flex-col gap-2 border-b border-line">
        <div className="flex items-center gap-2 h-9 px-3 rounded-lg border border-line-strong bg-field focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20 transition">
          <Search size={15} className="text-faint" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar tickets"
            className="flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-faint"
          />
          {search && (
            <button onClick={() => setSearch("")} className="text-faint hover:text-ink"><X size={14} /></button>
          )}
        </div>
        {showFilters && agents?.length > 0 && (
          <select
            value={agentFilter} onChange={e => setAgentFilter(e.target.value)}
            className="h-9 px-2.5 rounded-lg border border-line-strong bg-field text-sm text-ink-2 outline-none focus:border-brand"
          >
            <option value="all">Todos los agentes</option>
            {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        )}
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto thin-scroll">
        {error ? (
          <div className="p-4 text-sm text-danger">{error}</div>
        ) : loading && tickets.length === 0 ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-14 px-6">
            <Michi pose="magnifier" size={104} className="mx-auto mb-2" />
            <p className="text-sm text-muted">Michi no encontró tickets con este filtro</p>
          </div>
        ) : (
          tickets.map(t => {
            const active = t.id === selectedId;
            const { cls, Icon } = elapsedStyle(t.status, t.rawFecha);
            return (
              <button
                key={t._id}
                onClick={() => onSelect(t.id)}
                className={`w-full text-left px-4 py-3 border-b border-line relative transition-colors ${
                  active ? "bg-brand-soft" : "hover:bg-hover"
                }`}
              >
                {active && <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-brand" />}
                <div className="flex items-start gap-2">
                  <p className={`flex-1 text-sm font-semibold truncate ${active ? "text-brand" : "text-ink"}`}>{t.title}</p>
                  <span className="text-xs text-faint whitespace-nowrap pt-0.5">{shortDate(t.rawFecha)}</span>
                </div>
                <p className="text-xs text-muted truncate mt-0.5">{t.requester} · {t.category}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[11px] font-medium text-faint font-mono">{t.id}</span>
                  <div className="ml-auto flex items-center gap-1.5">
                    <StatusBadge status={t.status} />
                    <span title={`Abierto hace ${formatDuration(t.rawFecha)}`} className={cls}><Icon size={17} /></span>
                    <PriorityIcon priority={t.priority} />
                    <Avatar name={t.agent} size="xs" />
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </section>
  );
}
