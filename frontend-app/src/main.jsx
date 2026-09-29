import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import './styles/shared.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* BrowserRouter habilita la navegación por URL (react-router-dom):
        envuelve toda la app para que App.jsx pueda usar <Routes>, <Route>
        y <NavLink> para mostrar una pantalla distinta según la dirección. */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
