import { useNavigate } from 'react-router-dom';
import styles from './FeaturesPage.module.css';

const FEATURES = [
  {
    num: '01', label: 'Discovery', icon: '🗺️',
    title: 'Live Map Discovery',
    desc: 'Search any city, landmark or GPS location and instantly see real parking spots fetched live from OpenStreetMap\'s Overpass API. Every result is a verified physical parking amenity.',
    points: [
      'Overpass API queries real parking nodes, ways and relations',
      'Nominatim geocoding turns any text query into coordinates',
      'GPS "My Location" support for instant nearby discovery',
      'Haversine distance calculation for every result',
      'Color-coded markers by pricing tier on interactive Leaflet map',
    ],
    visual: 'map',
  },
  {
    num: '02', label: 'Pricing', icon: '🛡️',
    title: 'Security-Based Pricing',
    desc: 'Pricing is computed transparently from real security infrastructure. Users instantly understand why a spot costs what it does — no hidden fees, no negotiation.',
    points: [
      'CCTV surveillance detected from OSM tags or declared by owner',
      'Security guards tracked per listing',
      'Gated access inferred from access=private OSM tags',
      'Auto-calculated: Basic ₹10 → Standard ₹25 → Premium ₹40 → Elite ₹60',
      'Price explanation shown on every detail drawer',
    ],
    visual: 'tiers',
  },
  {
    num: '03', label: 'Availability', icon: '🕐',
    title: 'Time Slot System',
    desc: 'Every parking space has exact availability windows. Home driveways available nights and weekends, office garages open weekdays — always know before you go.',
    points: [
      'Custom open/close times per listing',
      '24/7 detection from OSM opening_hours tag',
      'Live open/closed status on every card and marker',
      'Overnight slot support for after-midnight close times',
      'Availability shown per vehicle type',
    ],
    visual: 'slots',
  },
  {
    num: '04', label: 'Smart AI', icon: '⚡',
    title: 'Smart Recommendations',
    desc: 'Three intelligent badges are auto-assigned after every search. No guessing — you see Best Value, Most Secure, and Closest spots at a glance.',
    points: [
      'Best Value: lowest rate among currently open spots',
      'Most Secure: highest security score (3/3 features)',
      'Closest: shortest Haversine distance from destination',
      'Badges refresh on every new search automatically',
      'Works on both backend listings and live OSM data',
    ],
    visual: 'recs',
  },
  {
    num: '05', label: 'Awareness', icon: '⚠️',
    title: 'Congestion Zone Awareness',
    desc: 'SmartPark overlays active congestion zones on the map — visually warning drivers away from areas where illegal roadside parking creates traffic gridlock.',
    points: [
      'Dashed animated circles mark active congestion zones',
      'Toggle congestion layer on and off from filter bar',
      'Warning banner appears on nearby parking listings',
      'High and moderate severity with distinct styling',
      'Encourages organised parking to reduce urban congestion',
    ],
    visual: 'cong',
  },
  {
    num: '06', label: 'Community', icon: '💸',
    title: 'Community Space Registration',
    desc: 'Anyone can list unused parking — home driveways, shop forecourts, office garages. Set your own hours, get automatic pricing, earn money from infrastructure you already own.',
    points: [
      'Full listing form: name, address, GPS coords, vehicle types',
      'Security declaration drives automatic pricing',
      'Admin verification before listing goes live',
      'Manage all listings from My Places dashboard',
      'Track bookings, revenue and ratings per space',
    ],
    visual: 'list',
  },
];

