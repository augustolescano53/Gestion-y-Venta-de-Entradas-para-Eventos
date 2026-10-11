import { useState } from 'react';

// Franja horizontal destacada del detalle del evento (/eventos/:id y panel
// de "Mis eventos" del organizador). Sin banner, o si no carga, se usa la
// portada desenfocada de fondo (como .event-cover); sin ninguna de las dos,
// una franja bordó con el nombre.
function EventBanner({ event }) {
  // Se recuerda qué URL falló: si el evento cambia, se vuelve a intentar.
  const [failed, setFailed] = useState([]);
  const usable = (url) => Boolean(url) && !failed.includes(url);
  const markFailed = (url) => () => setFailed((previous) => [...previous, url]);

  if (usable(event.banner)) {
    return (
      <div className="event-banner">
        <img className="event-banner__img" src={event.banner} alt={event.name} onError={markFailed(event.banner)} />
      </div>
    );
  }

  if (usable(event.coverImage)) {
    return (
      <div className="event-banner" aria-hidden="true">
        <img className="event-cover__bg" src={event.coverImage} alt="" onError={markFailed(event.coverImage)} />
        <img className="event-cover__img" src={event.coverImage} alt="" />
      </div>
    );
  }

  return (
    <div className="event-banner event-banner--empty">
      <span className="event-cover__fallback">{event.name}</span>
    </div>
  );
}

export default EventBanner;
