import { Navigate, Route, Routes } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import ConfirmProvider from './components/confirmDialog/ConfirmProvider.jsx';
import AdminLayout from './layouts/AdminLayout.jsx';
import PublicLayout from './layouts/PublicLayout.jsx';
import MiCuentaLayout from './layouts/MiCuentaLayout.jsx';
import VenuesPage from './pages/venuesPage/VenuesPage.jsx';
import PaymentMethodsPage from './pages/paymentMethodsPage/PaymentMethodsPage.jsx';
import OrganizersPage from './pages/organizersPage/OrganizersPage.jsx';
import ParticipantsPage from './pages/participantsPage/ParticipantsPage.jsx';
import TicketTypesPage from './pages/ticketTypesPage/TicketTypesPage.jsx';
import EventsPage from './pages/eventsPage/EventsPage.jsx';
import TicketsPage from './pages/ticketsPage/TicketsPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import HomePage from './pages/homePage/HomePage.jsx';
import LoginPage from './pages/loginPage/LoginPage.jsx';
import RegisterPage from './pages/registerPage/RegisterPage.jsx';
import DetalleEventoPage from './pages/detalleEventoPage/DetalleEventoPage.jsx';
import CheckoutPage from './pages/checkoutPage/CheckoutPage.jsx';
import InformacionPersonalPage from './pages/miCuenta/informacionPersonalPage/InformacionPersonalPage.jsx';
import CambiarContrasenaPage from './pages/miCuenta/cambiarContrasenaPage/CambiarContrasenaPage.jsx';
import MisEventosPage from './pages/miCuenta/misEventosPage/MisEventosPage.jsx';
import DetalleMisEventoPage from './pages/miCuenta/detalleMisEventoPage/DetalleMisEventoPage.jsx';

// :id y :eventoId tienen la forma "venueId-idEvent" (ver shared/routes.js).
function App() {
  return (
    <ConfirmProvider>
      <Routes>
        {/* Área de compradores */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/eventos/:id" element={<DetalleEventoPage />} />
          <Route path="/eventos/:id/comprar" element={<CheckoutPage />} />
          <Route path="/mi-cuenta" element={<MiCuentaLayout />}>
            <Route index element={<Navigate to="informacion-personal" replace />} />
            <Route path="informacion-personal" element={<InformacionPersonalPage />} />
            <Route path="contrasena" element={<CambiarContrasenaPage />} />
            <Route path="mis-eventos" element={<MisEventosPage />} />
            <Route path="mis-eventos/:eventoId" element={<DetalleMisEventoPage />} />
          </Route>
        </Route>

        {/* Administración (CRUD) */}
        <Route element={<AdminLayout />}>
          <Route path="/lugares" element={<VenuesPage />} />
          <Route path="/medios-de-pago" element={<PaymentMethodsPage />} />
          <Route path="/organizadores" element={<OrganizersPage />} />
          <Route path="/participantes" element={<ParticipantsPage />} />
          <Route path="/tipos-de-entrada" element={<TicketTypesPage />} />
          <Route path="/eventos" element={<EventsPage />} />
          <Route path="/entradas" element={<TicketsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
      {/* Mensajes de éxito de todas las páginas (toast.success, etc.). */}
      <ToastContainer position="top-right" autoClose={4000} newestOnTop theme="light" />
    </ConfirmProvider>
  );
}

export default App;
