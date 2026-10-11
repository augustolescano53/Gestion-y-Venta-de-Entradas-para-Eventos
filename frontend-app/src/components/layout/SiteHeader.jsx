import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth.js';
import { roleHomePath } from '../auth/roleHome.js';
import { ROLES } from '../../shared/currentUser.js';
import { MI_CUENTA_PATHS, ORGANIZADOR_PATHS, PUBLIC_PATHS } from '../../shared/routes.js';
import EventSearch from './EventSearch.jsx';
import { PersonIcon } from './icons.jsx';
import './SiteHeader.css';

// Header compartido del área pública, Mi cuenta y el organizador. Las
// opciones salen del rol de la sesión (useAuth), nunca de la URL:
// - visitante: buscador + Iniciar sesión
// - participante: buscador + Mis entradas + Mi cuenta
// - organizador: Crear evento + Mi cuenta (sin buscador)
function SiteHeader() {
  const { user } = useAuth();
  const isOrganizer = user?.role === ROLES.ORGANIZER;

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link to={roleHomePath(user)} className="site-header__logo" aria-label="POGO, ir al inicio">
          <img src="/images/pogo-logo.png" alt="POGO" />
        </Link>

        <div className="site-header__search">{!isOrganizer && <EventSearch />}</div>

        <nav className="site-header__actions" aria-label="Navegación principal">
          {!user ? (
            <Link to={PUBLIC_PATHS.login} className="site-header__login">
              Iniciar sesión
            </Link>
          ) : (
            <>
              {isOrganizer ? (
                <Link to={ORGANIZADOR_PATHS.nuevoEvento} className="site-header__link">
                  Crear evento
                </Link>
              ) : (
                <Link to={MI_CUENTA_PATHS.misEventos} className="site-header__link">
                  Mis entradas
                </Link>
              )}
              <Link to={MI_CUENTA_PATHS.root} className="site-header__account" aria-label="Mi cuenta" title="Mi cuenta">
                <PersonIcon className="site-header__account-icon" />
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

export default SiteHeader;
