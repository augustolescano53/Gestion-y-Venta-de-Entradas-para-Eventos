import { useState } from 'react';
import { Link } from 'react-router-dom';
import { eventStatusLabel } from '../../constants/statuses.js';
import { misEventoPath } from '../../shared/routes.js';
import { formatDate, formatTime } from '../../pages/miCuenta/miCuenta.helpers.js';

// Tarjeta de "Mis eventos": solo lo necesario para reconocer el evento.
function PurchasedEventCard({ event, venueName }) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <li>
      <Link
        to={misEventoPath(event.venueId, event.idEvent)}
        className="flex h-full flex-col overflow-hidden rounded-card border-2 border-celeste bg-crema text-tinta no-underline shadow-card transition-transform hover:-translate-y-0.5"
      >
        {event.coverImage && !imageFailed ? (
          <img
            src={event.coverImage}
            alt=""
            className="h-40 w-full object-cover"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="flex h-40 items-center justify-center bg-sangria px-4 text-center text-lg font-bold text-crema">
            {event.name}
          </div>
        )}
        <div className="flex flex-1 flex-col gap-1 p-4">
          <h3>{event.name}</h3>
          <p className="m-0 text-sm text-tinta-muted first-letter:uppercase">
            {formatDate(event.date)} · {formatTime(event.startTime)} h
          </p>
          <p className="m-0 text-sm text-tinta-muted">{venueName}</p>
          <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-2">
            <span className={`status-badge status-badge--${event.status}`}>{eventStatusLabel(event.status)}</span>
            <span className="text-sm font-semibold text-sangria">
              {event.ticketCount === 1 ? '1 entrada' : `${event.ticketCount} entradas`} →
            </span>
          </div>
        </div>
      </Link>
    </li>
  );
}

export default PurchasedEventCard;
