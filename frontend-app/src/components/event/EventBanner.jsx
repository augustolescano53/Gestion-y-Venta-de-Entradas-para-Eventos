import { useState } from 'react';

// Franja horizontal destacada del detalle del evento (/eventos/:id y panel
// de "Mis eventos" del organizador). Sin banner, o si no carga, se usa la
// portada desenfocada de fondo (como .event-cover); sin ninguna de las dos,
// una franja bordó con el nombre.
// variant="card" (tarjetas del inicio del participante) solo agrega la clase
// event-banner--card, que le da a la imagen la proporción de la tarjeta. Sin
// variant el resultado no cambia.
function EventBanner({ event, variant = 'detail' }) {
  // Se recuerda qué URL falló: si el evento cambia, se vuelve a intentar.
  const [failed, setFailed] = useState([]);
  const usable = (url) => Boolean(url) && !failed.includes(url);
  const markFailed = (url) => () => setFailed((previous) => [...previous, url]);
  const className = variant === 'card' ? 'event-banner event-banner--card' : 'event-banner';

  // El banner llena todo el recuadro (object-cover, centrado), sin franjas.
  if (usable(event.banner)) {
    return (
      <div className={className}>
        <img className="event-banner__img" src={event.banner} alt={event.name} onError={markFailed(event.banner)} />
      </div>
    );
  }

  if (usable(event.coverImage)) {
    return (
      <div className={className} aria-hidden="true">
        <img className="event-cover__bg" src={event.coverImage} alt="" onError={markFailed(event.coverImage)} />
        <img className="event-cover__img" src={event.coverImage} alt="" />
      </div>
    );
  }

  return (
    <div className={`${className} event-banner--empty`}>
      <span className="event-cover__fallback">{event.name}</span>
    </div>
  );
}

export default EventBanner;
