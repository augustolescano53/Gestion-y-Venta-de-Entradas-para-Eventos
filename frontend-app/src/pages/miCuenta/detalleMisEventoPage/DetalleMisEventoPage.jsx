import { useParams } from 'react-router-dom';

function DetalleMisEventoPage() {
  const { eventoId } = useParams();

  return (
    <section>
      <h1>Detalle de mi evento</h1>
      <p>Evento: {eventoId}</p>
    </section>
  );
}

export default DetalleMisEventoPage;
