import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { resolveId } from '../../shared/refs.helpers.js';
import { eventoPath } from '../../shared/routes.js';
import { ChevronLeftIcon, ChevronRightIcon } from './icons.jsx';

export const AUTOPLAY_MS = 10_000;
// Igual a la duración de la transición en InicioParticipantePage.css.
const TRANSITION_MS = 600;
// Copias a cada lado para que los laterales nunca queden vacíos y el paso
// del último al primero no se note.
const CLONES = 2;

function prefersReducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

// Pista: [n-2, n-1, ...reales, 0, 1]. pos es la posición en la pista; los
// reales van de CLONES a CLONES + n - 1.
function buildTrack(events) {
  const n = events.length;
  if (n < 2) return events.map((event) => ({ event, clone: false }));
  const at = (i) => events[((i % n) + n) % n];
  return [
    ...Array.from({ length: CLONES }, (_, i) => ({ event: at(i - CLONES), clone: true })),
    ...events.map((event) => ({ event, clone: false })),
    ...Array.from({ length: CLONES }, (_, i) => ({ event: at(i), clone: true })),
  ];
}

// Carrusel del inicio del participante: banner central con los laterales
// asomando, flechas, transición horizontal y avance automático cada 10 s.
// Con un solo evento queda fijo; sin eventos no se muestra.
function BannerCarousel({ events }) {
  const n = events.length;
  const looping = n > 1;
  const [pos, setPos] = useState(looping ? CLONES : 0);
  const [animated, setAnimated] = useState(true);
  const moving = useRef(false);
  const fallbackTimer = useRef(null);

  // Al terminar de moverse, si quedó sobre una copia se salta sin animación
  // al banner real equivalente.
  const settle = useCallback(() => {
    clearTimeout(fallbackTimer.current);
    moving.current = false;
    setPos((current) => {
      if (current >= CLONES + n) return current - n;
      if (current < CLONES) return current + n;
      return current;
    });
  }, [n]);

  useEffect(() => {
    if (animated) return undefined;
    // Se vuelve a activar la transición recién después de que el salto se
    // pintó (dos frames); si no, el salto también se vería animado.
    let second;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => setAnimated(true));
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, [animated]);

  const go = useCallback(
    (delta) => {
      if (!looping || moving.current) return;
      if (prefersReducedMotion()) {
        setAnimated(false);
        setPos((current) => CLONES + ((((current - CLONES + delta) % n) + n) % n));
        return;
      }
      moving.current = true;
      setAnimated(true);
      setPos((current) => current + delta);
      // Por si no llega transitionend (por ejemplo, con la pestaña oculta).
      fallbackTimer.current = setTimeout(() => {
        setAnimated(false);
        settle();
      }, TRANSITION_MS + 150);
    },
    [looping, n, settle],
  );

  function handleTransitionEnd(event) {
    if (event.target !== event.currentTarget || event.propertyName !== 'transform') return;
    setAnimated(false);
    settle();
  }

  // Cada cambio de posición (manual o automático) reinicia los 10 segundos.
  useEffect(() => {
    if (!looping) return undefined;
    const timer = setTimeout(() => go(1), AUTOPLAY_MS);
    return () => clearTimeout(timer);
  }, [pos, looping, go]);

  useEffect(() => () => clearTimeout(fallbackTimer.current), []);

  if (n === 0) return null;

  const track = buildTrack(events);

  return (
    <section className="ip-carousel" aria-roledescription="carrusel" aria-label="Eventos destacados">
      <div
        className={`ip-carousel__track ${animated ? '' : 'ip-carousel__track--instant'}`}
        style={{ '--ip-pos': pos }}
        onTransitionEnd={handleTransitionEnd}
      >
        {track.map(({ event, clone }, index) => {
          const current = index === pos;
          return (
            <Link
              key={`${clone ? 'clone' : 'real'}-${index}`}
              className="ip-carousel__slide"
              to={eventoPath(resolveId(event.venue), event.idEvent)}
              aria-hidden={!current}
              tabIndex={current ? 0 : -1}
            >
              <img src={event.banner} alt={event.name} draggable={false} />
            </Link>
          );
        })}
      </div>

      {looping && (
        <>
          <button
            type="button"
            className="ip-carousel__arrow ip-carousel__arrow--prev"
            aria-label="Banner anterior"
            onClick={() => go(-1)}
          >
            <ChevronLeftIcon className="ip-carousel__chevron" />
          </button>
          <button
            type="button"
            className="ip-carousel__arrow ip-carousel__arrow--next"
            aria-label="Banner siguiente"
            onClick={() => go(1)}
          >
            <ChevronRightIcon className="ip-carousel__chevron" />
          </button>
        </>
      )}
    </section>
  );
}

export default BannerCarousel;
