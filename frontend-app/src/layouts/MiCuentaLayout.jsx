import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/useAuth.js';
import { useLogout } from '../auth/useLogout.js';
import AccountSidebar from '../components/account/AccountSidebar.jsx';
import { LockIcon, PersonIcon, TicketIcon } from '../components/layout/icons.jsx';
import { ROLES } from '../shared/currentUser.js';
import { ADMIN_PATHS, MI_CUENTA_PATHS } from '../shared/routes.js';

// El organizador gestiona sus eventos desde su inicio: en su Mi cuenta solo
// quedan los datos personales, la contraseña y cerrar sesión.
const MENU_ITEMS = [
  { to: MI_CUENTA_PATHS.informacionPersonal, label: 'Información personal', icon: PersonIcon },
  { to: MI_CUENTA_PATHS.contrasena, label: 'Contraseña', icon: LockIcon },
  { to: MI_CUENTA_PATHS.misEventos, label: 'Mis eventos', icon: TicketIcon, participantOnly: true },
];

// Estructura común de /mi-cuenta/*: menú (lateral en escritorio, lista
// vertical arriba en celulares) + página elegida. El admin tiene su cuenta
// dentro del panel de administración.
function MiCuentaLayout() {
  const { user } = useAuth();
  const handleLogout = useLogout();

  if (user?.role === ROLES.ADMIN) return <Navigate to={ADMIN_PATHS.informacionPersonal} replace />;

  const items = MENU_ITEMS.filter((item) => !item.participantOnly || user?.role === ROLES.PARTICIPANT);

  return (
    <section>
      <h1 className="mb-5 text-3xl font-bold text-sangria">Mi cuenta</h1>
      <div className="grid gap-6 md:grid-cols-[220px_1fr] md:items-start">
        <AccountSidebar label="Mi cuenta" items={items} onLogout={handleLogout} />
        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </section>
  );
}

export default MiCuentaLayout;
