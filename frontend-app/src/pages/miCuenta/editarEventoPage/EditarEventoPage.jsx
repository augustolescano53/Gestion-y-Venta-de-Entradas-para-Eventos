import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getOrganizerEvent, updateOrganizerEvent } from '../../../api/organizers.js';
import EventForm from '../../../components/eventForm/EventForm.jsx';
import { useEventForm } from '../../../components/eventForm/useEventForm.js';
import { ErrorState, LoadingState } from '../../../components/miCuenta/AccountStates.jsx';
import OrganizerOnly from '../../../components/miCuenta/OrganizerOnly.jsx';
import { getCurrentUser } from '../../../shared/currentUser.js';
import { MI_CUENTA_PATHS } from '../../../shared/routes.js';
import {
  buildOrganizerEventUpdate,
  eventToFormData,
  updatedEventMessage,
} from '../../eventsPage/EventsPage.helpers.js';
import { parseMisEventoId } from '../miCuenta.helpers.js';
import { canModify } from '../misEventosOrganizadorPage/MisEventosOrganizadorPage.helpers.js';

const MESSAGES = {
  invalidId: 'El identificador del evento no es válido.',
  notFound: 'El evento no existe.',
  locked: 'Este evento ya no se puede editar: está cancelado o finalizado.',
  loadError: 'No pudimos cargar el evento. Intentá nuevamente.',
};

function BackLink() {
  return (
    <Link to={MI_CUENTA_PATHS.misEventos} className="card__link mb-4 inline-block">
      ← Volver a Mis eventos
    </Link>
  );
}

// Edición desde "Mi cuenta": nombre, descripción, imágenes y tipos de entrada
// nuevos. El lugar, la fecha, los horarios y el organizador quedan fijos.
function EditarEventoForm() {
  const { eventoId } = useParams();
  const key = parseMisEventoId(eventoId);
  const navigate = useNavigate();
  const form = useEventForm({ requireOrganizer: false });
  const { id: organizerId } = getCurrentUser();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(Boolean(key));
  const [error, setError] = useState(key ? null : MESSAGES.invalidId);
  const [submitting, setSubmitting] = useState(false);

  async function loadEvent() {
    if (!key) return;
    setLoading(true);
    setError(null);
    try {
      const detail = await getOrganizerEvent(organizerId, key.venue, key.event);
      setEvent(detail);
      if (canModify(detail)) {
        form.reset({ data: eventToFormData(detail), venue: key.venue, event: detail });
        form.setAssociatedTypeIds(detail.ticketTypeIds ?? []);
      }
    } catch (loadError) {
      setError(loadError.status === 404 ? MESSAGES.notFound : MESSAGES.loadError);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEvent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventoId, organizerId]);

  async function handleSubmit(submitEvent) {
    submitEvent.preventDefault();
    if (submitting || !form.validate()) return;

    setSubmitting(true);
    try {
      const updated = await updateOrganizerEvent(
        organizerId,
        key.venue,
        key.event,
        buildOrganizerEventUpdate(form.formData),
      );
      toast.success(updatedEventMessage(updated));
      navigate(MI_CUENTA_PATHS.misEventos);
    } catch (saveError) {
      form.showServerError(saveError);
      setSubmitting(false);
    }
  }

  if (loading) return <LoadingState message="Cargando el evento..." />;

  if (error || !canModify(event)) {
    return (
      <section>
        <BackLink />
        <ErrorState
          message={error ?? MESSAGES.locked}
          onRetry={error === MESSAGES.loadError ? loadEvent : undefined}
        />
      </section>
    );
  }

  return (
    <section>
      <BackLink />
      <EventForm
        form={form}
        title={`Editar "${event.name}"`}
        onSubmit={handleSubmit}
        onCancel={() => navigate(MI_CUENTA_PATHS.misEventos)}
        submitting={submitting}
        submitLabel="Guardar"
        venueName={event.venue?.name}
        lockSchedule
      />
    </section>
  );
}

function EditarEventoPage() {
  return (
    <OrganizerOnly>
      <EditarEventoForm />
    </OrganizerOnly>
  );
}

export default EditarEventoPage;
