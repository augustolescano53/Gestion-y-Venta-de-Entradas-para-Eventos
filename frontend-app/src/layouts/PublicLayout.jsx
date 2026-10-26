import { Outlet } from 'react-router-dom';
import SiteFooter from '../components/layout/SiteFooter.jsx';
import SiteHeader from '../components/layout/SiteHeader.jsx';

// Contenedor de las páginas del comprador, Mi cuenta y el organizador, con
// el Header y el Footer compartidos. El main crece (flex-1): en páginas
// cortas el Footer queda al pie de la ventana y en las largas, después del
// contenido. Con showHeader={false} (login y registro) solo va el Footer.
function PublicLayout({ showHeader = true }) {
  return (
    <div className="flex min-h-screen flex-col">
      {showHeader && <SiteHeader />}
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-6 pb-12 text-tinta">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  );
}

export default PublicLayout;
