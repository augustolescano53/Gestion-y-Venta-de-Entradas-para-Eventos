import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth.js';
import { isOrganizer } from '../shared/currentUser.js';
import { MI_CUENTA_PATHS, PUBLIC_PATHS } from '../shared/routes.js';

// El organizador gestiona sus eventos desde su inicio: en su Mi cuenta solo
// quedan los datos personales, la contraseña y cerrar sesión.
const MENU_ITEMS = [
  { to: MI_CUENTA_PATHS.informacionPersonal, label: 'Información personal' },
  { to: MI_CUENTA_PATHS.contrasena, label: 'Contraseña' },
  { to: MI_CUENTA_PATHS.misEventos, label: 'Mis eventos', participantOnly: true },
];

// Sin "end": "Mis eventos" sigue activo en el detalle de un evento.
function menuLinkClass({ isActive }) {
  const base =
    'block whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold no-underline transition-colors md:rounded-lg';
  return isActive ? `${base} bg-sangria text-crema` : `${base} text-sangria hover:bg-crema-dark`;
}

// Estructura común de /mi-cuenta/*: menú (lateral en escritorio, fila de
// opciones en celulares) + página elegida.
function MiCuentaLayout() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  function handleLogout() {
    logout();
    navigate(PUBLIC_PATHS.home, { replace: true });
  }

  return (
    <section>
      <h1 className="mb-5 text-3xl font-bold text-sangria">Mi cuenta</h1>
      <div className="grid gap-6 md:grid-cols-[220px_1fr] md:items-start">
        <nav
          aria-label="Mi cuenta"
          className="rounded-card border border-sangria/25 bg-crema p-2 shadow-card md:sticky md:top-6 md:flex md:h-[calc(100vh-9rem)] md:min-h-80 md:flex-col"
        >
          {/* En escritorio el menú ocupa el alto de la pantalla y "Cerrar
              sesión" queda abajo de todo (mt-auto). */}
          <ul className="m-0 flex list-none flex-wrap gap-1 p-0 md:flex-1 md:flex-col">
            {MENU_ITEMS.filter((item) => !(item.participantOnly && isOrganizer())).map((item) => (
              <li key={item.to}>
                <NavLink to={item.to} className={menuLinkClass}>
                  {item.label}
                </NavLink>
              </li>
            ))}
            <li className="md:mt-auto md:border-t md:border-sangria/20 md:pt-1">
              <button
                type="button"
                onClick={handleLogout}
                className="block w-full whitespace-nowrap rounded-full border-0 bg-transparent px-4 py-2 text-left text-sm font-semibold text-sangria transition-colors hover:bg-crema-dark md:rounded-lg"
              >
                Cerrar sesión
              </button>
            </li>
          </ul>
        </nav>
        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </section>
  );
}

export default MiCuentaLayout;
