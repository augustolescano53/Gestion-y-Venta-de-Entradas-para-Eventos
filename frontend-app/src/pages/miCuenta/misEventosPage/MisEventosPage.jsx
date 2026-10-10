import { useEffect, useState } from 'react';
import { getVenues } from '../../../api/venues.js';
import { EmptyState, ErrorState, LoadingState } from '../../../components/miCuenta/AccountStates.jsx';
import PurchasedEventCard from '../../../components/miCuenta/PurchasedEventCard.jsx';
import { getCurrentParticipantId } from '../../../shared/currentUser.js';
import { getVenueName } from '../../ticketsPage/TicketsPage.helpers.js';
import { eventsFromTickets, getAllParticipantTickets, hasEventEnded, sortByDate } from '../miCuenta.helpers.js';

const TABS = [
  { id: 'upcoming', label: 'Próximos', empty: 'No tenés eventos próximos.' },
  { id: 'past', label: 'Anteriores', empty: 'No tenés eventos anteriores.' },
];

function tabClass(active) {
  const base = 'rounded-full px-4 py-2 text-sm font-semibold';
  return active ? `${base} border-transparent bg-sangria text-crema` : base;
}

function MisEventosPage() {
  const participantId = getCurrentParticipantId();

  const [events, setEvents] = useState([]);
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('upcoming');

  async function loadEvents() {
    setLoading(true);
    setError(null);
    try {
      const [tickets, venueList] = await Promise.all([
        getAllParticipantTickets(participantId),
        // El nombre del lugar es un dato extra: si falla se muestra "Lugar #id".
        getVenues().catch(() => []),
      ]);
      setEvents(eventsFromTickets(tickets));
      setVenues(venueList);
    } catch {
      setError('No pudimos cargar tus eventos. Intentá nuevamente.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [participantId]);

  const upcoming = sortByDate(events.filter((event) => !hasEventEnded(event)));
  const past = sortByDate(events.filter(hasEventEnded), true);
  const visible = activeTab === 'upcoming' ? upcoming : past;
  const counts = { upcoming: upcoming.length, past: past.length };

  return (
    <section>
      <div className="page-toolbar">
        <h2>Mis eventos</h2>
      </div>

      {loading ? (
        <LoadingState message="Cargando tus eventos..." />
      ) : error ? (
        <ErrorState message={error} onRetry={loadEvents} />
      ) : events.length === 0 ? (
        <EmptyState message="Todavía no tenés eventos." />
      ) : (
        <>
          <div className="mb-5 flex flex-wrap gap-2" role="group" aria-label="Filtrar eventos">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={tabClass(activeTab === tab.id)}
                aria-pressed={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label} ({counts[tab.id]})
              </button>
            ))}
          </div>

          {visible.length === 0 ? (
            <EmptyState message={TABS.find((tab) => tab.id === activeTab).empty} />
          ) : (
            <ul className="card-list">
              {visible.map((event) => (
                <PurchasedEventCard
                  key={`${event.venueId}-${event.idEvent}`}
                  event={event}
                  venueName={getVenueName(venues, event.venueId)}
                />
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}

export default MisEventosPage;
