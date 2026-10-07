function FormField({ label, error, hint, className = '', children }) {
  return (
    <label className={`field ${error ? 'field--invalid' : ''} ${className}`.trim()}>
      <span>{label}</span>
      {children}
      {hint && !error && <span className="field__hint">{hint}</span>}
      {error && (
        <span className="field__error" role="alert">
          {error}
        </span>
      )}
    </label>
  );
}

export default FormField;
