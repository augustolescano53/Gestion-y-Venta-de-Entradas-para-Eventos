// Estados comunes de las páginas de "Mi cuenta".

export function LoadingState({ message = 'Cargando...' }) {
  return (
    <p className="page-note" role="status">
      {message}
    </p>
  );
}

export function EmptyState({ message, children }) {
  return (
    <div className="card card--center">
      <p>{message}</p>
      {children}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <p className="banner banner--error" role="alert">
      {message}{' '}
      {onRetry && (
        <button type="button" className="btn" onClick={onRetry}>
          Reintentar
        </button>
      )}
    </p>
  );
}
