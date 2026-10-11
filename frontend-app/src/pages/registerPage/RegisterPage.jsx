import { useLocation, useNavigate } from 'react-router-dom';
import RegisterForm from '../../components/auth/RegisterForm.jsx';
import { roleHomePath } from '../../components/auth/roleHome.js';

// Mismo formulario que el modal de compra. Al registrarse ya queda la sesión
// iniciada (como participante): vuelve a la página de origen o a su inicio.
function RegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <section className="auth-card auth-card--wide">
      <h2>Crear cuenta</h2>
      <RegisterForm
        onSuccess={(newUser) => navigate(location.state?.from ?? roleHomePath(newUser), { replace: true })}
      />
    </section>
  );
}

export default RegisterPage;
