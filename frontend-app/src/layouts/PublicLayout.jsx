import { Outlet } from 'react-router-dom';

// Contenedor de las páginas del comprador. La navbar pública se agrega acá.
function PublicLayout() {
  return (
    <main className="mx-auto max-w-5xl px-4 pt-6 pb-12 text-tinta">
      <Outlet />
    </main>
  );
}

export default PublicLayout;
