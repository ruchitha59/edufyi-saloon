const GalleryModal = ({ isOpen, stylist, images = [], onClose }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div className="modal-card modal-card--gallery" role="dialog" aria-modal="true" aria-label="Professional gallery" onClick={(event) => event.stopPropagation()}>
        <div className="modal-card__header">
          <div>
            <div className="modal-card__eyebrow">Professional Gallery</div>
            <h3>{stylist?.name}</h3>
          </div>
          <button type="button" className="modal-card__close" onClick={onClose} aria-label="Close gallery">
            ×
          </button>
        </div>

        <div className="modal-grid modal-grid--gallery">
          {images.map((item, index) => (
            <figure key={`${item}-${index}`} className="modal-tile modal-tile--gallery">
              <img src={item} alt={`${stylist?.name || 'Stylist'} gallery ${index + 1}`} />
            </figure>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GalleryModal;