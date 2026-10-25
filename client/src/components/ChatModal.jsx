import { useEffect, useState } from 'react';

const ChatModal = ({ isOpen, stylistName = 'stylist', onClose, onSend }) => {
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      setMessage(`Hello ${stylistName}, I need help with my appointment.`);
    }
  }, [isOpen, stylistName]);

  if (!isOpen) {
    return null;
  }

  const handleSend = () => {
    const trimmedMessage = message.trim();

    if (!trimmedMessage) {
      return;
    }

    onSend?.(trimmedMessage);
    setMessage('');
  };

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section className="modal-card modal-card--chat" role="dialog" aria-modal="true" aria-label="Chat with stylist" onClick={(event) => event.stopPropagation()}>
        <div className="modal-card__header">
          <div>
            <div className="modal-card__eyebrow">Chat</div>
            <h3>Message {stylistName}</h3>
          </div>
          <button type="button" className="modal-card__close" onClick={onClose} aria-label="Close chat">
            ×
          </button>
        </div>

        <p className="modal-card__body-text">Use chat to share notes or confirm appointment details before booking is completed.</p>

        <label className="booking-field booking-field--chat">
          <span>Your message</span>
          <textarea rows="5" value={message} onChange={(event) => setMessage(event.target.value)} />
        </label>

        <div className="modal-card__actions">
          <button type="button" className="contact-action contact-action--soft" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="contact-action contact-action--chat" onClick={handleSend}>
            Send message
          </button>
        </div>
      </section>
    </div>
  );
};

export default ChatModal;