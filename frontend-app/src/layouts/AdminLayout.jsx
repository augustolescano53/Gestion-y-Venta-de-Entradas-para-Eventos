import { Outlet } from 'react-router-dom';
import { useLogout } from '../auth/useLogout.js';
import AccountSidebar from '../components/account/AccountSidebar.jsx';
import { GridIcon, LockIcon, PersonIcon } from '../components/layout/icons.jsx';
import SiteFooter from '../components/layout/SiteFooter.jsx';
import SiteHeader from '../components/layout/SiteHeader.jsx';
import { ADMIN_PATHS } from '../shared/routes.js';

const MENU_ITEMS = [
  { to: ADMIN_PATHS.informacionPersonal, label: 'Información personal', icon: PersonIcon },
  { to: ADMIN_PATHS.contrasena, label: 'Contraseña', icon: LockIcon },
  {
    id: 'crud',
    label: 'Panel de administración',
    icon: GridIcon,
    children: [
      { to: ADMIN_PATHS.lugares, label: 'Lugares' },
      { to: ADMIN_PATHS.mediosDePago, label: 'Medios de pago' },
      { to: ADMIN_PATHS.organizadores, label: 'Organizadores' },
      { to: ADMIN_PATHS.participantes, label: 'Participantes' },
      { to: ADMIN_PATHS.tiposDeEntrada, label: 'Tipos de entrada' },
      { to: ADMIN_PATHS.eventos, label: 'Eventos' },
      { to: ADMIN_PATHS.entradas, label: 'Entradas' },
      { to: ADMIN_PATHS.administradores, label: 'Administradores' },
    ],
  },
];

// Panel de administración en una sola pantalla: Header arriba (el logo no
// navega), menú a la izquierda (mismo diseño que Mi cuenta), la CRUD o los
// datos de la cuenta a la derecha y el Footer abajo. Solo para admins
// (AdminOnly en App.jsx).
function AdminLayout() {
  const handleLogout = useLogout();

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader logoLink={false} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-6 pb-12 text-tinta">
        <h1 className="mb-5 text-3xl font-bold text-sangria">Administración</h1>
        <div className="grid gap-6 md:grid-cols-[240px_1fr] md:items-start">
          <AccountSidebar label="Administración" items={MENU_ITEMS} onLogout={handleLogout} />
          <div className="min-w-0">
            <Outlet />
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

export default AdminLayout;
