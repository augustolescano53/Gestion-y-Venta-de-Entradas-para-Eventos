import { Link } from 'react-router-dom';
import EventBanner from '../event/EventBanner.jsx';
import { resolveId } from '../../shared/refs.helpers.js';
import { eventoPath } from '../../shared/routes.js';
import { formatEventDate, formatTime } from '../../shared/format.helpers.js';
import { CalendarIcon, LocationIcon } from './icons.jsx';

// Tarjeta de "Próximos eventos": toda la tarjeta lleva al detalle. La imagen
// es el banner completo o, si no tiene, la portada (EventBanner).
function EventCard({ event }) {
  return (
    <li>
      <Link className="ip-card" to={eventoPath(resolveId(event.venue), event.idEvent)}>
        <EventBanner event={event} variant="card" />
        <h3 className="ip-card__name">{event.name}</h3>
        <p className="ip-card__meta">
          <CalendarIcon className="ip-card__icon" />
          {formatEventDate(event.date)} · {formatTime(event.startTime)} h
        </p>
        {event.venue?.name && (
          <p className="ip-card__meta">
            <LocationIcon className="ip-card__icon" />
            {event.venue.name}
          </p>
        )}
      </Link>
    </li>
  );
}

export default EventCard;
