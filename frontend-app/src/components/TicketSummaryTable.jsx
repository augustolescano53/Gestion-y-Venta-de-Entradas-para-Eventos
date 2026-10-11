import { TICKET_COUNT_COLUMNS } from '../constants/statuses.js';

export function TicketSummaryNote() {
  return (
    <p className="page-note">
      <strong>Total</strong> = disponibles + vendidas sin usar + escaneadas + canceladas.{' '}
      <strong>Total vendidas</strong> es histórico: vendidas sin usar + escaneadas + las canceladas
      que se habían vendido (una entrada se cuenta una sola vez).
    </p>
  );
}

// Única tabla de resumen por evento y tipo de entrada: se usa tanto para
// todos los eventos como para uno filtrado.
function TicketSummaryTable({ rows }) {
  return (
    <>
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Evento</th>
              <th>Tipo de entrada</th>
              {TICKET_COUNT_COLUMNS.map(([field, label]) => (
                <th key={field}>{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.venueId}-${row.idEvent}-${row.idTicketType}`}>
                <td>{row.eventName}</td>
                <td>{row.ticketTypeName}</td>
                {TICKET_COUNT_COLUMNS.map(([field]) => (
                  <td key={field}>{row[field]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <TicketSummaryNote />
    </>
  );
}

export default TicketSummaryTable;
