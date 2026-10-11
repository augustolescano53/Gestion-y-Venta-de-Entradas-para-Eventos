import { useEffect, useRef, useState } from 'react';
import { getTicketTypes } from '../../api/ticketTypes.js';
import { EMPTY_FORM } from '../../pages/eventsPage/EventsPage.data.js';
import { RELATED_FIELDS, validateEventForm } from '../../validation/eventForm.js';
import { useImagePreview } from './useImagePreview.js';

// Estado y reglas del formulario de evento, compartidos por el CRUD de
// administración y por "Mi cuenta" del organizador. requireOrganizer es false
// cuando el evento queda a nombre del organizador que inició sesión.
export function useEventForm({ requireOrganizer = true } = {}) {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [original, setOriginal] = useState(null);
  const [venueId, setVenueId] = useState(null);
  const [venueTicketTypes, setVenueTicketTypes] = useState([]);
  const [associatedTypeIds, setAssociatedTypeIds] = useState([]);
  const [loadingTicketTypes, setLoadingTicketTypes] = useState(false);
  const latestVenueRequest = useRef(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [formError, setFormError] = useState(null);

  const coverPreview = useImagePreview(formData.coverImage);
  const bannerPreview = useImagePreview(formData.banner);
  const editing = Boolean(original);

  function validationOptions(nextVenueId = venueId) {
    return {
      editing,
      original,
      venueId: nextVenueId,
      requireOrganizer,
      imageStatus: { coverImage: coverPreview.status, banner: bannerPreview.status },
    };
  }

  async function loadVenueTicketTypes(nextVenueId) {
    latestVenueRequest.current = nextVenueId;
    setVenueTicketTypes([]);
    setLoadingTicketTypes(true);
    try {
      const data = await getTicketTypes(nextVenueId);
      // Si mientras tanto se eligió otro lugar, esta respuesta ya no sirve.
      if (latestVenueRequest.current === nextVenueId) setVenueTicketTypes(data);
    } catch {
      if (latestVenueRequest.current === nextVenueId) setVenueTicketTypes([]);
    } finally {
      if (latestVenueRequest.current === nextVenueId) setLoadingTicketTypes(false);
    }
  }

  // Después del primer intento de guardar, cada cambio vuelve a validar el
  // campo (y los que dependen de él) para actualizar o quitar su mensaje.
  function revalidate(nextData, fields, nextVenueId = venueId) {
    if (!submitAttempted) return;
    const errors = validateEventForm(nextData, validationOptions(nextVenueId));
    setFieldErrors((previous) => {
      const next = { ...previous };
      for (const name of fields) {
        if (errors[name]) next[name] = errors[name];
        else delete next[name];
      }
      return next;
    });
  }

  // La carga de las imágenes termina después de escribir la URL: su mensaje
  // se actualiza cuando cambia el resultado.
  useEffect(() => {
    revalidate(formData, ['coverImage', 'banner']);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coverPreview.status, bannerPreview.status]);

  // Carga el formulario: vacío para crear o con un evento para editar.
  function reset({ data = EMPTY_FORM, venue = null, event = null } = {}) {
    setFormData(data);
    setOriginal(event);
    setVenueId(venue);
    setVenueTicketTypes([]);
    setAssociatedTypeIds([]);
    setFieldErrors({});
    setSubmitAttempted(false);
    setFormError(null);
    if (venue != null) loadVenueTicketTypes(venue);
  }

  function handleChange(event) {
    const { name, value } = event.target;
    const nextData = { ...formData, [name]: value };
    setFormData(nextData);
    revalidate(nextData, RELATED_FIELDS[name] ?? [name]);
  }

  // Los tipos de entrada pertenecen a un único lugar (y sus ids se repiten
  // entre lugares): al cambiar de lugar, ninguno de los elegidos sigue
  // correspondiendo.
  function handleVenueChange(nextVenueId) {
    setVenueId(nextVenueId);
    const nextData = { ...formData, ticketTypes: [] };
    setFormData(nextData);
    revalidate(nextData, RELATED_FIELDS.venue, nextVenueId);
    loadVenueTicketTypes(nextVenueId);
  }

  function toggleTicketType(idTicketType) {
    const nextData = {
      ...formData,
      ticketTypes: formData.ticketTypes.includes(idTicketType)
        ? formData.ticketTypes.filter((id) => id !== idTicketType)
        : [...formData.ticketTypes, idTicketType],
    };
    setFormData(nextData);
    revalidate(nextData, ['ticketTypes']);
  }

  // Marca el intento de guardar y devuelve si el formulario es válido.
  function validate() {
    setSubmitAttempted(true);
    const errors = validateEventForm(formData, validationOptions());
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setFormError('Revisá los campos marcados.');
      return false;
    }
    setFormError(null);
    return true;
  }

  // Errores del backend: por campo si los envía, más el mensaje general.
  function showServerError(error) {
    setFieldErrors(error.fieldErrors ?? {});
    setFormError(error.message);
  }

  return {
    formData,
    original,
    editing,
    venueId,
    venueTicketTypes,
    loadingTicketTypes,
    associatedTypeIds,
    setAssociatedTypeIds,
    fieldErrors,
    formError,
    setFormError,
    coverPreview,
    bannerPreview,
    reset,
    handleChange,
    handleVenueChange,
    toggleTicketType,
    validate,
    showServerError,
  };
}
