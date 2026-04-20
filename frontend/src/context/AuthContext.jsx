import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { authAPI } from '../api';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session
  useEffect(() => {
    const token = localStorage.getItem('sp_token');
    const stored = localStorage.getItem('sp_user');
    if (token && stored) {
      setUser(JSON.parse(stored));
      // Verify token is still valid
      authAPI.getMe()
        .then(({ data }) => { setUser(data.user); localStorage.setItem('sp_user', JSON.stringify(data.user)); })
        .catch(() => signOut(false))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
    // Listen for forced logout (401)
    const handler = () => { setUser(null); };
    window.addEventListener('sp:logout', handler);
    return () => window.removeEventListener('sp:logout', handler);
  }, []);

  const persist = (token, userData) => {
    localStorage.setItem('sp_token', token);
    localStorage.setItem('sp_user', JSON.stringify(userData));
    setUser(userData);
  };

  const register = async ({ name, email, password, role }) => {
    const { data } = await authAPI.register({ name, email, password, role });
    persist(data.token, data.user);
    toast.success(`Welcome, ${data.user.name.split(' ')[0]}! 🎉`);
    return data.user;
  };

  const login = async ({ email, password }) => {
    const { data } = await authAPI.login({ email, password });
    persist(data.token, data.user);
    toast.success(`Welcome back, ${data.user.name.split(' ')[0]}! 👋`);
    return data.user;
  };

  const googleLogin = async (idToken) => {
    const { data } = await authAPI.googleAuth(idToken);
    persist(data.token, data.user);
    toast.success(`Welcome, ${data.user.name.split(' ')[0]}! 👋`);
    return data.user;
  };

  const signOut = useCallback((showToast = true) => {
    localStorage.removeItem('sp_token');
    localStorage.removeItem('sp_user');
    setUser(null);
    if (showToast) toast.success('Signed out successfully');
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, register, login, googleLogin, signOut, isLoggedIn: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}
