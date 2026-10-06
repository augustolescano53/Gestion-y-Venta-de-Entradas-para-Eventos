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
              <th>Total</th>
              <th>Disponibles</th>
              <th>Vendidas sin usar</th>
              <th>Escaneadas</th>
              <th>Canceladas</th>
              <th>Total vendidas</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.venueId}-${row.idEvent}-${row.idTicketType}`}>
                <td>{row.eventName}</td>
                <td>{row.ticketTypeName}</td>
                <td>{row.total}</td>
                <td>{row.available}</td>
                <td>{row.soldUnused}</td>
                <td>{row.scanned}</td>
                <td>{row.cancelled}</td>
                <td>{row.soldTotal}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="page-note">
        <strong>Total</strong> = disponibles + vendidas sin usar + escaneadas + canceladas.{' '}
        <strong>Total vendidas</strong> es histórico: vendidas sin usar + escaneadas + las canceladas
        que se habían vendido (una entrada se cuenta una sola vez).
      </p>
    </>
  );
}

export default TicketSummaryTable;
