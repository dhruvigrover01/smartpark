import { isNowOpen, getTier } from '../utils';
import styles from './ParkingCard.module.css';

export default function ParkingCard({ spot, selected, onClick }) {
  const open = isNowOpen(spot.time?.open, spot.time?.close);
  const tier = getTier(spot.security);
  const pct  = Math.round(((spot.slots?.available || 0) / (spot.slots?.total || 1)) * 100);
  const fc   = pct > 60 ? 'var(--green)' : pct > 30 ? 'var(--amber)' : 'var(--red)';

  return (
    <div
      className={`${styles.card} ${selected ? styles.sel : ''} ${!open ? styles.closed : ''}`}
      onClick={onClick}
    >
      <div className={styles.row1}>
        <span className={styles.name}>{spot.name}</span>
        <span className={styles.rate} style={{ color: tier.color }}>₹{spot.price}/hr</span>
      </div>

      <div className={styles.addr}>
        📍 {spot.address}
        {spot.dist != null && <strong style={{ color: 'var(--green)', marginLeft: 4 }}>{spot.dist.toFixed(2)} km</strong>}
      </div>

      <div className={styles.pills}>
        <span className={`pill ${open ? 'pill-g' : 'pill-r'}`}>{open ? '● Open' : '● Closed'}</span>
        {spot.verified && <span className="pill pill-b">✅ Verified</span>}
        {spot.tags?.includes('best_value')  && <span className="pill pill-g">💰 Best Value</span>}
        {spot.tags?.includes('most_secure') && <span className="pill pill-b">🛡️ Most Secure</span>}
        {spot.tags?.includes('closest')     && <span className="pill pill-a">📍 Closest</span>}
        {spot.congestion && <span className="pill pill-r">⚠️ Congestion</span>}
        {spot.isOSM && <span className="pill pill-p">🗺 OSM</span>}
      </div>

      <div className={styles.footer}>
        <span style={{ color: fc, fontWeight: 700 }}>{spot.slots?.available}</span>
        <span style={{ color: 'var(--muted)' }}>/{spot.slots?.total} slots</span>
        <div className={styles.bar}><div className={styles.fill} style={{ width: `${pct}%`, background: fc }} /></div>
        <span>⭐ {spot.rating}</span>
        <span style={{ color: tier.color }}>🔒 {tier.label}</span>
      </div>
    </div>
  );
}
