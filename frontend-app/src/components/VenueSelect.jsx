import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getVenues } from '../api/venues.js';

// autoSelectFirst: si es false, el selector arranca vacío y obliga a elegir.
function VenueSelect({ value, onChange, onLoaded, label = 'Lugar', autoSelectFirst = true }) {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getVenues()
      .then((data) => {
        setVenues(data);
        onLoaded?.(data);
        if (autoSelectFirst && data.length > 0 && (value === null || value === undefined)) {
          onChange(data[0].id);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
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
        {(value === null || value === undefined) && (
          <option value="" disabled>
            Elegí un lugar...
          </option>
        )}
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
