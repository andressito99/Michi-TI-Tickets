import { AlertCircle, ChevronUp, Minus, ChevronDown } from "lucide-react";

// Prioridades: icono en círculo (como la referencia) y pill con texto
export const PRIORITIES = [
  { key: "urgent", label: "Urgente", Icon: AlertCircle, color: "text-danger",   ring: "border-danger",   pill: "bg-[#fde8e8] text-[#b42318] dark:bg-[#3b1616] dark:text-[#f59b93]" },
  { key: "high",   label: "Alta",    Icon: ChevronUp,   color: "text-[#ea580c]", ring: "border-[#ea580c]", pill: "bg-[#fff0e6] text-[#c2410c] dark:bg-[#3a2212] dark:text-[#fdba74]" },
  { key: "medium", label: "Media",   Icon: Minus,       color: "text-success",  ring: "border-success",  pill: "bg-[#e5f6ec] text-[#13773a] dark:bg-[#12331f] dark:text-[#6fd39a]" },
  { key: "low",    label: "Baja",    Icon: ChevronDown, color: "text-brand",    ring: "border-brand",    pill: "bg-brand-soft text-brand" },
];

const BY_KEY = Object.fromEntries(PRIORITIES.map(p => [p.key, p]));

/** Icono compacto para listas. */
export function PriorityIcon({ priority, size = 18 }) {
  const cfg = BY_KEY[priority] ?? BY_KEY.medium;
  const { Icon } = cfg;
  if (priority === "urgent") {
    return <AlertCircle size={size} strokeWidth={2.25} className={cfg.color} aria-label={`Prioridad ${cfg.label}`} />;
  }
  return (
    <span
      title={`Prioridad ${cfg.label}`}
      className={`inline-flex items-center justify-center rounded-full border-[1.75px] ${cfg.ring} ${cfg.color}`}
      style={{ width: size, height: size }}
    >
      <Icon size={size - 6} strokeWidth={2.75} />
    </span>
  );
}

export function PriorityBadge({ priority }) {
  const cfg = BY_KEY[priority] ?? BY_KEY.medium;
  const { Icon } = cfg;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold whitespace-nowrap ${cfg.pill}`}>
      <Icon size={11} strokeWidth={2.5} />
      {cfg.label}
    </span>
  );
}
