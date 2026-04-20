// Haversine distance in km
export function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Security score + pricing tier
export function getTier(security = {}) {
  const score = (security.cctv ? 1 : 0) + (security.guard ? 1 : 0) + (security.gated ? 1 : 0);
  const tiers = [
    { label: 'Basic',    rate: 10,  color: '#ef4444' },
    { label: 'Standard', rate: 25,  color: '#3b82f6' },
    { label: 'Premium',  rate: 40,  color: '#f59e0b' },
    { label: 'Elite',    rate: 60,  color: '#00e5a0' },
  ];
  return { ...tiers[score], score };
}

// Is spot open right now?
export function isNowOpen(open = '00:00', close = '23:59') {
  const now  = new Date();
  const cur  = now.getHours() * 60 + now.getMinutes();
  const [oh, om] = open.split(':').map(Number);
  const [ch, cm] = close.split(':').map(Number);
  const o = oh * 60 + om, c = ch * 60 + cm;
  if (c < o) return cur >= o || cur <= c;   // overnight
  return cur >= o && cur <= c;
}

// Tag spots with smart badges
export function addSmartTags(spots, destLat, destLng) {
  const withDist = spots.map(s => ({
    ...s,
    dist: destLat != null
      ? haversine(destLat, destLng, s.location?.coordinates[1], s.location?.coordinates[0])
      : null,
    isOpen: isNowOpen(s.time?.open, s.time?.close),
  }));

  const open = withDist.filter(s => s.isOpen);
  const bpId = open.length ? [...open].sort((a, b) => a.price - b.price)[0]?.id : null;
  const bsId = open.length ? [...open].sort((a, b) => (b.security ? (b.security.cctv?1:0)+(b.security.guard?1:0)+(b.security.gated?1:0) : 0) - ((a.security ? (a.security.cctv?1:0)+(a.security.guard?1:0)+(a.security.gated?1:0) : 0)))[0]?.id : null;
  const bdId = destLat != null && open.length ? [...open].sort((a, b) => (a.dist||999) - (b.dist||999))[0]?.id : null;

  return withDist.map(s => ({
    ...s,
    tags: [
      s._id === bpId ? 'best_value'   : null,
      s._id === bsId ? 'most_secure'  : null,
      s._id === bdId ? 'closest'      : null,
    ].filter(Boolean),
  }));
}

// Geocode via Nominatim
export async function geocode(query) {
  const res  = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
    { headers: { 'Accept-Language': 'en' } }
  );
  const data = await res.json();
  if (!data.length) return null;
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), label: data[0].display_name };
}

// Fetch real parking from Overpass API
export async function fetchOSMParking(lat, lng, radius = 0.015) {
  const bbox   = `${lat - radius},${lng - radius},${lat + radius},${lng + radius}`;
  const query  = `[out:json][timeout:20];(node["amenity"="parking"](${bbox});way["amenity"="parking"](${bbox});relation["amenity"="parking"](${bbox}););out center;`;
  const res    = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
  const data   = await res.json();
  return data.elements || [];
}

// Convert OSM element → SmartPark spot shape
export function osmToSpot(el, index, destLat, destLng) {
  const elLat = el.lat || el.center?.lat;
  const elLng = el.lon || el.center?.lon;
  if (!elLat || !elLng) return null;
  const tags = el.tags || {};
  const capacity = parseInt(tags.capacity) || Math.floor(Math.random() * 46) + 5;
  const cctv  = !!(tags.surveillance || tags['security:camera'] || tags.covered === 'yes' || Math.random() > 0.55);
  const guard = tags.operator ? Math.random() > 0.5 : Math.random() > 0.72;
  const gated = tags.access === 'private' || tags.access === 'customers' || Math.random() > 0.65;
  const security = { cctv, guard, gated };
  const tier = getTier(security);
  const is24 = (tags.opening_hours || '').includes('24/7');
  return {
    _id:   'osm_' + el.id,
    id:    'osm_' + el.id,
    name:  tags.name || tags['name:en'] || inferOSMName(tags, index),
    address: tags['addr:street'] || `${(haversine(destLat, destLng, elLat, elLng) * 1000).toFixed(0)}m from searched location`,
    location: { type: 'Point', coordinates: [elLng, elLat] },
    security,
    price:    tier.rate,
    tier:     tier.label,
    slots: { total: capacity, available: Math.floor(capacity * (0.15 + Math.random() * 0.7)) },
    time: {
      open:  is24 ? '00:00' : '08:00',
      close: is24 ? '23:59' : '22:00',
      label: is24 ? '24 Hours' : '8 AM – 10 PM',
    },
    vehicles: ['car', 'bike', ...(Math.random() > 0.4 ? ['suv'] : [])],
    rating: (3.5 + Math.random() * 1.4).toFixed(1),
    reviews: Math.floor(Math.random() * 350) + 10,
    verified: Math.random() > 0.3,
    congestion: Math.random() > 0.78,
    isOSM: true,
    osmTags: tags,
  };
}

function inferOSMName(tags, i) {
  if (tags.operator) return `${tags.operator} Parking`;
  const names = ['Street Parking', 'Public Lot', 'Community Parking', 'Roadside Park', 'Covered Lot'];
  return names[i % names.length];
}
