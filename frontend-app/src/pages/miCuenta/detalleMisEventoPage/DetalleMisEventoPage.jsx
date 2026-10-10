import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getEvent } from '../../../api/events.js';
import { getParticipant } from '../../../api/participants.js';
import { getPaymentMethods } from '../../../api/paymentMethods.js';
import { EmptyState, ErrorState, LoadingState } from '../../../components/miCuenta/AccountStates.jsx';
import TicketItem from '../../../components/miCuenta/TicketItem.jsx';
import { eventStatusLabel } from '../../../constants/statuses.js';
import { getCurrentParticipantId } from '../../../shared/currentUser.js';
import { MI_CUENTA_PATHS } from '../../../shared/routes.js';
import { getPaymentMethodName } from '../../ticketsPage/TicketsPage.helpers.js';
import {
  formatAddress,
  formatDate,
  formatDateTime,
  formatTime,
  getAllParticipantTickets,
  groupPurchases,
  parseMisEventoId,
} from '../miCuenta.helpers.js';

const MESSAGES = {
  invalidId: 'El identificador del evento no es válido.',
  notFound: 'El evento solicitado no existe.',
  noTickets: 'No tenés entradas asociadas a este evento.',
  loadError: 'No pudimos cargar la información del evento. Intentá nuevamente.',
};

function BackLink() {
  return (
    <Link to={MI_CUENTA_PATHS.misEventos} className="card__link mb-4 inline-block">
      ← Volver a Mis eventos
    </Link>
  );
}

function EventHeader({ event }) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <header className="mb-6 overflow-hidden rounded-card border border-sangria/25 bg-crema shadow-card sm:flex">
      {event.coverImage && !imageFailed && (
        <img
          src={event.coverImage}
          alt=""
          className="h-48 w-full object-cover sm:h-auto sm:w-64"
          onError={() => setImageFailed(true)}
        />
      )}
      <div className="flex flex-1 flex-col gap-2 border-t-8 border-sangria p-5 sm:border-t-0 sm:border-l-8">
        <span className={`status-badge status-badge--${event.status}`}>{eventStatusLabel(event.status)}</span>
        <h2>{event.name}</h2>
        <p className="m-0 first-letter:uppercase">{formatDate(event.date)}</p>
        <p className="m-0">
          {formatTime(event.startTime)} a {formatTime(event.endTime)} h
        </p>
        {event.venue && (
          <p className="m-0 text-sm text-tinta-muted">
            <strong className="text-tinta">{event.venue.name}</strong>
            {formatAddress(event.venue) && ` — ${formatAddress(event.venue)}`}
          </p>
        )}
      </div>
    </header>
  );
}

function PurchaseBlock({ purchase, paymentMethods, holderName }) {
  return (
    <article className="rounded-card border border-sangria/25 bg-celeste/30 p-4 shadow-card sm:p-5">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h3>{purchase.purchaseDate ? `Compra del ${formatDateTime(purchase.purchaseDate)}` : 'Compra'}</h3>
        {purchase.paymentMethodId != null && (
          <p className="m-0 text-sm">
            Método de pago: <strong>{getPaymentMethodName(paymentMethods, purchase.paymentMethodId)}</strong>
          </p>
        )}
      </div>

      {purchase.ticketTypes.map((type) => (
        <section key={type.id} className="mt-4 first:mt-0">
          <div className="mb-2 flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <h4 className="m-0 text-base font-bold text-tinta">{type.name}</h4>
            <span className="text-sm text-tinta-muted">Cantidad: {type.tickets.length}</span>
          </div>
          <ul className="card-list">
            {type.tickets.map((ticket) => (
              <TicketItem key={ticket.id} ticket={ticket} holderName={holderName} />
            ))}
          </ul>
        </section>
      ))}
    </article>
  );
}

function DetalleMisEventoPage() {
  const { eventoId } = useParams();
  const key = parseMisEventoId(eventoId);
  const participantId = getCurrentParticipantId();

  const [event, setEvent] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [holderName, setHolderName] = useState(null);
  const [loading, setLoading] = useState(Boolean(key));
  const [error, setError] = useState(null);

  async function loadDetail() {
    if (!key) return;
    setLoading(true);
    setError(null);
    try {
      const [eventData, ticketList] = await Promise.all([
        getEvent(key.venue, key.event),
        getAllParticipantTickets(participantId, { venue: key.venue, event: key.event }),
      ]);
      setEvent(eventData);
      setTickets(ticketList);
      // Datos complementarios: si fallan, se muestran las entradas igual.
      getPaymentMethods().then(setPaymentMethods).catch(() => setPaymentMethods([]));
      getParticipant(participantId)
        .then((participant) => setHolderName(`${participant.firstName} ${participant.lastName}`))
        .catch(() => setHolderName(null));
    } catch (loadError) {
      setEvent(null);
      setError(loadError.status === 404 ? MESSAGES.notFound : MESSAGES.loadError);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventoId, participantId]);

  if (!key) {
    return (
      <section>
        <BackLink />
        <ErrorState message={MESSAGES.invalidId} />
      </section>
    );
  }

  if (loading) return <LoadingState message="Cargando el evento..." />;

  if (error) {
    return (
      <section>
        <BackLink />
        <ErrorState message={error} onRetry={error === MESSAGES.loadError ? loadDetail : undefined} />
      </section>
    );
  }

  const purchases = groupPurchases(tickets);

  return (
    <section>
      <BackLink />
      <EventHeader event={event} />

      {tickets.length === 0 ? (
        <EmptyState message={MESSAGES.noTickets} />
      ) : (
        <>
          <h3 className="mb-3">
            Tus entradas ({tickets.length})
          </h3>
          <div className="flex flex-col gap-5">
            {purchases.map((purchase) => (
              <PurchaseBlock
                key={purchase.key}
                purchase={purchase}
                paymentMethods={paymentMethods}
                holderName={holderName}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

export default DetalleMisEventoPage;
