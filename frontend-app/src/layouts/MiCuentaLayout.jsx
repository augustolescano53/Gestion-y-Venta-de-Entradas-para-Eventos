import { NavLink, Outlet } from 'react-router-dom';
import { MI_CUENTA_PATHS } from '../shared/routes.js';

const MENU_ITEMS = [
  { to: MI_CUENTA_PATHS.informacionPersonal, label: 'Información personal' },
  { to: MI_CUENTA_PATHS.contrasena, label: 'Contraseña' },
  { to: MI_CUENTA_PATHS.misEventos, label: 'Mis eventos' },
];

// Estructura común de /mi-cuenta/*: menú lateral + página elegida.
function MiCuentaLayout() {
  return (
    <section>
      <h1>Mi cuenta</h1>
      <nav>
        <ul>
          {MENU_ITEMS.map((item) => (
            <li key={item.to}>
              <NavLink to={item.to}>{item.label}</NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <Outlet />
    </section>
  );
}

export default MiCuentaLayout;
