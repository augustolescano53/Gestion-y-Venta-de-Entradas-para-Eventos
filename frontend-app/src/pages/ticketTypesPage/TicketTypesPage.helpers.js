export function ticketTypeToFormData(ticketType) {
  return {
    quantity: String(ticketType.quantity),
    location: ticketType.location,
    isNumbered: ticketType.isNumbered,
    price: String(Number(ticketType.price ?? 0)),
  };
}

// Devuelve el primer error encontrado o null.
export function validateTicketTypeForm(formData) {
  if (!formData.location.trim()) {
    return 'La ubicación es obligatoria.';
  }
  const quantity = Number(formData.quantity);
  if (!formData.quantity || !Number.isInteger(quantity) || quantity <= 0) {
    return 'La cantidad debe ser un número entero mayor a 0.';
  }
  const price = Number(formData.price);
  if (formData.price === '' || !Number.isFinite(price) || price < 0) {
    return 'El precio debe ser un número mayor o igual a 0.';
  }
  return null;
}

export function buildTicketTypePayload(formData) {
  return {
    quantity: Number(formData.quantity),
    location: formData.location.trim(),
    isNumbered: formData.isNumbered,
    price: Number(formData.price),
  };
}

export function deleteConfirmMessage(ticketType) {
  return `¿Seguro que querés eliminar el tipo de entrada "${ticketType.location}"? Esta acción no se puede deshacer.`;
}
