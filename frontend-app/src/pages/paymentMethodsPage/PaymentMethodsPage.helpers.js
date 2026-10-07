// Devuelve el error encontrado o null.
export function validatePaymentMethodForm(formData) {
  if (!formData.type.trim()) {
    return 'El tipo de medio de pago es obligatorio.';
  }
  return null;
}

export function buildPaymentMethodPayload(formData) {
  return { type: formData.type.trim() };
}

export function deleteConfirmMessage(paymentMethod) {
  return `¿Seguro que querés eliminar "${paymentMethod.type}"? Esta acción no se puede deshacer.`;
}
