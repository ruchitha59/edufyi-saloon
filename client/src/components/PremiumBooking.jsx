import { useEffect, useMemo, useState } from 'react';
import { getAvailableSlots } from '../services/slotService';
import { getSlotAvailabilityState } from '../utils/slotAvailability';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);
const endOfMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0);

const formatDateKey = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const rangeDaysForMonth = (visibleDate) => {
  const start = startOfMonth(visibleDate);
  const end = endOfMonth(visibleDate);
  const startPad = start.getDay();
  const total = startPad + end.getDate();
  const rows = Math.ceil(total / 7);
  const days = [];
  let cur = new Date(start);
  cur.setDate(cur.getDate() - startPad);

  for (let i = 0; i < rows * 7; i += 1) {
    days.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }

  return days;
};

const PremiumBooking = ({ stylistId = '', selectedSlot = null, onSlotSelect, initialDate }) => {
  const [visibleMonth, setVisibleMonth] = useState(initialDate ? new Date(initialDate) : new Date());
  const [selectedDate, setSelectedDate] = useState(initialDate ? formatDateKey(new Date(initialDate)) : formatDateKey(new Date()));
  const [slotsForDate, setSlotsForDate] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [now, setNow] = useState(() => new Date());

  const days = useMemo(() => rangeDaysForMonth(visibleMonth), [visibleMonth]);

  useEffect(() => {
    let active = true;

    const loadSlots = async () => {
      setLoadingSlots(true);

      try {
        const response = await getAvailableSlots({ date: selectedDate, stylistId, includeAll: true });
        if (active) {
          setSlotsForDate(response?.data || []);
        }
      } catch {
        if (active) {
          setSlotsForDate([]);
        }
      } finally {
        if (active) {
          setLoadingSlots(false);
        }
      }
    };

    if (selectedDate) loadSlots();

    return () => {
      active = false;
    };
  }, [selectedDate, stylistId]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const displaySlots = slotsForDate || [];

  const formatSlotLabel = (slot = {}) => {
    if (slot.isBooked) return 'Booked';
    if (slot.manuallyDisabled) return 'Unavailable';
    if (slot.isPast) return 'Passed';
    return 'Available';
  };

  const prevMonth = () => {
    setVisibleMonth((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setVisibleMonth((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  };

  const isPast = (d) => new Date(d.toDateString()) < new Date(new Date().toDateString());

  return (
    <div className="premium-booking">
      <div className="premium-booking__grid">
        <div className="premium-booking__calendar">
          <div className="calendar-header">
            <button type="button" className="calendar-nav" onClick={prevMonth} aria-label="Previous month">‹</button>
            <div className="calendar-month">{visibleMonth.toLocaleString(undefined, { month: 'long', year: 'numeric' })}</div>
            <button type="button" className="calendar-nav" onClick={nextMonth} aria-label="Next month">›</button>
          </div>

          <div className="calendar-weekdays">
            {DAY_NAMES.map((n) => (
              <div key={n} className="calendar-weekday">{n}</div>
            ))}
          </div>

          <div className="calendar-days">
            {days.map((d) => {
              const key = formatDateKey(d);
              const hasSlots = key === selectedDate ? displaySlots.length > 0 : true;
              const today = formatDateKey(new Date()) === key;
              const disabled = isPast(d) || d.getMonth() !== visibleMonth.getMonth();

              return (
                <button
                  key={key}
                  type="button"
                  className={`calendar-day ${disabled ? 'calendar-day--disabled' : ''} ${today ? 'calendar-day--today' : ''} ${hasSlots ? 'calendar-day--available' : ''} ${selectedDate === key ? 'calendar-day--selected' : ''}`}
                  onClick={() => !disabled && setSelectedDate(key)}
                  disabled={disabled}
                >
                  <span className="calendar-day__num">{d.getDate()}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="premium-booking__slots">
          <div className="slots-header">
            <div>
              <h4>Available slots</h4>
              <div className="slot-legend">
                <span className="slot-legend__item slot-legend__item--available">Available</span>
                <span className="slot-legend__item slot-legend__item--selected">Selected</span>
                <span className="slot-legend__item slot-legend__item--booked">Booked/Past</span>
                <span className="slot-legend__item slot-legend__item--unavailable">Unavailable</span>
              </div>
            </div>
            <div className="slots-sub">{new Date(selectedDate).toLocaleDateString()}</div>
          </div>

          <div className="slots-list">
            {loadingSlots ? (
              <div className="slots-loading">Loading slots...</div>
            ) : displaySlots.length ? (
              <div className="slots-grid">
                {displaySlots.map((slot) => {
                  const start = slot.start_time || slot.start || slot.startTime || '';
                  const end = slot.end_time || slot.end || slot.endTime || '';
                  const id = slot._id || slot.id || `${start}-${end}`;
                  const active = selectedSlot && (selectedSlot.slot_id === id || selectedSlot._id === id || selectedSlot.id === id || (selectedSlot.start_time === start && selectedSlot.end_time === end));
                  const availability = getSlotAvailabilityState({ slot, selectedDate, now });
                  const unavailable = !availability.available;
                  const status = availability.statusClass.toUpperCase();

                  return (
                    <button
                      key={id}
                      type="button"
                      className={`slot-card slot-card--${status.toLowerCase()} ${active ? 'slot-card--active' : ''}`}
                      onClick={() => !unavailable && onSlotSelect && onSlotSelect({ slot_id: id, start_time: start, end_time: end, date: selectedDate, status: slot.status || 'AVAILABLE' })}
                      disabled={unavailable}
                    >
                      <div className="slot-card__time">{start} - {end}</div>
                      <div className="slot-card__meta">{slot.duration ? slot.duration : '60 min'}</div>
                      <div className={`slot-card__status slot-card__status--${availability.statusClass}`}>{availability.label}</div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="slots-empty">No available slots for this date.</div>
            )}
          </div>
        </div>
      </div>

      <div className="premium-booking__summary">
        <div className="summary-card">
          <div className="summary-card__title">Booking summary</div>
          <div className="summary-line"><strong>Salon:</strong> <span className="summary-text">Single salon</span></div>
          <div className="summary-line"><strong>Stylist:</strong> <span className="summary-text">{stylistId || 'Any'}</span></div>
          <div className="summary-line"><strong>Date:</strong> <span className="summary-text">{new Date(selectedDate).toLocaleDateString()}</span></div>
          <div className="summary-line"><strong>Slot:</strong> <span className="summary-text">{selectedSlot ? `${selectedSlot.start_time} - ${selectedSlot.end_time}` : 'Not selected'}</span></div>
        </div>
      </div>
    </div>
  );
};

export default PremiumBooking;
