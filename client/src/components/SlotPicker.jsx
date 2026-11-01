import { useEffect, useState } from 'react';
import { getAvailableSlots } from '../services/slotService';
import { getSlotAvailabilityState } from '../utils/slotAvailability';

const SlotPicker = ({ stylistId, onSelect }) => {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let active = true;

    const loadSlots = async () => {
      setLoading(true);

      try {
        const response = await getAvailableSlots({ date, stylistId, includeAll: true });
        if (active) {
          setSlots(response?.data || []);
        }
      } catch {
        if (active) {
          setSlots([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadSlots();

    return () => {
      active = false;
    };
  }, [date, stylistId]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="slot-picker">
      <label>
        Select date
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </label>

      {loading ? (
        <div>Loading slots…</div>
      ) : (
        <div className="slot-list">
          {slots.length === 0 ? (
            <div>No slots available for selected date.</div>
          ) : (
            slots.map((s) => {
              const availability = getSlotAvailabilityState({ slot: s, selectedDate: date, now });
              const isClickable = availability.available;

              return (
                <button
                  key={s._id}
                  type="button"
                  onClick={() => isClickable && onSelect?.({ slot_id: s._id, ...s })}
                  className={`slot-item slot-item--${availability.statusClass}`}
                  disabled={!isClickable}
                >
                  <span className="slot-item__time">{s.start_time} - {s.end_time}</span>
                  <span className={`slot-item__status slot-item__status--${availability.statusClass}`}>{availability.label}</span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default SlotPicker;
