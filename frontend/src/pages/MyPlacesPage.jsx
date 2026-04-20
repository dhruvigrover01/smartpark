import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { parkingAPI, bookingAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { getTier } from '../utils';
import styles from './MyPlacesPage.module.css';

export default function MyPlacesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('listings');
  const [listings, setListings]   = useState([]);
  const [bookings, setBookings]   = useState([]);
  const [earnings, setEarnings]   = useState({ total: 0, count: 0, active: 0 });
  const [loading, setLoading]     = useState(true);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [lr, br, er] = await Promise.allSettled([
        parkingAPI.getMine(),
        bookingAPI.getMine(),
        user?.role === 'owner' ? bookingAPI.getEarnings() : Promise.resolve({ data: { total: 0, count: 0, bookings: [] } }),
      ]);
      if (lr.status === 'fulfilled') setListings(lr.value.data.spots || []);
      if (br.status === 'fulfilled') setBookings(br.value.data.bookings || []);
      if (er.status === 'fulfilled') {
        const d = er.value.data;
        setEarnings({ total: d.total || 0, count: d.count || 0, active: (lr.value?.data?.spots || []).filter(s => s.status === 'active').length });
      }
    } catch (e) {
      toast.error('Failed to load data');
    } finally { setLoading(false); }
  };

  const removeListing = async (id) => {
    if (!window.confirm('Remove this listing?')) return;
    try {
      await parkingAPI.remove(id);
      setListings(l => l.filter(x => x._id !== id));
      toast.success('Listing removed');
    } catch { toast.error('Could not remove listing'); }
  };

  const cancelBooking = async (id) => {
    if (!window.confirm('Cancel this booking?')) return;
    try {
      await bookingAPI.cancel(id);
      setBookings(b => b.map(x => x._id === id ? { ...x, status: 'cancelled' } : x));
      toast.success('Booking cancelled');
    } catch (e) { toast.error(e.response?.data?.error || 'Could not cancel booking'); }
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.h1}>My Places</h1>
          <p className={styles.sub}>Manage your listings, bookings and earnings.</p>
        </div>
        {user?.role === 'owner' && (
          <button className="btn btn-g" onClick={() => navigate('/list')}>➕ List New Space</button>
        )}
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {[['listings','🏠 Listings'],['bookings','📅 Bookings'],['earnings','💰 Earnings']].map(([id, lbl]) => (
          <button key={id} className={`${styles.tab} ${tab===id?styles.active:''}`} onClick={() => setTab(id)}>{lbl}</button>
        ))}
      </div>

      {loading ? (
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Loading…</p>
        </div>
      ) : (
        <div className={styles.body}>

          {/* ── LISTINGS ── */}
          {tab === 'listings' && (
            listings.length === 0 ? (
              <div className={styles.empty}>
                <div className={styles.emptyIcon}>🏠</div>
                <h3>No spaces listed yet</h3>
                <p>Start earning by listing your unused parking space.</p>
                <button className="btn btn-g" onClick={() => navigate('/list')}>List Your Space →</button>
              </div>
            ) : (
              <div className={styles.grid}>
                {listings.map(s => {
                  const tier = getTier(s.security);
                  return (
                    <div key={s._id} className={styles.placeCard}>
                      <div className={styles.pcTop}>
                        <div className={styles.pcType}>{s.type === 'home' ? '🏠' : s.type === 'shop' ? '🏪' : s.type === 'office' ? '🏢' : '🏗️'}</div>
                        <span className={`pill ${s.status === 'active' ? 'pill-g' : s.status === 'pending' ? 'pill-a' : 'pill-r'}`}>
                          {s.status === 'active' ? '✅ Active' : s.status === 'pending' ? '⏳ Pending' : '⚠️ Suspended'}
                        </span>
                      </div>
                      <h3 className={styles.pcName}>{s.name}</h3>
                      <p className={styles.pcAddr}>{s.address}</p>
                      <div className={styles.pcMeta}>
                        <span style={{ color: tier.color, fontWeight: 700 }}>₹{s.price}/hr</span>
                        <span>·</span>
                        <span style={{ color: 'var(--muted)' }}>{s.slots?.available}/{s.slots?.total} slots</span>
                        <span>·</span>
                        <span style={{ color: 'var(--muted)' }}>{s.time?.open}–{s.time?.close}</span>
                      </div>
                      <div className={styles.pcSec}>
                        <span className={`${styles.secBit} ${s.security?.cctv ? styles.secBitOn : ''}`}>📹</span>
                        <span className={`${styles.secBit} ${s.security?.guard ? styles.secBitOn : ''}`}>👮</span>
                        <span className={`${styles.secBit} ${s.security?.gated ? styles.secBitOn : ''}`}>🚪</span>
                        <span style={{ fontSize: 12, color: 'var(--muted)', marginLeft: 4 }}>{tier.label}</span>
                      </div>
                      <div className={styles.pcBtns}>
                        <button className="btn btn-ghost btn-sm">Edit</button>
                        <button className={`btn btn-sm ${styles.removeBtn}`} onClick={() => removeListing(s._id)}>Remove</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}

          {/* ── BOOKINGS ── */}
          {tab === 'bookings' && (
            bookings.length === 0 ? (
              <div className={styles.empty}>
                <div className={styles.emptyIcon}>📅</div>
                <h3>No bookings yet</h3>
                <p>Find and book a parking spot to see it here.</p>
                <button className="btn btn-g" onClick={() => navigate('/map')}>Find Parking →</button>
              </div>
            ) : (
              <div className={styles.bookList}>
                {bookings.map(b => (
                  <div key={b._id} className={styles.bookCard}>
                    <div className={styles.bcLeft}>
                      <div className={styles.bcName}>{b.parkingName || b.parking?.name}</div>
                      <div className={styles.bcAddr}>{b.parkingAddr || b.parking?.address}</div>
                      <div className={styles.bcMeta}>
                        <span>🕐 {b.hours} hrs</span>
                        <span>· ₹{b.rate}/hr</span>
                        <span>· {new Date(b.createdAt).toLocaleDateString('en-IN')}</span>
                      </div>
                      <div className={styles.bcRef}>{b.bookingRef}</div>
                    </div>
                    <div className={styles.bcRight}>
                      <div className={styles.bcTotal} style={{ color: 'var(--green)' }}>₹{b.total}</div>
                      <span className={`pill ${b.status === 'confirmed' ? 'pill-g' : b.status === 'cancelled' ? 'pill-r' : 'pill-b'}`}>
                        {b.status}
                      </span>
                      {b.status === 'confirmed' && (
                        <button className={`btn btn-sm ${styles.cancelBtn}`} onClick={() => cancelBooking(b._id)}>Cancel</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {/* ── EARNINGS ── */}
          {tab === 'earnings' && (
            <div>
              <div className={styles.earnStats}>
                <div className={styles.earnCard}>
                  <div className={styles.earnVal} style={{ color: 'var(--green)' }}>₹{earnings.total.toLocaleString()}</div>
                  <div className={styles.earnLbl}>Total Earned</div>
                </div>
                <div className={styles.earnCard}>
                  <div className={styles.earnVal}>{earnings.count}</div>
                  <div className={styles.earnLbl}>Total Bookings</div>
                </div>
                <div className={styles.earnCard}>
                  <div className={styles.earnVal} style={{ color: 'var(--green)' }}>{earnings.active}</div>
                  <div className={styles.earnLbl}>Active Spaces</div>
                </div>
              </div>
              {earnings.total === 0 && (
                <div className={styles.empty} style={{ marginTop: 32 }}>
                  <div className={styles.emptyIcon}>💰</div>
                  <h3>No earnings yet</h3>
                  <p>List a verified space to start earning from your parking.</p>
                  <button className="btn btn-g" onClick={() => navigate('/list')}>List a Space →</button>
                </div>
              )}
            </div>
          )}

        </div>
      )}
    </div>
  );
}
