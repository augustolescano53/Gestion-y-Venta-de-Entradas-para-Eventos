import { localNowTime, localToday } from '../constants/statuses.js';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

// URL absoluta http o https (mismo criterio que backend/src/shared/url.ts).
export function isHttpUrl(value) {
  try {
    const url = new URL(value.trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

// Estados de la vista previa de una imagen (components/eventForm/useImagePreview.js).
export const IMAGE_STATUS = {
  EMPTY: 'empty',
  INVALID: 'invalid',
  LOADING: 'loading',
  LOADED: 'loaded',
  ERROR: 'error',
};

// Error de una URL de imagen según su vista previa. La URL con formato
// incorrecto se distingue de una imagen que no se pudo cargar.
function imageError(status) {
  if (status === IMAGE_STATUS.INVALID) return 'Ingresá una URL válida (http o https).';
  if (status === IMAGE_STATUS.ERROR) return 'No se pudo cargar una imagen desde esa URL.';
  if (status === IMAGE_STATUS.LOADING) return 'Esperá a que termine de cargar la imagen.';
  return null;
}

// Mismas reglas que valida el backend (event.controller.ts), más la carga de
// las imágenes (imageStatus: { coverImage, banner }). Devuelve todos los
// errores a la vez: { campo: mensaje }. requireOrganizer es false cuando el
// evento queda a nombre del organizador que inició sesión.
export function validateEventForm(
  data,
  { editing = false, original = null, venueId = null, requireOrganizer = true, imageStatus = {} } = {},
) {
  const errors = {};

  if (!editing && venueId == null) errors.venue = 'Elegí un lugar.';
  if (!data.name.trim()) errors.name = 'El nombre del evento es obligatorio.';
  if (!data.description.trim()) errors.description = 'La descripción es obligatoria.';
  if (!data.coverImage.trim()) errors.coverImage = 'La imagen de portada es obligatoria.';
  else if (!isHttpUrl(data.coverImage)) errors.coverImage = imageError(IMAGE_STATUS.INVALID);
  else if (imageError(imageStatus.coverImage)) errors.coverImage = imageError(imageStatus.coverImage);

  // El banner es opcional.
  if (data.banner.trim()) {
    if (!isHttpUrl(data.banner)) errors.banner = imageError(IMAGE_STATUS.INVALID);
    else if (imageError(imageStatus.banner)) errors.banner = imageError(imageStatus.banner);
  }

  if (!data.date) errors.date = 'La fecha es obligatoria.';
  else if (!DATE_PATTERN.test(data.date)) errors.date = 'La fecha no es válida.';

  if (!data.startTime) errors.startTime = 'La hora de inicio es obligatoria.';
  else if (!TIME_PATTERN.test(data.startTime)) errors.startTime = 'La hora de inicio no es válida: usá el formato 24 h HH:MM (00:00 a 23:59).';

  if (!data.endTime) errors.endTime = 'La hora de fin es obligatoria.';
  else if (!TIME_PATTERN.test(data.endTime)) errors.endTime = 'La hora de fin no es válida: usá el formato 24 h HH:MM (00:00 a 23:59).';
  else if (data.endTime === data.startTime) errors.endTime = 'La hora de fin debe ser distinta de la hora de inicio.';

  if (requireOrganizer && !data.organizer) errors.organizer = 'Elegí un organizador.';

  if (!editing && data.ticketTypes.length === 0) {
    errors.ticketTypes = 'Elegí al menos un tipo de entrada.';
  }

  // Al editar, un evento que ya empezó se puede guardar mientras no se
  // cambie su inicio.
  const startChanged =
    !editing || data.date !== original.date || data.startTime !== original.startTime.slice(0, 5);
  if (startChanged && !errors.date && !errors.startTime) {
    const today = localToday();
    if (`${data.date} ${data.startTime}` <= `${today} ${localNowTime()}`) {
      if (data.date < today) errors.date = 'La fecha no puede ser anterior a hoy.';
      else errors.startTime = 'La hora de inicio ya pasó. Elegí un horario futuro.';
    }
  }

  return errors;
}

// Campos cuyo error depende de otros: al cambiar uno, se revalidan todos.
export const RELATED_FIELDS = {
  date: ['date', 'startTime', 'endTime'],
  startTime: ['date', 'startTime', 'endTime'],
  endTime: ['date', 'startTime', 'endTime'],
  venue: ['venue', 'ticketTypes'],
};
