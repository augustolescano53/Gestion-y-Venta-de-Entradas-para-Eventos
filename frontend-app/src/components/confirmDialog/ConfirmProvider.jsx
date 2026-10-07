import { useCallback, useState } from 'react';
import { ConfirmContext } from './ConfirmContext.js';
import ConfirmDialog from './ConfirmDialog.jsx';

// Un único diálogo para toda la aplicación: cada página pide la confirmación
// con useConfirm() y espera la respuesta como si fuera window.confirm.
function ConfirmProvider({ children }) {
  const [request, setRequest] = useState(null);

  const confirm = useCallback(
    (options) => new Promise((resolve) => setRequest({ ...options, resolve })),
    [],
  );

  function answer(confirmed) {
    request.resolve(confirmed);
    setRequest(null);
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {request && (
        <ConfirmDialog
          title={request.title}
          message={request.message}
          confirmLabel={request.confirmLabel}
          cancelLabel={request.cancelLabel}
          onConfirm={() => answer(true)}
          onCancel={() => answer(false)}
        />
      )}
    </ConfirmContext.Provider>
  );
}

export default ConfirmProvider;
