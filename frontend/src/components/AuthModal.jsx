import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import styles from './AuthModal.module.css';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export default function AuthModal({ onClose }) {
  const { login, register, googleLogin } = useAuth();
  const [tab,    setTab]    = useState('login');
  const [loading,setLoading]= useState(false);
  const [err,    setErr]    = useState('');
  const [form,   setForm]   = useState({ name:'', email:'', password:'', role:'user' });

  // Init Google One-Tap after mount
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !window.google) return;
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleResponse,
    });
    window.google.accounts.id.renderButton(
      document.getElementById('google-btn-container'),
      { theme: 'outline', size: 'large', width: 362, text: 'continue_with' }
    );
  }, []);

  const handleGoogleResponse = async ({ credential }) => {
    setLoading(true);
    try {
      await googleLogin(credential);
      onClose();
    } catch (e) {
      setErr(e.response?.data?.error || 'Google sign-in failed.');
    } finally { setLoading(false); }
  };

  const set = (k) => (e) => { setForm(f => ({ ...f, [k]: e.target.value })); setErr(''); };

  const submit = async (e) => {
    e.preventDefault();
    setErr(''); setLoading(true);
    try {
      if (tab === 'login') {
        await login({ email: form.email, password: form.password });
      } else {
        if (!form.name.trim()) { setErr('Name is required.'); setLoading(false); return; }
        if (form.password.length < 6) { setErr('Password must be 6+ characters.'); setLoading(false); return; }
        await register({ name: form.name, email: form.email, password: form.password, role: form.role });
      }
      onClose();
    } catch (e) {
      setErr(e.response?.data?.error || 'Something went wrong.');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        {/* Header */}
        <div className={styles.head}>
          <div className={styles.logo}>SP</div>
          <div className={styles.title}>SmartPark</div>
          <div className={styles.subtitle}>Smart Urban Parking Platform</div>
        </div>

        {/* Google Sign-In */}
        {GOOGLE_CLIENT_ID ? (
          <div className={styles.googleWrap}>
            <div id="google-btn-container" />
          </div>
        ) : (
          <div className={styles.googleNote}>
            <strong>🔧 Setup Google Sign-In:</strong> Add <code>VITE_GOOGLE_CLIENT_ID</code> to your <code>.env</code> file.
            <br />Get a Client ID from <a href="https://console.cloud.google.com" target="_blank" rel="noreferrer">Google Cloud Console</a>.
          </div>
        )}

        <div className={styles.divider}><span>or continue with email</span></div>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button className={`${styles.tab} ${tab==='login'?styles.active:''}`} onClick={() => { setTab('login'); setErr(''); }}>Sign In</button>
          <button className={`${styles.tab} ${tab==='register'?styles.active:''}`} onClick={() => { setTab('register'); setErr(''); }}>Register</button>
        </div>

        {/* Form */}
        <form onSubmit={submit}>
          {tab === 'register' && (
            <div className="fg">
              <label>Full Name</label>
              <input type="text" placeholder="Your full name" value={form.name} onChange={set('name')} required />
            </div>
          )}
          <div className="fg">
            <label>Email</label>
            <input type="email" placeholder="you@gmail.com" value={form.email} onChange={set('email')} required autoComplete="email" />
          </div>
          <div className="fg">
            <label>Password</label>
            <input type="password" placeholder={tab==='login'?'Your password':'Min 6 characters'} value={form.password} onChange={set('password')} required autoComplete={tab==='login'?'current-password':'new-password'} />
          </div>
          {tab === 'register' && (
            <div className="fg">
              <label>I am a</label>
              <select value={form.role} onChange={set('role')}>
                <option value="user">User – I want to find parking</option>
                <option value="owner">Owner – I want to list spaces</option>
              </select>
            </div>
          )}

          {err && <div className={styles.err}>{err}</div>}

          <button type="submit" className={`btn btn-g ${styles.submitBtn}`} disabled={loading}>
            {loading ? 'Please wait…' : tab === 'login' ? 'Sign In →' : 'Create Account →'}
          </button>
        </form>
      </div>
    </div>
  );
}
