export function PlaceholderView({ icon: Icon, title, subtitle }) {
  return (
    <div className="bg-surface rounded-xl border border-line p-14 text-center">
      <Icon size={36} className="mx-auto mb-3 text-faint" />
      <p className="text-sm font-semibold text-ink mb-1">{title}</p>
      <p className="text-xs text-muted">{subtitle}</p>
    </div>
  );
}
