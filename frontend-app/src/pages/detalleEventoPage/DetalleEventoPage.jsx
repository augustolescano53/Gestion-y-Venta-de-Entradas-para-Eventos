import { useParams } from 'react-router-dom';

function DetalleEventoPage() {
  const { id } = useParams();

  return (
    <section>
      <h1>Detalle del evento</h1>
      <p>Evento: {id}</p>
    </section>
  );
}

export default DetalleEventoPage;
