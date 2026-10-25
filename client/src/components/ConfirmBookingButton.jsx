const ConfirmBookingButton = ({ loading = false, disabled = false, label = 'Book Appointment', loadingLabel = 'Booking...', onClick }) => {
  return (
    <button type="button" className="continue-button continue-button--wide booking-confirm-button" onClick={onClick} disabled={disabled || loading}>
      {loading ? loadingLabel : label}
    </button>
  );
};

export default ConfirmBookingButton;
