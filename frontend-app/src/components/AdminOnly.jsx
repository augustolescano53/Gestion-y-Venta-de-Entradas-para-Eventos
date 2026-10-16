import { useAuth } from '../auth/useAuth.js';
import { ROLES } from '../shared/currentUser.js';
import RequireAuth from './auth/RequireAuth.jsx';
import SiteFooter from './layout/SiteFooter.jsx';
import SiteHeader from './layout/SiteHeader.jsx';
import { ErrorState } from './miCuenta/AccountStates.jsx';

// Panel de administración (todas las CRUD): equivalente a OrganizerOnly, pero
// envuelve al layout entero. Sin sesión se pide iniciarla; con otro rol se
// muestra el aviso con el Header y el Footer de siempre. El backend rechaza
// igual cualquier operación sin token de admin.
function AdminOnly({ children }) {
  const { user } = useAuth();
  if (!user) return <RequireAuth>{children}</RequireAuth>;
  if (user.role === ROLES.ADMIN) return children;
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-6 pb-12 text-tinta">
        <ErrorState message="Esta sección es solo para administradores." />
      </main>
      <SiteFooter />
    </div>
  );
}

export default AdminOnly;
