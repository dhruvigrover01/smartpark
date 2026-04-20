import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import toast from 'react-hot-toast';
import { parkingAPI } from '../api';
import { geocode, fetchOSMParking, osmToSpot, addSmartTags, isNowOpen, getTier } from '../utils';
import { useAuth } from '../context/AuthContext';
import ParkingCard    from '../components/ParkingCard';
import DetailDrawer   from '../components/DetailDrawer';
import BookingModal   from '../components/BookingModal';
import AuthModal      from '../components/AuthModal';
import styles from './MapPage.module.css';

// ── Custom marker icon factory ──
function makeIcon(color, selected, rate) {
  const sz = selected ? 46 : 36;
  const textColor = ['#ef4444','#556070'].includes(color) ? 'white' : '#07090f';
  return L.divIcon({
    className: '',
    html: `<div style="width:${sz}px;height:${sz}px;background:${color};border:${selected?'3px solid white':'2.5px solid rgba(255,255,255,.7)'};border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(0,0,0,.45)${selected?`,0 0 0 5px ${color}33`:''};cursor:pointer">
      <span style="transform:rotate(45deg);font-weight:800;font-size:${selected?11:10}px;color:${textColor}">₹${rate}</span>
    </div>`,
    iconSize: [sz, sz],
    iconAnchor: [sz/2, sz],
    popupAnchor: [0, -sz],
  });
}

function destIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="width:44px;height:44px;background:#7c3aed;border:3px solid #a78bfa;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;box-shadow:0 0 20px rgba(124,58,237,.6)">🎯</div>`,
    iconSize: [44,44], iconAnchor: [22,22],
  });
}

// ── Map controller (fly to location) ──
function MapControl({ center, zoom }) {
  const map = useMap();
  useEffect(() => { if (center) map.flyTo(center, zoom || 15, { animate: true }); }, [center]);
  return null;
}

const SUGGESTIONS = [
  { icon:'🏙️', name:'Connaught Place', sub:'New Delhi' },
  { icon:'🌆', name:'Bandra West',      sub:'Mumbai' },
  { icon:'🏛️', name:'MG Road',          sub:'Bengaluru' },
  { icon:'🌇', name:'Sector 17',        sub:'Chandigarh' },
  { icon:'🏢', name:'Cyber City',       sub:'Gurugram' },
  { icon:'🌃', name:'Park Street',      sub:'Kolkata' },
  { icon:'🏙️', name:'T Nagar',          sub:'Chennai' },
  { icon:'🌆', name:'Koregaon Park',    sub:'Pune' },
];

export default function MapPage() {
  const { isLoggedIn } = useAuth();
  const [searchParams] = useSearchParams();

  const [query,    setQuery]    = useState(searchParams.get('q') || '');
  const [loading,  setLoading]  = useState(false);
  const [spots,    setSpots]    = useState([]);
  const [filter,   setFilter]   = useState('all');
  const [selId,    setSelId]    = useState(null);
  const [destPos,  setDestPos]  = useState(null);
  const [mapCenter,setMapCenter]= useState([28.6139, 77.209]);
  const [suggestions, setSuggestions] = useState([]);
  const [showSugg, setShowSugg] = useState(false);
  const [detailSpot, setDetailSpot] = useState(null);
  const [bookSpot,   setBookSpot]   = useState(null);
  const [showAuth,   setShowAuth]   = useState(false);
  const sugTimer = useRef(null);

  // Auto-search from URL param on load
  useEffect(() => { if (query) doSearch(query); }, []);

  const doSearch = useCallback(async (q = query) => {
    if (!q.trim()) { toast.error('Enter a location'); return; }
    setLoading(true); setShowSugg(false);
    try {
      const loc = await geocode(q);
      if (!loc) { toast.error('Location not found'); setLoading(false); return; }
      setDestPos([loc.lat, loc.lng]);
      setMapCenter([loc.lat, loc.lng]);

      // 1) fetch from our backend (verified listings)
      let backendSpots = [];
      try {
        const { data } = await parkingAPI.getNearby({ lat: loc.lat, lng: loc.lng, radius: 2000 });
        backendSpots = data.spots || [];
      } catch { /* no backend data */ }

      // 2) fetch from OSM (real world data)
      let osmSpots = [];
      try {
        const elements = await fetchOSMParking(loc.lat, loc.lng);
        osmSpots = elements.map((el, i) => osmToSpot(el, i, loc.lat, loc.lng)).filter(Boolean);
      } catch { /* OSM unavailable */ }

      // Merge: backend first, then OSM for coverage
      const merged = [...backendSpots, ...osmSpots].slice(0, 30);
      const tagged = addSmartTags(merged, loc.lat, loc.lng);
      setSpots(tagged);
      toast.success(`Found ${tagged.length} parking spots nearby`);
    } catch (e) {
      toast.error('Search failed. Check your connection.');
    } finally { setLoading(false); }
  }, [query]);

  const useMyLocation = () => {
    if (!navigator.geolocation) { toast.error('Geolocation not supported'); return; }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude: lat, longitude: lng } }) => {
        setDestPos([lat, lng]); setMapCenter([lat, lng]);
        setQuery('My Location');
        try {
          const elements = await fetchOSMParking(lat, lng);
          const osmSpots = elements.map((el, i) => osmToSpot(el, i, lat, lng)).filter(Boolean);
          const tagged = addSmartTags(osmSpots, lat, lng);
          setSpots(tagged);
          toast.success(`Found ${tagged.length} spots near you`);
        } catch { toast.error('Could not load parking data'); }
        setLoading(false);
      },
      () => { toast.error('Location access denied'); setLoading(false); }
    );
  };

  const handleInput = (val) => {
    setQuery(val);
    clearTimeout(sugTimer.current);
    if (!val.trim()) { setShowSugg(false); return; }
    sugTimer.current = setTimeout(() => {
      const lower = val.toLowerCase();
      const filtered = SUGGESTIONS.filter(s => s.name.toLowerCase().includes(lower) || s.sub.toLowerCase().includes(lower));
      setSuggestions(filtered.length ? filtered : SUGGESTIONS.slice(0, 4));
      setShowSugg(true);
    }, 150);
  };

  const pickSuggestion = (s) => {
    const q = `${s.name}, ${s.sub}`;
    setQuery(q); setShowSugg(false);
    doSearch(q);
  };

  const filtered = spots.filter(s => {
    if (filter === 'open')  return isNowOpen(s.time?.open, s.time?.close);
    if (['car','bike','suv'].includes(filter)) return (s.vehicles||[]).includes(filter);
    return true;
  });

  const handleBook = (spot) => {
    if (!isLoggedIn) { setShowAuth(true); return; }
    setBookSpot(spot);
  };

  return (
    <div className={styles.page}>

      {/* ── Search Hero ── */}
      <div className={styles.searchHero}>
        <div className={styles.shTop}>
          <div className={styles.shTitle}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2.2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            Search Location to Find Parking Nearby
          </div>
          <div className={styles.liveBadge}><span className="live-dot" />Live · OpenStreetMap</div>
        </div>

        {/* Big search bar */}
        <div className={`${styles.searchBar} ${loading ? styles.searching : ''}`}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--muted2)" strokeWidth="2.2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            type="text" value={query}
            onChange={e => handleInput(e.target.value)}
            onFocus={() => !query && setShowSugg(true)}
            onBlur={() => setTimeout(() => setShowSugg(false), 250)}
            onKeyDown={e => e.key === 'Enter' && doSearch()}
            placeholder="🏙  Enter city, landmark or area — e.g. Connaught Place Delhi…"
            autoComplete="off"
          />
          <div className={styles.divider} />
          <button className={styles.locBtn} onClick={useMyLocation}>
            📍 My Location
          </button>
          <button className={`btn btn-g btn-sm ${styles.goBtn}`} onClick={() => doSearch()} disabled={loading}>
            {loading ? '…' : 'Search'}
          </button>

          {/* Autocomplete dropdown */}
          {showSugg && (
            <div className={styles.suggDrop}>
              <div className={styles.suggLabel}>Popular Locations</div>
              {(query ? suggestions : SUGGESTIONS.slice(0,6)).map(s => (
                <div key={s.name} className={styles.suggItem} onClick={() => pickSuggestion(s)}>
                  <span className={styles.suggIcon}>{s.icon}</span>
                  <div><div className={styles.suggName}>{s.name}</div><div className={styles.suggSub}>{s.sub}</div></div>
                  <span style={{color:'var(--muted2)',marginLeft:'auto'}}>→</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Filter pills */}
        <div className={styles.filters}>
          <span className={styles.filterLabel}>Filter:</span>
          {[['all','All'],['open','🟢 Open Now'],['car','🚗 Car'],['bike','🏍 Bike'],['suv','🚙 SUV']].map(([v,l]) => (
            <button key={v} className={`${styles.pill} ${filter===v?styles.pillOn:''}`} onClick={() => setFilter(v)}>{l}</button>
          ))}
          {spots.length > 0 && <span className={styles.resultMeta}>{filtered.length} spots found</span>}
        </div>
      </div>

      {/* ── Map + Panel ── */}
      <div className={styles.body}>

        {/* Leaflet Map */}
        <div className={styles.mapWrap}>
          <MapContainer center={mapCenter} zoom={13} className={styles.map}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='© <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>'
              maxZoom={19}
            />
            <MapControl center={mapCenter} zoom={destPos ? 15 : 13} />

            {/* Destination marker */}
            {destPos && <Marker position={destPos} icon={destIcon()} />}

            {/* Parking markers */}
            {filtered.map(s => {
              const tier = getTier(s.security);
              const open = isNowOpen(s.time?.open, s.time?.close);
              const color = open ? tier.color : '#556070';
              const isSel = selId === s._id;
              return (
                <Marker
                  key={s._id}
                  position={[s.location.coordinates[1], s.location.coordinates[0]]}
                  icon={makeIcon(color, isSel, s.price)}
                  eventHandlers={{ click: () => { setSelId(s._id); setDetailSpot(s); } }}
                >
                  <Popup>
                    <div style={{fontFamily:'Plus Jakarta Sans,sans-serif',minWidth:160}}>
                      <strong style={{fontSize:13}}>{s.name}</strong><br/>
                      <span style={{color:tier.color,fontWeight:700}}>₹{s.price}/hr</span>
                      &nbsp;·&nbsp;{tier.label}<br/>
                      <span style={{color:open?'#00e5a0':'#ef4444',fontSize:11}}>{open?'✅ Open':'🔴 Closed'}</span>
                      {s.dist && <span style={{color:'#8895aa',fontSize:11}}> · {s.dist.toFixed(2)} km</span>}
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>

          {/* Map overlays */}
          <div className={styles.osmBadge}><span className="live-dot" />OpenStreetMap · Live Data</div>
          <div className={styles.legend}>
            <div className={styles.legendTitle}>Pricing Tiers</div>
            {[['#00e5a0','Elite – ₹60/hr'],['#f59e0b','Premium – ₹40/hr'],['#3b82f6','Standard – ₹25/hr'],['#ef4444','Basic – ₹10/hr'],['#556070','Closed']].map(([c,l]) => (
              <div key={l} className={styles.legendRow}><div className={styles.legendDot} style={{background:c}}/>{l}</div>
            ))}
          </div>

          {loading && (
            <div className={styles.mapLoading}>
              <div className={styles.spinner} />
              <p>Fetching real parking data…</p>
            </div>
          )}
        </div>

        {/* Side panel */}
        <div className={styles.panel}>
          <div className={styles.panelHead}>
            <h3>Nearby Parking</h3>
            <span className={styles.panelCount}>{filtered.length} spots</span>
          </div>
          <div className={styles.panelList}>
            {filtered.length === 0 ? (
              <div className={styles.emptyPanel}>
                <div style={{fontSize:40,marginBottom:14}}>🗺️</div>
                <p style={{fontWeight:700,marginBottom:6}}>Search a location</p>
                <p style={{fontSize:13,color:'var(--muted)'}}>Type any destination above to discover real parking spots nearby.</p>
              </div>
            ) : (
              filtered.map(s => (
                <ParkingCard
                  key={s._id}
                  spot={s}
                  selected={selId === s._id}
                  onClick={() => { setSelId(s._id); setDetailSpot(s); setMapCenter([s.location.coordinates[1], s.location.coordinates[0]]); }}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {detailSpot && <DetailDrawer spot={detailSpot} onClose={() => setDetailSpot(null)} onBook={handleBook} />}
      {bookSpot   && <BookingModal spot={bookSpot} onClose={() => setBookSpot(null)} />}
      {showAuth   && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  );
}
