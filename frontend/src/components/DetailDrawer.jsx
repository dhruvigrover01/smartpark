import { isNowOpen, getTier } from '../utils';
import { useAuth } from '../context/AuthContext';
import styles from './DetailDrawer.module.css';

export default function DetailDrawer({ spot, onClose, onBook }) {
  const { isLoggedIn } = useAuth();
  if (!spot) return null;

  const open = isNowOpen(spot.time?.open, spot.time?.close);
  const tier = getTier(spot.security);
  const sec  = spot.security || {};
  const score = (sec.cctv?1:0)+(sec.guard?1:0)+(sec.gated?1:0);

  return (
    <div className={styles.backdrop} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.drawer}>
        <div className={styles.handle} />

        <div className={styles.topRow}>
          <div>
            <h2 className={styles.name}>{spot.name}</h2>
            <p className={styles.addr}>📍 {spot.address}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className={styles.price} style={{ color: tier.color }}>₹{spot.price}/hr</div>
            <div style={{ fontSize: 11, color: tier.color, fontWeight: 700 }}>{tier.label}</div>
          </div>
        </div>

        {/* Quick badges */}
        <div className={styles.badgeRow}>
          <span className={`pill ${open?'pill-g':'pill-r'}`}>{open?'● Open Now':'● Closed'}</span>
          {spot.verified && <span className="pill pill-b">✅ Verified</span>}
          {spot.tags?.includes('best_value')  && <span className="pill pill-g">💰 Best Value</span>}
          {spot.tags?.includes('most_secure') && <span className="pill pill-b">🛡️ Most Secure</span>}
          {spot.tags?.includes('closest')     && <span className="pill pill-a">📍 Closest</span>}
          {spot.isOSM && <span className="pill pill-p">🗺 OSM Live Data</span>}
        </div>

        {/* Stats grid */}
        <div className={styles.stats}>
          <div className={styles.stat}>
            <div className={styles.sv} style={{ color: (spot.slots?.available||0)>0?'var(--green)':'var(--red)' }}>
              {spot.slots?.available ?? '—'}
            </div>
            <div className={styles.sl}>Available</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.sv} style={{ color: 'var(--amber)' }}>⭐ {spot.rating}</div>
            <div className={styles.sl}>{spot.reviews} reviews</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.sv} style={{ color: tier.color }}>{score}/3</div>
            <div className={styles.sl}>Security</div>
          </div>
        </div>

        {/* Security features */}
        <div className={styles.section}>
          <div className={styles.sTitle}>Security Features</div>
          <div className={styles.secGrid}>
            {[['📹','CCTV','cctv'],['👮','Guard','guard'],['🚪','Gated','gated']].map(([icon,label,key])=>(
              <div key={key} className={`${styles.secItem} ${sec[key]?styles.on:styles.off}`}>
                <span style={{fontSize:18}}>{icon}</span>
                <span>{label} {sec[key]?'✓':'✗'}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing explanation */}
        <div className={styles.priceWhy}>
          💡 <strong>Why ₹{spot.price}/hr?</strong> Security score {score}/3
          ({[sec.cctv&&'CCTV',sec.guard&&'Guard',sec.gated&&'Gated'].filter(Boolean).join(', ')||'none'}).
          <strong style={{color:tier.color}}> {tier.label} tier</strong> = transparent, fair pricing.
        </div>

        {/* Congestion warning */}
        {spot.congestion && (
          <div className={styles.congAlert}>
            ⚠️ <strong>Traffic Alert:</strong> Congestion zone nearby caused by illegal roadside parking. Using this organised space helps reduce urban traffic.
          </div>
        )}

        {/* Time & vehicles */}
        <div className={styles.section}>
          <div className={styles.sTitle}>Availability</div>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span style={{fontSize:14,fontWeight:600}}>🕐 {spot.time?.label || `${spot.time?.open}–${spot.time?.close}`}</span>
            <span className={`pill ${open?'pill-g':'pill-r'}`}>{open?'Open Now':'Closed'}</span>
          </div>
          {spot.vehicles?.length > 0 && (
            <div style={{fontSize:12,color:'var(--muted)',marginTop:8}}>
              Vehicles: {spot.vehicles.join(', ')}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <button
            className={styles.navBtn}
            onClick={() => window.open(`https://www.openstreetmap.org/directions?to=${spot.location?.coordinates[1]}%2C${spot.location?.coordinates[0]}`, '_blank')}
          >
            🧭 Navigate
          </button>
          <button
            className={styles.bookBtn}
            disabled={!open || (spot.slots?.available||0) === 0}
            onClick={() => onBook(spot)}
          >
            {open && (spot.slots?.available||0) > 0 ? '📅 Book Now' : 'Unavailable'}
          </button>
        </div>

        {spot.isOSM && (
          <p style={{fontSize:11,color:'var(--muted2)',textAlign:'center',marginTop:10}}>
            📡 Real location data from OpenStreetMap contributors
          </p>
        )}
      </div>
    </div>
  );
}
