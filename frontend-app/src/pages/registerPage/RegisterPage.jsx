import { useNavigate } from 'react-router-dom';
import RegisterForm from '../../components/auth/RegisterForm.jsx';
import { roleHomePath } from '../../components/auth/roleHome.js';

// Mismo formulario que el modal de compra. Al registrarse ya queda la sesión
// iniciada (como participante) y se va a su inicio.
function RegisterPage() {
  const navigate = useNavigate();

  return (
    <section className="auth-card auth-card--register">
      <h2>Crear cuenta</h2>
      <RegisterForm onSuccess={(newUser) => navigate(roleHomePath(newUser), { replace: true })} />
    </section>
  );
}

export default RegisterPage;
