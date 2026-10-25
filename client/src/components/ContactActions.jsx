const ContactActions = ({ onCall, onChat }) => {
  return (
    <div className="booking-contact-actions">
      <button type="button" className="contact-action contact-action--call" onClick={onCall}>
        Call stylist
      </button>
      <button type="button" className="contact-action contact-action--chat" onClick={onChat}>
        Chat stylist
      </button>
    </div>
  );
};

export default ContactActions;