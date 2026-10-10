import { useEffect, useId, useRef } from 'react';

// Diálogo modal genérico (mismo mecanismo que ConfirmDialog): showModal()
// bloquea la página de fondo, que sigue visible detrás del overlay. Escape,
// el botón ✕ y el clic fuera del recuadro llaman a onClose. Con
// closeOnBackdrop={false} el clic afuera no cierra (para no perder lo cargado
// en un formulario).
function Modal({ title, onClose, closeOnBackdrop = true, children }) {
  const dialogRef = useRef(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog.showModal();
    return () => dialog.close();
  }, []);

  function handleCancelEvent(event) {
    event.preventDefault();
    onClose();
  }

  function handleBackdropClick(event) {
    if (closeOnBackdrop && event.target === dialogRef.current) onClose();
  }

  return (
    <dialog
      ref={dialogRef}
      className="modal"
      aria-labelledby={title ? titleId : undefined}
      onCancel={handleCancelEvent}
      onClick={handleBackdropClick}
    >
      <div className="modal__body">
        <button type="button" className="modal__close" aria-label="Cerrar" onClick={onClose}>
          ✕
        </button>
        {title && <h3 id={titleId}>{title}</h3>}
        {children}
      </div>
    </dialog>
  );
}

export default Modal;
