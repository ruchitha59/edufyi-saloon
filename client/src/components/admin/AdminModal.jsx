const AdminModal = ({ open, title, subtitle, onClose, children }) => {
  if (!open) {
    return null;
  }

  return (
    <div className="admin-modal-backdrop" role="presentation" onClick={onClose}>
      <div className="admin-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <div className="admin-modal__header">
          <div>
            <div className="admin-modal__eyebrow">Salon control</div>
            <h3>{title}</h3>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          <button type="button" className="admin-modal__close" onClick={onClose} aria-label="Close modal">
            ×
          </button>
        </div>
        <div className="admin-modal__body">{children}</div>
      </div>
    </div>
  );
};

export default AdminModal;