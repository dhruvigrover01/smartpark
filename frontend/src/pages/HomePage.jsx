import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './HomePage.module.css';

const STATS = [
  { id: 'spots',  end: 3200, suffix: '+', label: 'Parking Spots' },
  { id: 'cities', end: 28,   suffix: '+', label: 'Cities' },
  { id: 'users',  end: 14600,suffix: '+', label: 'Active Users' },
  { id: 'saved',  end: 47,   suffix: '%', label: 'Congestion Reduced' },
];

const FEATURES = [
  { icon: '🗺️', title: 'Live Map Discovery',       desc: 'Search any destination and instantly see real parking spots from OpenStreetMap with live availability.', to: '/map' },
  { icon: '🛡️', title: 'Security-Based Pricing',   desc: 'Transparent pricing computed from CCTV, guards and gated access — you always know why a spot costs what it does.', to: '/features' },
  { icon: '⚡', title: 'Smart Recommendations',    desc: 'AI-powered Best Value, Most Secure, and Closest badges auto-assigned so you decide in under 5 seconds.', to: '/features' },
  { icon: '🕐', title: 'Time Slot System',          desc: 'Every space shows exact availability windows — home lots by day, office garages by night.', to: '/features' },
  { icon: '⚠️', title: 'Congestion Awareness',     desc: 'Visual congestion heat-zones overlay the map, warning drivers away from illegal roadside parking hotspots.', to: '/features' },
  { icon: '💸', title: 'Earn from Your Space',      desc: 'List unused parking — home, shop, office — and earn money from idle infrastructure you already own.', to: '/list' },
];

const MARQUEE_ITEMS = [
  '🗺️ Live OpenStreetMap Integration','🛡️ Security-Based Pricing','⚡ Instant Booking',
  '📍 Real GPS Parking Discovery','💰 Earn from Unused Spaces','⚠️ Congestion Zone Alerts',
  '🏠 Home & Shop Parking','🕐 Time Slot Management',
];

function useCountUp(target, suffix, active) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active) return;
    let current = 0;
    const step = Math.ceil(target / 55);
    const t = setInterval(() => {
      current = Math.min(current + step, target);
      setVal(current);
      if (current >= target) clearInterval(t);
    }, 22);
    return () => clearInterval(t);
  }, [active, target]);
  return val.toLocaleString() + suffix;
}

function StatItem({ end, suffix, label }) {
  const [fired, setFired] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setFired(true); }, { threshold: .3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  const display = useCountUp(end, suffix, fired);
  return (
    <div className={styles.statItem} ref={ref}>
      <div className={styles.statNum}>{display}</div>
      <div className={styles.statLbl}>{label}</div>
    </div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [visible, setVisible] = useState({});
  const sectionRef = useRef(null);

  const handleSearch = () => {
    if (!query.trim()) return;
    navigate(`/map?q=${encodeURIComponent(query.trim())}`);
  };

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach(e => {
        if (e.isIntersecting) setVisible(v => ({ ...v, [e.target.dataset.rv]: true }));
      }),
      { threshold: .1 }
    );
    document.querySelectorAll('[data-rv]').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <div className={styles.page}>
      {/* ── Hero ── */}
      <section className={styles.hero}>
        <div className={styles.heroBg} />
        <div className={styles.heroDots} />
        <div className={styles.heroInner}>
          <div className={`${styles.eyebrow} fade-up`}>
            <span className="live-dot" />
            Smart City Parking Platform
          </div>
          <h1 className={`${styles.heroH} fade-up fade-up-d1`}>
            Park Smarter.<br /><em>Move Freely.</em>
          </h1>
          <p className={`${styles.heroP} fade-up fade-up-d2`}>
            SmartPark maps real-time parking near any destination — verified spaces, live availability, transparent pricing. No more circling blocks, no illegal parking, no stress.
          </p>
          <div className={`${styles.heroBtns} fade-up fade-up-d3`}>
            <button className="btn btn-g btn-lg" onClick={() => navigate('/map')}>🗺&nbsp; Find Parking Near Me</button>
            <button className="btn btn-ghost btn-lg" onClick={() => navigate('/list')}>➕&nbsp; List Your Space</button>
          </div>
          <div className={`${styles.heroSearch} fade-up fade-up-d4`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted2)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              type="text" placeholder="Enter destination — e.g. Connaught Place, Delhi"
              value={query} onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
            <button className="btn btn-g btn-sm" onClick={handleSearch}>Search</button>
          </div>
        </div>
      </section>

      {/* ── Marquee ── */}
      <div className={styles.marqueeWrap}>
        <div className={styles.marquee}>
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <span key={i} className={styles.marqueeItem}>{item}</span>
          ))}
        </div>
      </div>

      {/* ── Stats ── */}
      <div className={styles.statsStrip} data-rv="stats">
        {STATS.map(s => <StatItem key={s.id} {...s} />)}
      </div>

      {/* ── Feature teasers ── */}
      <section className={styles.featSection} data-rv="feats" ref={sectionRef}>
        <div className="sec-label">Platform Features</div>
        <h2 className={styles.secH}>Everything parking.<br />In one platform.</h2>
        <p className={styles.secP}>Six powerful features designed to eliminate urban parking chaos — each built for real-world smart city deployment.</p>
        <div className={styles.featGrid}>
          {FEATURES.map(f => (
            <div key={f.title} className={styles.featCard} onClick={() => navigate(f.to)}>
              <div className={styles.featIcon}>{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
              <span className={styles.featLink}>Explore →</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className={styles.cta}>
        <h2>Ready to find your spot?</h2>
        <p>Open the live map and discover verified parking near your destination right now.</p>
        <div className={styles.ctaBtns}>
          <button className="btn btn-g btn-lg" onClick={() => navigate('/map')}>Open Live Map →</button>
          <button className="btn btn-ghost btn-lg" onClick={() => navigate('/list')}>List Your Space</button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className={styles.footer}>
        <div className={styles.footerGrid}>
          <div>
            <div className={styles.footerBrand}>
              <div className={styles.footerLogo}>SP</div>
              <span>Smart<em>Park</em></span>
            </div>
            <p>Solving urban congestion through community-powered smart parking.</p>
          </div>
          {[
            { title: 'Product',  links: [['Find Parking','/map'],['List Space','/list'],['Features','/features'],['My Places','/places']] },
            { title: 'Company',  links: [['About','#'],['Blog','#'],['Careers','#'],['Contact','#']] },
            { title: 'Legal',    links: [['Privacy','#'],['Terms','#'],['Cookies','#']] },
          ].map(col => (
            <div key={col.title}>
              <div className={styles.footerColTitle}>{col.title}</div>
              {col.links.map(([lbl, href]) => (
                <a key={lbl} href={href} className={styles.footerLink} onClick={e => { if(href.startsWith('/')) { e.preventDefault(); navigate(href); } }}>{lbl}</a>
              ))}
            </div>
          ))}
        </div>
        <div className={styles.footerBottom}>
          <span>© 2025 SmartPark. Smart city deployment ready.</span>
          <span>Map data © <a href="https://openstreetmap.org" target="_blank" rel="noreferrer">OpenStreetMap contributors</a></span>
        </div>
      </footer>
    </div>
  );
}
