import { useNavigate } from 'react-router-dom';
import LoginForm from '../../components/auth/LoginForm.jsx';
import { roleHomePath } from '../../components/auth/roleHome.js';
import { useAuth } from '../../auth/useAuth.js';

// Mismo formulario que el modal de compra. Un login exitoso lleva siempre al
// inicio del rol (participante u organizador).
function LoginPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  return (
    <section className="auth-card auth-card--login">
      <h2>Iniciar sesión</h2>
      {user ? (
        <div className="auth-form">
          <p className="banner banner--success">
            Ya iniciaste sesión como <strong>{user.firstName} {user.lastName}</strong> ({user.email}).
          </p>
          <button type="button" className="btn" onClick={logout}>
            Cerrar sesión
          </button>
        </div>
      ) : (
        <LoginForm
          onSuccess={(loggedUser) =>
            navigate(roleHomePath(loggedUser), { replace: true })
          }
        />
      )}
    </section>
  );
}

export default LoginPage;
