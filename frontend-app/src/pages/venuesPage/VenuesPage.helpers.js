import { REQUIRED_FIELDS } from './VenuesPage.data.js';

export function venueToFormData(venue) {
  return {
    name: venue.name,
    street: venue.address.street,
    streetNumber: venue.address.streetNumber,
    postalCode: venue.address.postalCode,
    locality: venue.address.locality,
    province: venue.address.province,
    googleMapsUrl: venue.address.googleMapsUrl ?? '',
  };
}

// Devuelve el primer error encontrado o null.
export function validateVenueForm(formData) {
  for (const [field, message] of REQUIRED_FIELDS) {
    if (!formData[field].trim()) {
      return message;
    }
  }

  if (formData.googleMapsUrl.trim()) {
    try {
      const url = new URL(formData.googleMapsUrl.trim());
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        return 'El enlace de Google Maps debe empezar con http:// o https://.';
      }
    } catch {
      return 'El enlace de Google Maps no es una URL válida.';
    }
  }

  return null;
}

export function buildVenuePayload(formData) {
  return {
    name: formData.name.trim(),
    address: {
      street: formData.street.trim(),
      streetNumber: formData.streetNumber.trim(),
      postalCode: formData.postalCode.trim(),
      locality: formData.locality.trim(),
      province: formData.province.trim(),
      ...(formData.googleMapsUrl.trim()
        ? { googleMapsUrl: formData.googleMapsUrl.trim() }
        : {}),
    },
  };
}

export function deleteConfirmMessage(venue) {
  return `¿Seguro que querés eliminar "${venue.name}"? Esta acción no se puede deshacer.`;
}
