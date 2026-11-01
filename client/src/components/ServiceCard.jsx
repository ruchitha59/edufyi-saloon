const ServiceCard = ({ service, selected, onToggle, featured = false, dark = false }) => {
  return (
    <article className={`service-card ${selected ? 'selected' : ''} ${featured ? 'service-card--featured' : ''} ${dark ? 'service-card--dark' : ''}`}>
      <div className="service-card__topline">
        <div className="service-card__name">{service.name || service.service_name}</div>
        <span className="service-card__check" aria-hidden="true">{selected ? '✓' : '+'}</span>
      </div>
      <div className="service-card__meta">
        <span>{service.duration || 'Custom duration'}</span>
        <strong>₹{Number(service.price || 0).toLocaleString()}</strong>
      </div>
      <button type="button" className="service-card__action" onClick={() => onToggle?.(service)}>
        {selected ? 'Selected' : 'Select Service'}
      </button>
    </article>
  );
};

export default ServiceCard;
