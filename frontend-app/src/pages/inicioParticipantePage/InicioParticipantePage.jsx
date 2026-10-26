import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getAllEvents } from '../../api/events.js';
import BannerCarousel from '../../components/inicioParticipante/BannerCarousel.jsx';
import EventCard from '../../components/inicioParticipante/EventCard.jsx';
import { useViewportWidth } from '../../components/inicioParticipante/useViewportWidth.js';
import { EmptyState, ErrorState, LoadingState } from '../../components/miCuenta/AccountStates.jsx';
import { PARTICIPANTE_PATHS } from '../../shared/routes.js';
import { carouselEvents, eventKeyOf, filterBySearch, upcomingEvents } from './InicioParticipantePage.helpers.js';
import './InicioParticipantePage.css';

// Inicio del participante (/participante/inicio). Los visitantes sin sesión
// también lo ven; a un organizador lo frena ParticipantOnly en la ruta.
function InicioParticipantePage() {
  const viewportWidth = useViewportWidth();
  const [searchParams] = useSearchParams();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setEvents(await getAllEvents());
    } catch {
      setError('No pudimos cargar los eventos. Intentá nuevamente.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // ?q= viene del buscador del Header: muestra los resultados en lugar del
  // carrusel.
  const query = (searchParams.get('q') ?? '').trim();
  const carousel = carouselEvents(events);
  const upcoming = filterBySearch(upcomingEvents(events), query);

  // El ancho medido (sin la barra de scroll) permite que el carrusel y la
  // grilla salgan del contenedor angosto del layout sin desbordar la página.
  return (
    <div className="ip-page" style={{ '--ip-vw': `${viewportWidth}px` }}>
      {loading ? (
        <LoadingState message="Cargando eventos..." />
      ) : error ? (
        <ErrorState message={error} onRetry={loadEvents} />
      ) : (
        <>
          {!query && <BannerCarousel events={carousel} />}

          <section className="ip-section" aria-labelledby="ip-upcoming-title">
            <h2 id="ip-upcoming-title" className="ip-section__title">
              {query ? `Resultados para "${query}"` : 'Próximos eventos'}
            </h2>
            {query && (
              <Link to={PARTICIPANTE_PATHS.inicio} className="ip-section__clear">
                Ver todos los eventos
              </Link>
            )}
            {upcoming.length === 0 ? (
              <EmptyState
                message={
                  query
                    ? `No encontramos eventos para "${query}".`
                    : 'Por ahora no hay eventos próximos. Volvé pronto.'
                }
              />
            ) : (
              <ul className="ip-grid">
                {upcoming.map((event) => (
                  <EventCard key={eventKeyOf(event)} event={event} />
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}

export default InicioParticipantePage;
