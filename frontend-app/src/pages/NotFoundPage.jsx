import { Link } from 'react-router-dom';
import './NotFoundPage.css';

// Se muestra cuando la URL no matchea ninguna <Route> de App.jsx (la ruta
// comodín "*"), por ejemplo si alguien escribe una dirección a mano.
function NotFoundPage() {
  return (
    <section className="not-found-page">
      <h2>Página no encontrada</h2>
      <p>La dirección a la que intentaste acceder no existe.</p>
      <Link to="/lugares" className="btn btn--primary">
        Volver al inicio
      </Link>
    </section>
  );
}

export default NotFoundPage;
