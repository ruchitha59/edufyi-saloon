const PriceSummary = ({ serviceCount = 0, totalDuration = '0 min', totalPrice = 0, appointmentId = '' }) => {
  return (
    <div className="booking-price-summary">
      <div className="booking-price-summary__row">
        <span>Services</span>
        <strong>{serviceCount}</strong>
      </div>
      <div className="booking-price-summary__row">
        <span>Total duration</span>
        <strong>{totalDuration}</strong>
      </div>
      <div className="booking-price-summary__row booking-price-summary__row--total">
        <span>Total price</span>
        <strong>₹{Number(totalPrice || 0)}</strong>
      </div>
      {appointmentId ? (
        <div className="booking-price-summary__row booking-price-summary__row--quiet">
          <span>Appointment</span>
          <strong>{appointmentId}</strong>
        </div>
      ) : null}
    </div>
  );
};

export default PriceSummary;