// Estados del ticket: etiqueta, descripción y estilos (pill suave + color sólido)
export const STATUSES = [
  { key: "open",     label: "En proceso", hint: "Se está trabajando", pill: "bg-[#e8f1fe] text-[#1f5fc9] dark:bg-[#16294a] dark:text-[#8ab4f8]", solid: "bg-[#2563eb]" },
  { key: "pending",  label: "Pendiente",  hint: "Esperando respuesta", pill: "bg-[#fdf3e1] text-[#a15c07] dark:bg-[#3a2a10] dark:text-[#f5c26b]", solid: "bg-warning" },
  { key: "resolved", label: "Finalizado", hint: "Resuelto",            pill: "bg-[#e5f6ec] text-[#13773a] dark:bg-[#12331f] dark:text-[#6fd39a]", solid: "bg-success" },
  { key: "closed",   label: "Bloqueado",  hint: "No se puede avanzar", pill: "bg-[#fde8e8] text-[#b42318] dark:bg-[#3b1616] dark:text-[#f59b93]", solid: "bg-danger" },
];

export const STATUS_LABELS = Object.fromEntries(STATUSES.map(s => [s.key, s.label]));
const BY_KEY = Object.fromEntries(STATUSES.map(s => [s.key, s]));

export function StatusBadge({ status }) {
  const cfg = BY_KEY[status] ?? BY_KEY.open;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold whitespace-nowrap ${cfg.pill}`}>
      {cfg.label}
    </span>
  );
}
