const StylistDetailModal = ({ isOpen, stylist, onClose, onOpenCertifications, onOpenGallery }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div className="modal-card modal-card--detail" role="dialog" aria-modal="true" aria-label="Stylist details" onClick={(event) => event.stopPropagation()}>
        <div className="modal-card__header">
          <div>
            <div className="modal-card__eyebrow">View More</div>
            <h3>{stylist?.name}</h3>
          </div>
          <button type="button" className="modal-card__close" onClick={onClose} aria-label="Close details">
            ×
          </button>
        </div>

        <div className="modal-detail">
          <img src={stylist?.image || stylist?.stylist_photo} alt={stylist?.name} className="modal-detail__image" />
          <div className="modal-detail__content">
            <p>{stylist?.bio || 'Experienced stylist with a modern service portfolio and curated gallery.'}</p>

            <div className="modal-detail__meta">
              <span>{stylist?.specialization || stylist?.serviceTag}</span>
              <span>{stylist?.experience} years</span>
              <span>{stylist?.city}</span>
              <span>{stylist?.area}</span>
            </div>

            <div className="modal-detail__actions">
              <button type="button" className="modal-card__action" onClick={() => onOpenCertifications?.(stylist)}>
                Certifications
              </button>
              <button type="button" className="modal-card__action" onClick={() => onOpenGallery?.(stylist)}>
                Professional Gallery
              </button>
            </div>

            <div className="modal-detail__services">
              {(stylist?.services || []).map((service) => (
                <div key={service.id || service.name} className="modal-detail__service">
                  <span>{service.name}</span>
                  <strong>{service.duration}</strong>
                  <strong>₹{service.price}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StylistDetailModal;