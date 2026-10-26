import QRCode from 'react-qr-code';

// QR de una entrada. Codifica ticket.qr: el código único que se genera con
// la entrada y no cambia nunca, así que el QR es siempre el mismo. Negro sobre
// blanco y con margen para que se pueda escanear.
function TicketQr({ ticket, size = 128 }) {
  return (
    <div className="ticket-qr">
      <QRCode value={ticket.qr} size={size} title={`QR de la entrada #${ticket.id}`} />
    </div>
  );
}

export default TicketQr;
