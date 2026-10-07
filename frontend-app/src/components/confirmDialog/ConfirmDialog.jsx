import { useEffect, useId, useRef } from 'react';
import './ConfirmDialog.css';

// Se abre con showModal(): el navegador bloquea el resto de la página y
// Escape cancela. Clic fuera del recuadro también cancela.
function ConfirmDialog({
  title = 'Confirmar acción',
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  onConfirm,
  onCancel,
}) {
  const dialogRef = useRef(null);
  const titleId = useId();
  const messageId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog.showModal();
    return () => dialog.close();
  }, []);

  function handleCancelEvent(event) {
    // Escape: se cierra desde React para resolver la confirmación.
    event.preventDefault();
    onCancel();
  }

  function handleBackdropClick(event) {
    if (event.target === dialogRef.current) onCancel();
  }

  return (
    <dialog
      ref={dialogRef}
      className="confirm-dialog"
      aria-labelledby={titleId}
      aria-describedby={messageId}
      onCancel={handleCancelEvent}
      onClick={handleBackdropClick}
    >
      <div className="confirm-dialog__body">
        <h3 id={titleId}>{title}</h3>
        <p id={messageId} className="confirm-dialog__message">
          {message}
        </p>
        <div className="form-actions">
          <button type="button" className="btn" onClick={onCancel} autoFocus>
            {cancelLabel}
          </button>
          <button type="button" className="btn btn--primary" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}

export default ConfirmDialog;
