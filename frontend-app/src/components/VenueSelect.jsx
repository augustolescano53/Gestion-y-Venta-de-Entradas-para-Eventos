import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getVenues } from '../api/venues.js';

// TicketTypesPage, EventsPage y TicketsPage necesitan, las tres, elegir un
// Lugar "por nombre" antes de poder trabajar con sus datos dependientes.
// En vez de repetir esta lógica (traer lugares, armar el <select>, avisar
// si todavía no hay ninguno) en cada página, vive acá una sola vez.
//
// - value/onChange: igual que un input controlado común.
// - onLoaded: opcional, avisa a la página "ya sé cuántos lugares hay" para
//   que pueda decidir si mostrar el resto de la pantalla o no.
function VenueSelect({ value, onChange, onLoaded, label = 'Lugar' }) {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getVenues()
      .then((data) => {
        setVenues(data);
        onLoaded?.(data);
        // Si todavía no hay un lugar elegido, arrancamos con el primero de
        // la lista para no dejar la pantalla vacía esperando un click.
        if (data.length > 0 && (value === null || value === undefined)) {
          onChange(data[0].id);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
    // Se busca la lista una sola vez, al montar el selector.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <p>Cargando lugares...</p>;
  if (error) return <p className="banner banner--error">{error}</p>;

  if (venues.length === 0) {
    return (
      <p className="banner banner--error">
        Todavía no hay lugares cargados. <Link to="/lugares">Creá uno primero</Link>.
      </p>
    );
  }

  return (
    <label className="field">
      <span>{label}</span>
      <select value={value ?? ''} onChange={(event) => onChange(Number(event.target.value))}>
        {venues.map((venue) => (
          <option key={venue.id} value={venue.id}>
            {venue.name}
          </option>
        ))}
      </select>
    </label>
  );
}

export default VenueSelect;
