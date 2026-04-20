import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { parkingAPI } from '../api';
import { getTier } from '../utils';
import styles from './ListSpacePage.module.css';

const TYPES    = [['home','🏠','Home'],['shop','🏪','Shop'],['office','🏢','Office'],['commercial','🏗️','Commercial']];
const VEHICLES = [['car','🚗 Car'],['bike','🏍 Bike'],['suv','🚙 SUV'],['truck','🚛 Truck'],['ev','⚡ EV']];

export default function ListSpacePage() {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading]  = useState(false);
  const [form, setForm] = useState({
    name:'', address:'', lat:'', lng:'', type:'home', desc:'', notes:'',
    vehicles:[], openTime:'09:00', closeTime:'21:00', slots:4, avail:4,
    cctv:false, guard:false, gated:false,
    ownerName:'', phone:'', agree:false,
  });

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.type==='checkbox' ? e.target.checked : e.target.value }));
  const setDirect = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const togVeh = (v) => setForm(f => ({
    ...f, vehicles: f.vehicles.includes(v) ? f.vehicles.filter(x => x!==v) : [...f.vehicles, v],
  }));
  const togSec = (k) => setForm(f => ({ ...f, [k]: !f[k] }));

  const security = { cctv: form.cctv, guard: form.guard, gated: form.gated };
  const tier = getTier(security);
  const score = (form.cctv?1:0)+(form.guard?1:0)+(form.gated?1:0);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.address.trim()) { toast.error('Name and address are required'); return; }
    if (!form.lat || !form.lng) { toast.error('Coordinates are required'); return; }
    if (!form.agree) { toast.error('Please agree to the terms'); return; }
    setLoading(true);
    try {
      await parkingAPI.create({
        name: form.name, address: form.address,
        lat: parseFloat(form.lat), lng: parseFloat(form.lng),
        type: form.type, vehicles: form.vehicles,
        slots: { total: parseInt(form.slots), available: parseInt(form.avail) },
        time: { open: form.openTime, close: form.closeTime, label: `${form.openTime} – ${form.closeTime}` },
        security, description: form.desc, notes: form.notes,
      });
      setSubmitted(true);
      toast.success('Listing submitted for verification! 🎉');
    } catch (e) {
      toast.error(e.response?.data?.error || 'Submission failed.');
    } finally { setLoading(false); }
  };

  if (submitted) return (
    <div className={styles.page}>
      <div className={styles.successWrap}>
        <div className={styles.successIcon}>✅</div>
        <h2>Listing Submitted!</h2>
        <p>Your parking space "<strong>{form.name}</strong>" has been submitted for admin verification. It will go live in <strong>My Places</strong> within 24 hours.</p>
        <div className={styles.successBtns}>
          <button className="btn btn-g btn-lg" onClick={() => navigate('/places')}>View My Places →</button>
          <button className="btn btn-ghost btn-lg" onClick={() => { setSubmitted(false); setForm(f => ({ ...f, name:'', address:'' })); }}>List Another</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className={styles.page}>
      {/* Hero */}
      <div className={styles.hero}>
        <div className="sec-label" style={{justifyContent:'center'}}>For Parking Owners</div>
        <h1>List Your Parking Space</h1>
        <p>Turn unused parking into monthly income. Set your own hours, pricing is calculated automatically.</p>
        <div className={styles.earnChips}>
          <div className={styles.chip}><span>🏠</span> Home · Earn <em>₹6K–₹15K</em>/mo</div>
          <div className={styles.chip}><span>🏪</span> Shop · Earn <em>₹3K–₹8K</em>/mo</div>
          <div className={styles.chip}><span>🏢</span> Office · Earn <em>₹8K–₹25K</em>/mo</div>
        </div>
      </div>

      {/* Body */}
      <div className={styles.body}>
        <form className={styles.formWrap} onSubmit={submit}>

          {/* Step 1 */}
          <div className={styles.step}>
            <div className={styles.stepLabel}><div className={styles.stepN}>1</div>Basic Information</div>
            <div className="fg"><label>Parking Name *</label><input type="text" placeholder="e.g. My Home Driveway" value={form.name} onChange={set('name')} required /></div>
            <div className="fg"><label>Full Address *</label><input type="text" placeholder="Full street address with city and PIN" value={form.address} onChange={set('address')} required /></div>
            <div className="fg-row">
              <div className="fg"><label>Latitude</label><input type="number" step="any" placeholder="e.g. 28.6139" value={form.lat} onChange={set('lat')} /></div>
              <div className="fg"><label>Longitude</label><input type="number" step="any" placeholder="e.g. 77.2090" value={form.lng} onChange={set('lng')} /></div>
            </div>
            <div className="fg">
              <label>Space Type *</label>
              <div className={styles.typeGrid}>
                {TYPES.map(([v, icon, lbl]) => (
                  <div key={v} className={`${styles.typeOpt} ${form.type===v?styles.typeOn:''}`} onClick={() => setDirect('type', v)}>
                    <div className={styles.typeIcon}>{icon}</div>
                    <div className={styles.typeLbl}>{lbl}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="fg"><label>Description</label><textarea placeholder="Describe surroundings, access instructions, nearby landmarks…" value={form.desc} onChange={set('desc')} /></div>
          </div>

          {/* Step 2 */}
          <div className={styles.step}>
            <div className={styles.stepLabel}><div className={styles.stepN}>2</div>Vehicles &amp; Availability</div>
            <div className="fg">
              <label>Supported Vehicle Types *</label>
              <div className={styles.vehRow}>
                {VEHICLES.map(([v, lbl]) => (
                  <div key={v} className={`${styles.vehOpt} ${form.vehicles.includes(v)?styles.vehOn:''}`} onClick={() => togVeh(v)}>{lbl}</div>
                ))}
              </div>
            </div>
            <div className="fg-row">
              <div className="fg"><label>Available From</label><input type="time" value={form.openTime} onChange={set('openTime')} /></div>
              <div className="fg"><label>Available Until</label><input type="time" value={form.closeTime} onChange={set('closeTime')} /></div>
            </div>
            <div className="fg-row">
              <div className="fg"><label>Total Slots</label><input type="number" min="1" max="500" value={form.slots} onChange={set('slots')} /></div>
              <div className="fg"><label>Currently Available</label><input type="number" min="0" max="500" value={form.avail} onChange={set('avail')} /></div>
            </div>
          </div>

          {/* Step 3 */}
          <div className={styles.step}>
            <div className={styles.stepLabel}><div className={styles.stepN}>3</div>Security Features</div>
            <p className={styles.secHint}>Each feature increases your price tier and builds user trust.</p>
            <div className={styles.secRow}>
              {[['cctv','📹','CCTV'],['guard','👮','Guard'],['gated','🚪','Gated']].map(([k,icon,lbl]) => (
                <div key={k} className={`${styles.secTog} ${form[k]?styles.secOn:''}`} onClick={() => togSec(k)}>
                  <span style={{fontSize:24}}>{icon}</span>
                  <span className={styles.secLbl}>{lbl}</span>
                </div>
              ))}
            </div>
            <div className={styles.pricePrev}>
              <div>
                <div className={styles.ppRate} style={{color:tier.color}}>₹{tier.rate}/hr</div>
                <div className={styles.ppSub}>Your earning rate</div>
              </div>
              <div style={{textAlign:'right'}}>
                <div className={styles.ppTier} style={{color:tier.color}}>{tier.label} Tier</div>
                <div className={styles.ppScore}>Score: {score}/3 features</div>
              </div>
            </div>
          </div>

          {/* Step 4 */}
          <div className={styles.step}>
            <div className={styles.stepLabel}><div className={styles.stepN}>4</div>Contact &amp; Terms</div>
            <div className="fg-row">
              <div className="fg"><label>Owner Name *</label><input type="text" placeholder="Your full name" value={form.ownerName} onChange={set('ownerName')} required /></div>
              <div className="fg"><label>Phone</label><input type="tel" placeholder="+91 98765 43210" value={form.phone} onChange={set('phone')} /></div>
            </div>
            <div className="fg"><label>Notes for Users</label><textarea placeholder="e.g. Ring bell on arrival, gate code is 1234…" style={{minHeight:72}} value={form.notes} onChange={set('notes')} /></div>
            <div className={styles.agreeRow}>
              <input type="checkbox" id="agree" checked={form.agree} onChange={set('agree')} style={{accentColor:'var(--green)'}} />
              <label htmlFor="agree">I confirm this space is legally mine to list and I agree to SmartPark's <a href="#">Terms of Service</a>.</label>
            </div>
            <button type="submit" className={`btn btn-g ${styles.submitBtn}`} disabled={loading}>
              {loading ? 'Submitting…' : 'Submit for Verification →'}
            </button>
            <p className={styles.submitNote}>Your listing will appear in My Places after admin verification (usually within 24 hours)</p>
          </div>
        </form>

        {/* Live preview */}
        <div className={styles.preview}>
          <div className={styles.previewTitle}>Live Preview</div>
          <div className={styles.prevCard}>
            <div className={styles.prevLive}><span className="live-dot"/>Preview</div>
            <div className={styles.prevName}>{form.name || 'Parking Name'}</div>
            <div className={styles.prevAddr}>{form.address || 'Address will appear here'}</div>
            <div className={styles.prevRate} style={{color:tier.color}}>₹{tier.rate}/hr</div>
            <div className={styles.prevTime}>{form.openTime} – {form.closeTime}</div>
            <div className={styles.prevVehicles}>{form.vehicles.length ? form.vehicles.join(', ') : 'No vehicles selected'}</div>
            <div className={styles.prevSec}>
              {[['cctv','📹','CCTV'],['guard','👮','Guard'],['gated','🚪','Gated']].map(([k,icon,lbl]) => (
                <div key={k} className={`${styles.psItem} ${form[k]?styles.psOn:styles.psOff}`}>
                  <span>{icon}</span><span>{lbl}</span>
                </div>
              ))}
            </div>
          </div>
          <div className={styles.pricingNote}>
            <strong style={{color:'var(--green)'}}>💡 Pricing Logic</strong><br/>
            No features = ₹10/hr · CCTV only = ₹25/hr<br/>
            2 features = ₹40/hr · All 3 = ₹60/hr
          </div>
        </div>
      </div>
    </div>
  );
}
