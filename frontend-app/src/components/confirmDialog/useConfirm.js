import { useContext } from 'react';
import { ConfirmContext } from './ConfirmContext.js';

// Devuelve confirm({ title, message, confirmLabel, cancelLabel }), que
// resuelve true si el usuario acepta y false si cancela.
export function useConfirm() {
  const confirm = useContext(ConfirmContext);
  if (!confirm) {
    throw new Error('useConfirm tiene que usarse dentro de <ConfirmProvider>.');
  }
  return confirm;
}
