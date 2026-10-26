import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { SITE_INFO } from '../../shared/siteInfo.js';
import { LocationIcon, MailIcon } from './icons.jsx';
import './SiteFooter.css';

// Duración del resaltado de Contacto (letras en Mango Sunrise).
const HIGHLIGHT_MS = 1000;

function prefersReducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

// Una navegación con state.highlightContact (el "¿Eres organizador?" del
// registro) lleva hasta la columna Contacto y le cambia el color un instante.
// El Footer está en el layout, así que el efecto corre con él ya renderizado.
// El resaltado arranca cuando Contacto entra en pantalla (no durante el
// desplazamiento), para que se llegue a ver.
function useContactHighlight(contactRef) {
  const location = useLocation();
  const navigate = useNavigate();
  const [highlighted, setHighlighted] = useState(false);
  const requested = Boolean(location.state?.highlightContact);

  useEffect(() => {
    const contact = contactRef.current;
    if (!requested || !contact) return undefined;

    let timer = null;
    const reduced = prefersReducedMotion();
    contact.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });

    // Si mientras tanto termina de cargar contenido de la página (por
    // ejemplo, los eventos) y el Footer baja, se lo vuelve a mostrar.
    let lastHeight = document.body.scrollHeight;
    const resizeObserver = new ResizeObserver(() => {
      if (document.body.scrollHeight === lastHeight) return;
      lastHeight = document.body.scrollHeight;
      contact.scrollIntoView({ behavior: 'auto', block: 'center' });
    });
    resizeObserver.observe(document.body);

    const visibleObserver = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || timer) return;
        visibleObserver.disconnect();
        setHighlighted(true);
        timer = setTimeout(() => {
          resizeObserver.disconnect();
          setHighlighted(false);
          // Se quita el pedido de la entrada del historial: volver atrás o
          // recargar no repite el efecto.
          navigate(`${location.pathname}${location.search}`, { replace: true, state: null });
        }, HIGHLIGHT_MS);
      },
      { threshold: 0.9 },
    );
    visibleObserver.observe(contact);

    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
      visibleObserver.disconnect();
      setHighlighted(false);
    };
    // Cada navegación nueva (location.key) con el pedido lo vuelve a ejecutar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key, requested]);

  return highlighted;
}

// Footer compartido, igual para todos. Tres columnas informativas sin
// enlaces. Los datos salen de shared/siteInfo.js.
function SiteFooter() {
  const contactRef = useRef(null);
  const contactHighlighted = useContactHighlight(contactRef);

  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__columns">
          <section className="site-footer__column">
            <div className="site-footer__head">
              <img className="site-footer__logo" src="/images/pogo-logo.png" alt={SITE_INFO.name} />
            </div>
            <p>{SITE_INFO.tagline}</p>
          </section>

          <section className="site-footer__column">
            <div className="site-footer__head">
              <h2 className="site-footer__title">Sobre nosotros</h2>
            </div>
            <p>{SITE_INFO.about}</p>
          </section>

          <section
            id="contacto"
            ref={contactRef}
            className={`site-footer__column site-footer__contact-block ${
              contactHighlighted ? 'site-footer__contact-block--highlight' : ''
            }`}
          >
            <div className="site-footer__head">
              <h2 className="site-footer__title">Contacto</h2>
            </div>
            <ul className="site-footer__contact">
              {SITE_INFO.contactEmail && (
                <li>
                  <MailIcon className="site-footer__icon" />
                  <span className="break-all">{SITE_INFO.contactEmail}</span>
                </li>
              )}
              {SITE_INFO.location && (
                <li>
                  <LocationIcon className="site-footer__icon" />
                  <span>{SITE_INFO.location}</span>
                </li>
              )}
            </ul>
          </section>
        </div>

        <p className="site-footer__copyright">{SITE_INFO.copyright}</p>
      </div>
    </footer>
  );
}

export default SiteFooter;
