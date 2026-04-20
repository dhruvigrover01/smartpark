import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import AuthModal from './AuthModal';
import styles from './Navbar.module.css';

export default function Navbar() {
  const { user, signOut } = useAuth();
  const { dark, toggle }  = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen]   = useState(false);
  const [authOpen, setAuthOpen]   = useState(false);
  const [dropOpen, setDropOpen]   = useState(false);

  const nav = [
    { to: '/',        label: 'Home' },
    { to: '/map',     label: '🗺 Find Parking' },
    { to: '/features',label: 'Features' },
    { to: '/list',    label: 'List Your Space' },
    { to: '/places',  label: 'My Places' },
  ];

  const isActive = (to) =>
    to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);

  return (
    <>
      <nav className={styles.nav}>
        <Link to="/" className={styles.brand}>
          <div className={styles.brandIcon}>SP</div>
          <span className={styles.brandName}>Smart<em>Park</em></span>
        </Link>

        <div className={`${styles.links} ${menuOpen ? styles.open : ''}`}>
          {nav.map(n => (
            <Link
              key={n.to} to={n.to}
              className={`${styles.link} ${isActive(n.to) ? styles.active : ''}`}
              onClick={() => setMenuOpen(false)}
            >{n.label}</Link>
          ))}
        </div>

        <div className={styles.right}>
          {/* Theme toggle */}
          <button className={styles.iconBtn} onClick={toggle} title="Toggle theme">
            {dark ? '🌙' : '☀️'}
          </button>

          {user ? (
            <div className={styles.userWrap} onClick={() => setDropOpen(d => !d)}>
              {user.picture
                ? <img src={user.picture} className={styles.avatar} alt={user.name} />
                : <div className={styles.avatarFb}>{(user.name||'?')[0].toUpperCase()}</div>}
              <span className={styles.userName}>{user.name?.split(' ')[0]}</span>
              {dropOpen && (
                <div className={styles.drop}>
                  <div className={styles.dropUser}>
                    <div className={styles.dropName}>{user.name}</div>
                    <div className={styles.dropEmail}>{user.email}</div>
                  </div>
                  <Link to="/places" className={styles.dropItem} onClick={() => setDropOpen(false)}>📍 My Places</Link>
                  <Link to="/list"   className={styles.dropItem} onClick={() => setDropOpen(false)}>➕ List a Space</Link>
                  <button className={styles.dropSignOut} onClick={() => { signOut(); setDropOpen(false); }}>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button className="btn btn-ghost btn-sm" onClick={() => setAuthOpen(true)}>Sign In</button>
          )}

          <button className="btn btn-g btn-sm" onClick={() => navigate('/map')}>
            Find Parking →
          </button>

          <button className={styles.ham} onClick={() => setMenuOpen(m => !m)}>
            <span /><span /><span />
          </button>
        </div>
      </nav>

      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
    </>
  );
}
