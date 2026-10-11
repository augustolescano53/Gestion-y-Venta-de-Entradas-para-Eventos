import { useEffect, useRef, useState } from 'react';
import { EVENT_STATUS, eventStatusLabel } from '../../constants/statuses.js';
import { formatEventDate, formatTime } from '../../shared/format.helpers.js';
import { venueAddress } from '../../pages/detalleEventoPage/DetalleEventoPage.helpers.js';

// Alto disponible para la descripción: el de la portada menos lo que ya
// ocupa el resto de la columna de datos (título, fecha, lugar, organizador,
// márgenes). Así la columna queda a la par de la imagen. Se recalcula al
// cambiar el tamaño de la pantalla. La descripción se descuenta con su alto
// actual, así el resultado no depende de si está recortada o expandida.
function useDescriptionSpace(coverRef, infoRef, descriptionRef, enabled) {
  const [space, setSpace] = useState(null);
  useEffect(() => {
    const cover = coverRef.current;
    const info = infoRef.current;
    if (!enabled || !cover || !info) return undefined;
    const measure = () => {
      const description = descriptionRef.current;
      if (!description) return;
      const otherContent = info.getBoundingClientRect().height - description.getBoundingClientRect().height;
      // Mínimo 1 px: ClampedDescription igual muestra al menos una línea.
      setSpace(Math.max(1, cover.getBoundingClientRect().height - otherContent));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(cover);
    observer.observe(info);
    return () => observer.disconnect();
  }, [coverRef, infoRef, descriptionRef, enabled]);
  return space;
}

// Descripción recortada al alto disponible (en líneas enteras). Si no entra,
// termina en "…" (clickeable) y se puede expandir y volver a contraer. El
// texto no se modifica: solo se limita su alto visible.
function ClampedDescription({ text, maxHeight, blockRef }) {
  const textRef = useRef(null);
  const [expanded, setExpanded] = useState(false);
  const [limit, setLimit] = useState(null);

  // Alto máximo redondeado a líneas completas y si el texto lo supera.
  useEffect(() => {
    const element = textRef.current;
    if (!element || !maxHeight) return undefined;
    const measure = () => {
      const lineHeight = parseFloat(getComputedStyle(element).lineHeight) || 24;
      const lines = Math.max(1, Math.floor(maxHeight / lineHeight));
      const clampHeight = lines * lineHeight;
      setLimit(element.scrollHeight > clampHeight + 1 ? clampHeight : null);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [maxHeight, text]);

  const clamped = limit !== null && !expanded;

  return (
    <div className="event-info__description-block" ref={blockRef}>
      <p
        ref={textRef}
        className={`event-info__description ${clamped ? 'event-info__description--clamped' : ''}`}
        style={clamped ? { maxHeight: `${limit}px` } : undefined}
      >
        {text}
      </p>
      {clamped && (
        <button
          type="button"
          className="event-info__more"
          onClick={() => setExpanded(true)}
          aria-label="Ver descripción completa"
          title="Ver descripción completa"
        >
          …
        </button>
      )}
      {limit !== null && expanded && (
        <button type="button" className="event-info__less" onClick={() => setExpanded(false)}>
          Ver menos
        </button>
      )}
    </div>
  );
}

// Tarjeta del evento del detalle público (/eventos/:id), también usada en el
// panel de "Mis eventos" del organizador. La portada se muestra entera
// (contain) sobre una copia desenfocada que rellena los costados: sirve para
// cualquier proporción. showEndTime agrega la hora de fin. Con
// showDescription={false} la descripción no va en la tarjeta (el detalle
// público la muestra aparte, debajo de todo). Con clampDescription la
// descripción se limita para que la columna de datos no supere el alto de la
// portada, y se puede expandir.
function EventInfoCard({
  event,
  showEndTime = false,
  showDescription = true,
  clampDescription = false,
  className = '',
}) {
  const [coverFailed, setCoverFailed] = useState(false);
  const coverRef = useRef(null);
  const infoRef = useRef(null);
  const descriptionRef = useRef(null);
  const descriptionSpace = useDescriptionSpace(coverRef, infoRef, descriptionRef, clampDescription);
  const address = venueAddress(event.venue);

  return (
    <aside className={`event-card ${className}`.trim()}>
      <div className="event-cover" ref={coverRef}>
        {event.coverImage && !coverFailed ? (
          <>
            <img className="event-cover__bg" src={event.coverImage} alt="" aria-hidden="true" />
            <img
              className="event-cover__img"
              src={event.coverImage}
              alt={event.name}
              onError={() => setCoverFailed(true)}
            />
          </>
        ) : (
          <span className="event-cover__fallback">{event.name}</span>
        )}
      </div>

      <div className="event-info" ref={infoRef}>
        <div className="flex flex-wrap items-center gap-3">
          <h2>{event.name}</h2>
          {event.status !== EVENT_STATUS.SCHEDULED && (
            <span className={`status-badge status-badge--${event.status}`}>{eventStatusLabel(event.status)}</span>
          )}
        </div>
        <p className="event-info__meta">
          {formatEventDate(event.date)} · {formatTime(event.startTime)}
          {showEndTime && ` a ${formatTime(event.endTime)}`} h
        </p>
        {event.venue?.name && (
          <p className="event-info__meta">
            {event.venue.name}
            {address && ` — ${address}`}
          </p>
        )}
        {showDescription &&
          event.description &&
          (clampDescription ? (
            <ClampedDescription text={event.description} maxHeight={descriptionSpace} blockRef={descriptionRef} />
          ) : (
            <p className="event-info__description">{event.description}</p>
          ))}
        {event.organizer?.firstName && (
          <p className="event-info__meta">
            Organiza: {event.organizer.firstName} {event.organizer.lastName}
          </p>
        )}
      </div>
    </aside>
  );
}

export default EventInfoCard;
