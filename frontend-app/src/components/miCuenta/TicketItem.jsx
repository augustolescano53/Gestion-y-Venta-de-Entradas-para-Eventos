import { TICKET_STATUS, ticketStatusLabel } from '../../constants/statuses.js';

// Mismos datos y clases que la tarjeta de entrada del CRUD (TicketsPage),
// sin las acciones de administración. El estado solo se muestra cuando no es
// el habitual (Vendida): escaneada o cancelada.
function TicketItem({ ticket }) {
  return (
    <li className="card">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3>Entrada #{ticket.id}</h3>
        {ticket.status !== TICKET_STATUS.SOLD && (
          <span className={`status-badge status-badge--${ticket.status}`}>{ticketStatusLabel(ticket.status)}</span>
        )}
      </div>
      <p>Tipo de entrada: {ticket.ticketType.location}</p>
      {ticket.seatNumber != null && <p>Asiento: {ticket.seatNumber}</p>}
      <p className="card__qr">
        QR: <code>{ticket.qr}</code>
      </p>
    </li>
  );
}

export default TicketItem;
