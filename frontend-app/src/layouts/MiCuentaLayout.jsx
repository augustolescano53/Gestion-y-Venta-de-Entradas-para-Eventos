import { NavLink, Outlet } from 'react-router-dom';
import { MI_CUENTA_PATHS } from '../shared/routes.js';

const MENU_ITEMS = [
  { to: MI_CUENTA_PATHS.informacionPersonal, label: 'Información personal' },
  { to: MI_CUENTA_PATHS.contrasena, label: 'Contraseña' },
  { to: MI_CUENTA_PATHS.misEventos, label: 'Mis eventos' },
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
  return (
    <section>
      <h1 className="mb-5 text-3xl font-bold text-sangria">Mi cuenta</h1>
      <div className="grid gap-6 md:grid-cols-[220px_1fr] md:items-start">
        <nav
          aria-label="Mi cuenta"
          className="rounded-card border border-sangria/25 bg-crema p-2 shadow-card md:sticky md:top-6"
        >
          <ul className="m-0 flex list-none flex-wrap gap-1 p-0 md:flex-col">
            {MENU_ITEMS.map((item) => (
              <li key={item.to}>
                <NavLink to={item.to} className={menuLinkClass}>
                  {item.label}
                </NavLink>
              </li>
            ))}
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
