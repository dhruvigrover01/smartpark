import { useState } from 'react';
import toast from 'react-hot-toast';
import { bookingAPI, parkingAPI } from '../api';
import styles from './BookingModal.module.css';

export default function BookingModal({ spot, onClose }) {
  const [hours,   setHours]   = useState(2);
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState(null);

  const total = hours * spot.price;

const confirm = async () => {
  setLoading(true);
  try {
    console.log("SPOT FULL:", spot);
    let parkingId = spot._id;
    
    console.log("SPOT:", spot);

    // 🔥 If it's map (OSM) parking → save first
    if (!parkingId || parkingId.includes("osm")) {
      console.log("Saving map parking...");

      const { data } = await parkingAPI.createFromMap({
        name: spot.name,
        address: spot.address,
        lat: spot.lat || spot.location?.coordinates?.[1],
lng: spot.lng || spot.location?.coordinates?.[0],
        price: spot.price
      });

      console.log("Saved spot:", data.spot);

      parkingId = data.spot._id;
    }

    console.log("Final parkingId:", parkingId);

    const { data } = await bookingAPI.create({ parkingId, hours });

    setBooking(data.booking);
    toast.success(`Booking ${data.booking.bookingRef} confirmed! ₹${data.booking.total}`);

  } catch (e) {
    console.error(e);
    toast.error(e.response?.data?.error || 'Booking failed.');
  } finally {
    setLoading(false);
  }
};
  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        {booking ? (
          <div className={styles.success}>
            <div className={styles.successIcon}>🎉</div>
            <h3>Confirmed!</h3>
            <p style={{color:'var(--muted)',fontSize:13,marginBottom:18}}>{spot.name}</p>
            <div className={styles.receipt}>
              <div className={styles.rRow}><span>Booking ID</span><strong>{booking.bookingRef}</strong></div>
              <div className={styles.rRow}><span>Duration</span><span>{booking.hours} hrs</span></div>
              <div className={styles.rRow} style={{fontSize:18,fontWeight:800,paddingTop:10,borderTop:'1px solid var(--border)',marginTop:8}}>
                <span>Total</span><span style={{color:'var(--green)'}}>₹{booking.total}</span>
              </div>
            </div>
            <button className={`btn btn-g ${styles.doneBtn}`} onClick={onClose}>Done ✓</button>
          </div>
        ) : (
          <>
            <h3 className={styles.title}>Book Slot</h3>
            <p className={styles.sub}>{spot.name}</p>

            <div className={styles.picker}>
              <button className={styles.pickerBtn} onClick={() => setHours(h => Math.max(1, h-1))}>−</button>
              <div className={styles.pickerVal}>{hours}<small> hrs</small></div>
              <button className={styles.pickerBtn} onClick={() => setHours(h => Math.min(24, h+1))}>+</button>
            </div>

            <div className={styles.totalBox}>
              <div className={styles.tRow}><span>Rate</span><span>₹{spot.price}/hr</span></div>
              <div className={styles.tRow}><span>Hours</span><span>{hours}</span></div>
              <div className={`${styles.tRow} ${styles.tTotal}`}><span>Total</span><span style={{color:'var(--green)'}}>₹{total}</span></div>
            </div>

            <div className={styles.btns}>
              <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
              <button className="btn btn-g" onClick={confirm} disabled={loading}>
                {loading ? 'Processing…' : `Pay ₹${total}`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
