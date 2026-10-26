const DateTimePicker = ({ appointmentDate, appointmentTime, onDateChange, onTimeChange, minDate }) => {
  return (
    <div className="booking-datetime-grid">
      <label className="booking-field">
        <span>Appointment Date</span>
        <input type="date" value={appointmentDate} min={minDate} onChange={(event) => onDateChange?.(event.target.value)} />
      </label>

      <label className="booking-field">
        <span>Appointment Time</span>
        <input type="time" value={appointmentTime} onChange={(event) => onTimeChange?.(event.target.value)} />
      </label>
    </div>
  );
};

export default DateTimePicker;