function Visual({ type }) {
  if (type === 'map') return (
    <div className={styles.mockMap}>
      <div className={styles.mapGrid} />
      {[['#00e5a0','₹60',38,52],['#f59e0b','₹40',55,30],['#3b82f6','₹25',22,70],['#ef4444','₹10',70,65]].map(([c,p,l,t]) => (
        <div key={p} className={styles.mapPin} style={{ background:c, left:`${l}%`, top:`${t}%` }}>
          <span className={styles.pinLabel}>{p}</span>
        </div>
      ))}
      <div className={styles.destPin}>🎯</div>
    </div>
  );

  if (type === 'tiers') return (
    <div className={styles.tiersGrid}>
      {[['Basic','₹10/hr','#ef4444','🔴','No security'],['Standard','₹25/hr','#3b82f6','🔵','CCTV'],['Premium','₹40/hr','#f59e0b','🟡','CCTV + Guard'],['Elite','₹60/hr','#00e5a0','🟢','All 3 features']].map(([lbl,rate,c,dot,feat]) => (
        <div key={lbl} className={styles.tierCard} style={{ borderColor: c + '44' }}>
          <div className={styles.tierDot}>{dot}</div>
          <div className={styles.tierLabel}>{lbl}</div>
          <div className={styles.tierRate} style={{ color: c }}>{rate}</div>
          <div className={styles.tierFeat}>{feat}</div>
        </div>
      ))}
    </div>
  );

  if (type === 'slots') return (
    <div className={styles.slotList}>
      {[['Home Driveway','18:00–08:00','🏠','pill-g'],['Mall Parking','09:00–23:00','🏬','pill-g'],['Office Block','08:00–18:00','🏢','pill-r'],['Night Bazaar','20:00–02:00','🌙','pill-g'],['24hr Lot','00:00–23:59','⏰','pill-g']].map(([n,t,i,p]) => (
        <div key={n} className={styles.slotRow}>
          <span className={styles.slotIcon}>{i}</span>
          <span className={styles.slotName}>{n}</span>
          <span className={styles.slotTime}>{t}</span>
          <span className={`pill ${p}`}>{p==='pill-g'?'Open':'Closed'}</span>
        </div>
      ))}
    </div>
  );

  if (type === 'recs') return (
    <div className={styles.recCards}>
      <div className={styles.recCard} style={{ borderColor: 'rgba(0,229,160,.4)' }}>
        <div className="pill pill-g" style={{ marginBottom: 8 }}>💰 Best Value</div>
        <div className={styles.recName}>Street Parking A</div>
        <div className={styles.recRate} style={{ color: 'var(--green)' }}>₹10/hr</div>
      </div>
      <div className={styles.recCard} style={{ borderColor: 'rgba(59,130,246,.4)' }}>
        <div className="pill pill-b" style={{ marginBottom: 8 }}>🛡️ Most Secure</div>
        <div className={styles.recName}>Gated Complex</div>
        <div className={styles.recRate} style={{ color: 'var(--blue)' }}>₹60/hr</div>
      </div>
      <div className={styles.recCard} style={{ borderColor: 'rgba(245,158,11,.4)' }}>
        <div className="pill pill-a" style={{ marginBottom: 8 }}>📍 Closest · 0.1km</div>
        <div className={styles.recName}>Mall Basement</div>
        <div className={styles.recRate} style={{ color: 'var(--amber)' }}>₹40/hr</div>
      </div>
    </div>
  );

  if (type === 'cong') return (
    <div className={styles.congWrap}>
      <div className={styles.congGrid} />
      <div className={styles.congZone} style={{ width:140,height:140,top:'15%',left:'10%',borderColor:'var(--red)' }} />
      <div className={styles.congZone} style={{ width:90,height:90,top:'55%',left:'55%',borderColor:'var(--amber)',animationDelay:'.8s' }} />
      <div className={styles.congBadge} style={{ top:'18%',left:'14%',background:'rgba(239,68,68,.15)',color:'var(--red)' }}>⚠️ High</div>
      <div className={styles.congBadge} style={{ top:'58%',left:'58%',background:'rgba(245,158,11,.15)',color:'var(--amber)' }}>⚠️ Moderate</div>
    </div>
  );

  if (type === 'list') return (
    <div className={styles.listMock}>
      <div className={styles.lmTitle}>Security → Price</div>
      {[['📹','CCTV',true],['👮','Guard',true],['🚪','Gated',false]].map(([icon,lbl,on]) => (
        <div key={lbl} className={styles.lmRow}>
          <span>{icon} {lbl}</span>
          <span className={styles.lmCheck} style={{ background: on ? 'rgba(0,229,160,.15)' : 'rgba(255,255,255,.05)', color: on ? 'var(--green)' : 'var(--muted2)', borderColor: on ? 'rgba(0,229,160,.3)' : 'var(--border)' }}>{on ? '✓' : '✗'}</span>
        </div>
      ))}
      <div className={styles.lmResult}>
        <span style={{ color: 'var(--muted)', fontSize: 12 }}>Auto-calculated rate</span>
        <span style={{ fontSize: 28, fontWeight: 800, color: 'var(--amber)' }}>₹40/hr</span>
      </div>
    </div>
  );

  return null;
}

export default function FeaturesPage() {
  const navigate = useNavigate();
  return (
    <div style={{ paddingTop: 'var(--nav-h)' }}>
      {/* Hero */}
      <div className={styles.hero}>
        <div className="sec-label" style={{ justifyContent: 'center' }}>Platform Features</div>
        <h1 className={styles.heroH}>Six Reasons SmartPark Works</h1>
        <p className={styles.heroP}>Built on real data, transparent pricing and community ownership — every feature solves a real urban parking problem.</p>
      </div>

      {/* Feature sections */}
      {FEATURES.map((f, i) => (
        <div key={f.num} className={`${styles.featRow} ${i % 2 !== 0 ? styles.reverse : ''}`}>
          <div className={styles.featContent}>
            <div className={styles.featNum}>{f.num}</div>
            <div className="sec-label">{f.label}</div>
            <h2 className={styles.featH}>{f.icon} {f.title}</h2>
            <p className={styles.featP}>{f.desc}</p>
            <ul className={styles.points}>
              {f.points.map(p => <li key={p}>{p}</li>)}
            </ul>
          </div>
          <div className={styles.featVisual}>
            <Visual type={f.visual} />
          </div>
        </div>
      ))}

      {/* Bottom CTA */}
      <div className={styles.cta}>
        <h2>See it all live on the map</h2>
        <p>Open the live map and explore every feature in real-time.</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-g btn-lg" onClick={() => navigate('/map')}>Open Live Map →</button>
          <button className="btn btn-ghost btn-lg" onClick={() => navigate('/list')}>List Your Space</button>
        </div>
      </div>
    </div>
  );
}
