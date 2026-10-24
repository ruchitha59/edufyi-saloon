const CertificationModal = ({ isOpen, stylist, certifications = [], onClose }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div className="modal-card modal-card--gallery" role="dialog" aria-modal="true" aria-label="Certifications" onClick={(event) => event.stopPropagation()}>
        <div className="modal-card__header">
          <div>
            <div className="modal-card__eyebrow">Certifications</div>
            <h3>{stylist?.name}</h3>
          </div>
          <button type="button" className="modal-card__close" onClick={onClose} aria-label="Close certifications">
            ×
          </button>
        </div>

        <div className="modal-grid modal-grid--certifications">
          {certifications.map((item, index) => (
            <figure key={`${item}-${index}`} className="modal-tile">
              <img src={item} alt={`${stylist?.name || 'Stylist'} certification ${index + 1}`} />
            </figure>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CertificationModal;