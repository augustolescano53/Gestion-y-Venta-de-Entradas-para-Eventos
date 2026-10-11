import { useState } from 'react';
import { EVENT_STATUS, eventStatusLabel } from '../../constants/statuses.js';
import { formatEventDate, formatTime } from '../../shared/format.helpers.js';
import { venueAddress } from '../../pages/detalleEventoPage/DetalleEventoPage.helpers.js';

// Tarjeta del evento del detalle público (/eventos/:id), también usada en el
// panel de "Mis eventos" del organizador. La portada se muestra entera
// (contain) sobre una copia desenfocada que rellena los costados: sirve para
// cualquier proporción. showEndTime agrega la hora de fin.
function EventInfoCard({ event, showEndTime = false, className = '' }) {
  const [coverFailed, setCoverFailed] = useState(false);
  const address = venueAddress(event.venue);

  return (
    <aside className={`event-card ${className}`.trim()}>
      <div className="event-cover">
        {event.coverImage && !coverFailed ? (
          <>
            <img className="event-cover__bg" src={event.coverImage} alt="" aria-hidden="true" />
            <img
              className="event-cover__img"
              src={event.coverImage}
              alt={event.name}
              onError={() => setCoverFailed(true)}
            />
          </>
        ) : (
          <span className="event-cover__fallback">{event.name}</span>
        )}
      </div>

      <div className="event-info">
        <div className="flex flex-wrap items-center gap-3">
          <h2>{event.name}</h2>
          {event.status !== EVENT_STATUS.SCHEDULED && (
            <span className={`status-badge status-badge--${event.status}`}>{eventStatusLabel(event.status)}</span>
          )}
        </div>
        <p className="event-info__meta">
          {formatEventDate(event.date)} · {formatTime(event.startTime)}
          {showEndTime && ` a ${formatTime(event.endTime)}`} h
        </p>
        {event.venue?.name && (
          <p className="event-info__meta">
            {event.venue.name}
            {address && ` — ${address}`}
          </p>
        )}
        {event.description && <p className="event-info__description">{event.description}</p>}
        {event.organizer?.firstName && (
          <p className="event-info__meta">
            Organiza: {event.organizer.firstName} {event.organizer.lastName}
          </p>
        )}
      </div>
    </aside>
  );
}

export default EventInfoCard;
