import { useLocation, useNavigate } from 'react-router-dom';
import RegisterForm from '../../components/auth/RegisterForm.jsx';
import { PUBLIC_PATHS } from '../../shared/routes.js';

// Mismo formulario que el modal de compra. Al registrarse ya queda la sesión
// iniciada.
function RegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <section className="auth-card auth-card--wide">
      <h2>Crear cuenta</h2>
      <RegisterForm onSuccess={() => navigate(location.state?.from ?? PUBLIC_PATHS.home, { replace: true })} />
    </section>
  );
}

export default RegisterPage;
