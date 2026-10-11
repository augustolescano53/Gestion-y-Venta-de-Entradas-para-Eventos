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
import LoginPage from './pages/loginPage/LoginPage.jsx';
import RegisterPage from './pages/registerPage/RegisterPage.jsx';
import DetalleEventoPage from './pages/detalleEventoPage/DetalleEventoPage.jsx';
import CheckoutPage from './pages/checkoutPage/CheckoutPage.jsx';
import { ORGANIZADOR_PATHS, PARTICIPANTE_PATHS } from './shared/routes.js';
import InformacionPersonalPage from './pages/miCuenta/informacionPersonalPage/InformacionPersonalPage.jsx';
import CambiarContrasenaPage from './pages/miCuenta/cambiarContrasenaPage/CambiarContrasenaPage.jsx';
import MisEventosRoute from './pages/miCuenta/MisEventosRoute.jsx';
import DetalleMisEventoPage from './pages/miCuenta/detalleMisEventoPage/DetalleMisEventoPage.jsx';
import InicioParticipantePage from './pages/inicioParticipantePage/InicioParticipantePage.jsx';
import ParticipantOnly from './components/ParticipantOnly.jsx';
import OrganizerOnly from './components/OrganizerOnly.jsx';
import RequireAuth from './components/auth/RequireAuth.jsx';
import RoleHomeRedirect from './components/auth/RoleHomeRedirect.jsx';
import InicioOrganizadorPage from './pages/inicioOrganizadorPage/InicioOrganizadorPage.jsx';
import RedirectEditarEvento from './pages/inicioOrganizadorPage/RedirectEditarEvento.jsx';
import NuevoEventoPage from './pages/nuevoEventoPage/NuevoEventoPage.jsx';
import EditarEventoPage from './pages/editarEventoPage/EditarEventoPage.jsx';

// :id y :eventoId tienen la forma "venueId-idEvent" (ver shared/routes.js).
function App() {
  return (
    <ConfirmProvider>
      <Routes>
        {/* Login y registro: mismo layout, sin Header (solo el Footer). */}
        <Route element={<PublicLayout showHeader={false} />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/* Área de compradores */}
        <Route element={<PublicLayout />}>
          {/* Punto de entrada: cada rol va a su inicio; sin sesión, al del participante. */}
          <Route path="/" element={<RoleHomeRedirect />} />
          <Route
            path={PARTICIPANTE_PATHS.inicio}
            element={
              <ParticipantOnly>
                <InicioParticipantePage />
              </ParticipantOnly>
            }
          />
          <Route path="/eventos/:id" element={<DetalleEventoPage />} />
          <Route
            path="/eventos/:id/comprar"
            element={
              <ParticipantOnly>
                <CheckoutPage />
              </ParticipantOnly>
            }
          />
          {/* Mi cuenta: solo con sesión iniciada. */}
          <Route
            path="/mi-cuenta"
            element={
              <RequireAuth>
                <MiCuentaLayout />
              </RequireAuth>
            }
          >
            <Route index element={<Navigate to="informacion-personal" replace />} />
            <Route path="informacion-personal" element={<InformacionPersonalPage />} />
            <Route path="contrasena" element={<CambiarContrasenaPage />} />
            {/* Participante: eventos de sus entradas. El organizador va a su inicio. */}
            <Route path="mis-eventos" element={<MisEventosRoute />} />
            <Route
              path="mis-eventos/:eventoId"
              element={
                <ParticipantOnly redirectTo={ORGANIZADOR_PATHS.inicio}>
                  <DetalleMisEventoPage />
                </ParticipantOnly>
              }
            />
            {/* Rutas viejas del organizador */}
            <Route path="mis-eventos/nuevo" element={<Navigate to={ORGANIZADOR_PATHS.nuevoEvento} replace />} />
            <Route path="mis-eventos/:eventoId/editar" element={<RedirectEditarEvento />} />
          </Route>

          {/* Organizador */}
          <Route
            path={ORGANIZADOR_PATHS.inicio}
            element={
              <OrganizerOnly>
                <InicioOrganizadorPage />
              </OrganizerOnly>
            }
          />
          <Route
            path={ORGANIZADOR_PATHS.nuevoEvento}
            element={
              <OrganizerOnly>
                <NuevoEventoPage />
              </OrganizerOnly>
            }
          />
          <Route
            path="/mis-eventos/:eventoId/editar"
            element={
              <OrganizerOnly>
                <EditarEventoPage />
              </OrganizerOnly>
            }
          />
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
