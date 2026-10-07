import { NavLink, Outlet } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/lugares', label: 'Lugares' },
  { to: '/medios-de-pago', label: 'Medios de pago' },
  { to: '/organizadores', label: 'Organizadores' },
  { to: '/participantes', label: 'Participantes' },
  { to: '/tipos-de-entrada', label: 'Tipos de entrada' },
  { to: '/eventos', label: 'Eventos' },
  { to: '/entradas', label: 'Entradas' },
];

function navLinkClass({ isActive }) {
  const base = 'rounded-full px-3 py-1.5 text-sm font-semibold no-underline transition-colors';
  return isActive
    ? `${base} bg-celeste text-tinta`
    : `${base} text-crema hover:bg-crema/15`;
}

// Header y contenedor de los CRUD de administración.
function AdminLayout() {
  return (
    <>
      {/* El padding superior respeta el notch de los celulares. */}
      <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b-4 border-celeste bg-sangria shadow-card px-4 pt-[calc(0.75rem+env(safe-area-inset-top,0px))] pb-3 sm:px-6">
        <NavLink to="/lugares" className="shrink-0">
          <img src="/images/pogo-logo.png" alt="POGO" className="h-12 w-auto sm:h-16" />
        </NavLink>
        <nav className="flex flex-wrap gap-1.5 sm:gap-2">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} className={navLinkClass}>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-4 pt-6 pb-12 text-tinta">
        <Outlet />
      </main>
    </>
  );
}

export default AdminLayout;
