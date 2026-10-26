import { useContext } from 'react';
import { AuthContext } from './AuthContext.js';

// { user, login, register, logout }. user es null si no hay sesión.
export function useAuth() {
  return useContext(AuthContext);
}
