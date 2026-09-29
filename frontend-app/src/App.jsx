import VenuesPage from './pages/VenuesPage.jsx';
import './App.css';

// App es el "shell" de la aplicación: por ahora solo pone un encabezado
// fijo y debajo renderiza la página de Lugares. Cuando sumemos más CRUDs
// probablemente acá aparezca una barra de navegación y algún router.
function App() {
  return (
    <>
      <header className="app-header">
        <div className="app-header__brand">🎫 Gestión de Eventos</div>
      </header>
      <main className="app-main">
        <VenuesPage />
      </main>
    </>
  );
}

export default App;
