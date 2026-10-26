import { useState } from 'react';
import Modal from '../Modal.jsx';
import LoginForm from './LoginForm.jsx';
import RegisterForm from './RegisterForm.jsx';

// Login y registro dentro del mismo modal, con los mismos formularios que
// /login y /register.
function AuthModal({ onSuccess, onClose, initialMode = 'login' }) {
  const [mode, setMode] = useState(initialMode);

  return (
    <Modal
      title={mode === 'login' ? 'Iniciá sesión para continuar' : 'Creá tu cuenta'}
      onClose={onClose}
      closeOnBackdrop={false}
    >
      {mode === 'login' ? (
        <LoginForm onSuccess={onSuccess} onSwitchToRegister={() => setMode('register')} />
      ) : (
        <RegisterForm onSuccess={onSuccess} onSwitchToLogin={() => setMode('login')} />
      )}
    </Modal>
  );
}

export default AuthModal;
