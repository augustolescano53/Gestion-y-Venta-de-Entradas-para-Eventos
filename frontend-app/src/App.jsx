import { NavLink, Navigate, Route, Routes } from 'react-router-dom';
import VenuesPage from './pages/VenuesPage.jsx';
import PaymentMethodsPage from './pages/PaymentMethodsPage.jsx';
import OrganizersPage from './pages/OrganizersPage.jsx';
import ParticipantsPage from './pages/ParticipantsPage.jsx';
import TicketTypesPage from './pages/TicketTypesPage.jsx';
import EventsPage from './pages/EventsPage.jsx';
import TicketsPage from './pages/TicketsPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import './App.css';

// Cada entrada del menú es un link (to) más el texto que ve el usuario.
// Cuando sumemos las demás pantallas, alcanza con agregar un objeto acá y
// su <Route> correspondiente más abajo.
const NAV_ITEMS = [
  { to: '/lugares', label: 'Lugares' },
  { to: '/medios-de-pago', label: 'Medios de pago' },
  { to: '/organizadores', label: 'Organizadores' },
  { to: '/participantes', label: 'Participantes' },
  { to: '/tipos-de-entrada', label: 'Tipos de entrada' },
  { to: '/eventos', label: 'Eventos' },
  { to: '/entradas', label: 'Entradas' },
];

function App() {
  return (
    <>
      <header className="app-header">
        <div className="app-header__brand">🎫 Gestión de Eventos</div>
        <nav className="app-nav">
          {/* NavLink es como Link, pero además le agrega una clase al
              enlace cuando su "to" coincide con la URL actual: así
              marcamos la sección activa sin manejar ese estado a mano. */}
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                isActive ? 'nav-link nav-link--active' : 'nav-link'
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="app-main">
        <Routes>
          {/* Navigate hace una redirección: entrar a "/" manda directo a
              "/lugares". replace evita que "/" quede en el historial, así
              el botón "atrás" del navegador no vuelve a una página vacía. */}
          <Route path="/" element={<Navigate to="/lugares" replace />} />
          <Route path="/lugares" element={<VenuesPage />} />
          <Route path="/medios-de-pago" element={<PaymentMethodsPage />} />
          <Route path="/organizadores" element={<OrganizersPage />} />
          <Route path="/participantes" element={<ParticipantsPage />} />
          <Route path="/tipos-de-entrada" element={<TicketTypesPage />} />
          <Route path="/eventos" element={<EventsPage />} />
          <Route path="/entradas" element={<TicketsPage />} />
          {/* "*" matchea cualquier URL que no matcheó ninguna ruta de
              arriba: es nuestra pantalla de "página no encontrada". */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </>
  );
}

export default App;
