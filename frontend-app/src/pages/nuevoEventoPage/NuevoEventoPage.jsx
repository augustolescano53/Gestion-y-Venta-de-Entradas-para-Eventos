import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { createOrganizerEvent } from '../../api/organizers.js';
import EventForm from '../../components/eventForm/EventForm.jsx';
import { useEventForm } from '../../components/eventForm/useEventForm.js';
import OrganizerOnly from '../../components/OrganizerOnly.jsx';
import { getCurrentUser } from '../../shared/currentUser.js';
import { ORGANIZADOR_PATHS } from '../../shared/routes.js';
import { SUCCESS_MESSAGES } from '../eventsPage/EventsPage.consts.js';
import { buildOrganizerEventCreate } from '../eventsPage/EventsPage.helpers.js';

// Alta de un evento desde "Mi cuenta": mismo formulario y validaciones que
// el CRUD de administración, sin selector de organizador (el backend lo
// asigna al organizador de la sesión).
function NuevoEventoForm() {
  const navigate = useNavigate();
  const form = useEventForm({ requireOrganizer: false });
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting || !form.validate()) return;

    setSubmitting(true);
    try {
      await createOrganizerEvent(getCurrentUser().id, form.venueId, buildOrganizerEventCreate(form.formData));
      toast.success(SUCCESS_MESSAGES.created);
      navigate(ORGANIZADOR_PATHS.inicio);
    } catch (error) {
      form.showServerError(error);
      setSubmitting(false);
    }
  }

  return (
    <EventForm
      form={form}
      title="Nuevo evento"
      onSubmit={handleSubmit}
      onCancel={() => navigate(ORGANIZADOR_PATHS.inicio)}
      submitting={submitting}
      submitLabel="Crear evento"
    />
  );
}

function NuevoEventoPage() {
  return (
    <OrganizerOnly>
      <NuevoEventoForm />
    </OrganizerOnly>
  );
}

export default NuevoEventoPage;
