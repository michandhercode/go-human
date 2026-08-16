// Shared shell for the compact, square-ish dashboard destination cards
// (Journal, Life Stats). Purely a visual entry point — navigation is
// whatever the caller's onClick already does (the existing openJournal /
// openLifeStats handlers in App.jsx), so no new state or routing lives
// here.
function DashboardCard({ icon, title, subtitle, actionLabel, ariaLabel, onClick, accent }) {
  return (
    <button
      type="button"
      className={`pixel-frame dashboard-card dashboard-card--${accent}`}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      {icon}
      <span className="dashboard-card-title">{title}</span>
      {subtitle && <span className="dashboard-card-subtitle">{subtitle}</span>}
      {actionLabel && <span className="dashboard-card-action">{actionLabel}</span>}
    </button>
  );
}

export default DashboardCard;