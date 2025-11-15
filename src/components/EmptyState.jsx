import '../styles/components/EmptyState.css';

export default function EmptyState({ title, description, actionLabel, onAction }) {
  return (
    <section className="empty-state">
      <h2 className="empty-state__title">{title}</h2>
      {description && <p className="empty-state__description">{description}</p>}
      {actionLabel && (
        <button type="button" className="empty-state__action" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </section>
  );
}
