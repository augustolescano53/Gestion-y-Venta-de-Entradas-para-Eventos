import { Link } from 'react-router-dom';

function NotFoundPage() {
  return (
    <section className="card card--center">
      <h2>Página no encontrada</h2>
      <p>La dirección a la que intentaste acceder no existe.</p>
      <Link to="/lugares" className="btn btn--primary">
        Volver al inicio
      </Link>
    </section>
  );
}

export default NotFoundPage;
