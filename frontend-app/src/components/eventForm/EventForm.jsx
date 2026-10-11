import { Link } from 'react-router-dom';
import FormField from '../FormField.jsx';
import TimeField from '../TimeField.jsx';
import VenueSelect from '../VenueSelect.jsx';
import { localToday } from '../../constants/statuses.js';
import ImagePreview from './ImagePreview.jsx';

// Formulario de evento del CRUD de administración y de "Mi cuenta" del
// organizador. form = useEventForm(). Según el contexto:
// - organizerField: selector de organizador (solo administración).
// - lockSchedule: fecha y horarios visibles pero no editables (el organizador
//   solo cambia nombre, descripción, imágenes y agrega tipos de entrada).
// - adminLinks: links a los CRUD de lugares/tipos cuando faltan datos.
function EventForm({
  form,
  title,
  onSubmit,
  onCancel,
  submitting,
  submitLabel = 'Guardar',
  venueName,
  organizerField = null,
  lockSchedule = false,
  adminLinks = false,
  notice = null,
}) {
  const {
    formData,
    editing,
    venueId,
    venueTicketTypes,
    loadingTicketTypes,
    associatedTypeIds,
    fieldErrors,
    formError,
    coverPreview,
    bannerPreview,
    handleChange,
    handleVenueChange,
    toggleTicketType,
  } = form;

  const errorProps = (field) => ({ 'aria-invalid': Boolean(fieldErrors[field]) });

  return (
    <form className="form-card" onSubmit={onSubmit} noValidate>
      <h3>{title}</h3>

      {formError && (
        <p className="banner banner--error" role="alert">
          {formError}
        </p>
      )}
      {notice}

      <div className="image-preview-grid">
        <ImagePreview variant="cover" preview={coverPreview} />
        <ImagePreview variant="banner" preview={bannerPreview} />
      </div>

      {editing ? (
        <p className="form-note">
          Lugar: <strong>{venueName ?? `#${venueId}`}</strong>. El lugar no se puede cambiar porque las
          entradas ya generadas pertenecen a él.
          {lockSchedule && ' La fecha y los horarios tampoco se pueden modificar.'}
        </p>
      ) : (
        <div className={fieldErrors.venue ? 'field--invalid' : ''}>
          <VenueSelect value={venueId} onChange={handleVenueChange} autoSelectFirst={false} />
          {fieldErrors.venue && (
            <span className="field__error" role="alert">
              {fieldErrors.venue}
            </span>
          )}
        </div>
      )}

      {venueId != null && (
        <fieldset className={`form-fieldset ${fieldErrors.ticketTypes ? 'form-fieldset--invalid' : ''}`}>
          <legend>Tipos de entrada{editing ? ' (podés agregar nuevos)' : ''}</legend>
          {loadingTicketTypes ? (
            <p className="form-note">Cargando tipos de entrada...</p>
          ) : venueTicketTypes.length === 0 ? (
            <p className="form-note">
              Este lugar todavía no tiene tipos de entrada.
              {adminLinks && (
                <>
                  {' '}
                  <Link to="/tipos-de-entrada">Creá uno primero</Link>.
                </>
              )}
            </p>
          ) : (
            <>
              {venueTicketTypes.map((ticketType) => {
                const alreadyAdded = associatedTypeIds.includes(ticketType.idTicketType);
                return (
                  <label key={ticketType.idTicketType} className="field field--checkbox">
                    <input
                      type="checkbox"
                      checked={alreadyAdded || formData.ticketTypes.includes(ticketType.idTicketType)}
                      disabled={alreadyAdded}
                      onChange={() => toggleTicketType(ticketType.idTicketType)}
                    />
                    <span>
                      {ticketType.location} — {ticketType.quantity} entradas
                      {ticketType.isNumbered ? ' (numeradas)' : ''}
                      {alreadyAdded && <span className="tag">Ya agregado</span>}
                    </span>
                  </label>
                );
              })}
              <p className="form-note">
                {editing
                  ? 'Agregar tipos es opcional: al guardar se generan solo las entradas de los tipos nuevos. Los ya agregados no se pueden quitar.'
                  : 'Al guardar se generan automáticamente todas las entradas de los tipos elegidos, en estado Disponible.'}
              </p>
            </>
          )}
          {fieldErrors.ticketTypes && (
            <span className="field__error" role="alert">
              {fieldErrors.ticketTypes}
            </span>
          )}
        </fieldset>
      )}

      <FormField label="Nombre" error={fieldErrors.name}>
        <input name="name" value={formData.name} onChange={handleChange} {...errorProps('name')} />
      </FormField>

      <FormField label="Descripción" error={fieldErrors.description}>
        <textarea
          name="description"
          rows="3"
          value={formData.description}
          onChange={handleChange}
          {...errorProps('description')}
        />
      </FormField>

      <div className="form-grid">
        <FormField
          label="Imagen de portada (URL)"
          error={fieldErrors.coverImage}
          hint="Imagen de las tarjetas de eventos."
        >
          <input
            name="coverImage"
            type="url"
            placeholder="https://..."
            value={formData.coverImage}
            onChange={handleChange}
            {...errorProps('coverImage')}
          />
        </FormField>

        <FormField
          label="Imagen de banner (URL, opcional)"
          error={fieldErrors.banner}
          hint="Imagen horizontal del detalle del evento."
        >
          <input
            name="banner"
            type="url"
            placeholder="https://..."
            value={formData.banner}
            onChange={handleChange}
            {...errorProps('banner')}
          />
        </FormField>
      </div>

      <div className="form-grid">
        {lockSchedule ? (
          <>
            <FormField label="Fecha">
              <input type="date" value={formData.date} disabled />
            </FormField>
            <FormField label="Hora de inicio">
              <input value={formData.startTime} disabled />
            </FormField>
            <FormField label="Hora de fin">
              <input value={formData.endTime} disabled />
            </FormField>
          </>
        ) : (
          <>
            <FormField label="Fecha" error={fieldErrors.date}>
              <input
                name="date"
                type="date"
                min={localToday()}
                value={formData.date}
                onChange={handleChange}
                {...errorProps('date')}
              />
            </FormField>

            <TimeField
              label="Hora de inicio"
              name="startTime"
              value={formData.startTime}
              onChange={handleChange}
              error={fieldErrors.startTime}
            />

            <TimeField
              label="Hora de fin"
              name="endTime"
              value={formData.endTime}
              onChange={handleChange}
              error={fieldErrors.endTime}
              hint="Formato 24 h (HH:MM). Si es menor que la de inicio, el evento termina al día siguiente."
            />
          </>
        )}

        {organizerField}
      </div>

      <div className="form-actions">
        <button type="button" onClick={onCancel} disabled={submitting}>
          Cancelar
        </button>
        <button type="submit" className="btn btn--primary" disabled={submitting}>
          {submitting ? 'Guardando...' : submitLabel}
        </button>
      </div>
    </form>
  );
}

export default EventForm;
