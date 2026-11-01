const StylistCard = ({
  stylist,
  compact = false,
  selected = false,
  loading = false,
  onSelect,
  onViewMore,
  onCertifications,
  onGallery,
}) => {
  const ratingValue = typeof stylist.rating === 'number' ? stylist.rating.toFixed(1) : stylist.rating;
  const services = Array.isArray(stylist.services) ? stylist.services.slice(0, 3) : [];
  const image = stylist.image || stylist.stylist_photo || 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=720&q=80';
  const experience = stylist.experience ? `${stylist.experience} years experience` : 'Experienced professional';
  const availabilityLabel = (stylist.status || '').toUpperCase() === 'AA' ? 'Available today' : 'Limited availability';

  const renderCompactCard = () => (
    <article className="stylist-card stylist-card--compact-view">
      <img src={image} alt={stylist.name} className="stylist-card__image" />
      <div className="stylist-card__body">
        <div className="stylist-card__name-row">
          <h3>{stylist.name}</h3>
          <span className="stylist-card__rating">★ {ratingValue}</span>
        </div>
        <div className="stylist-card__meta">{stylist.experience}</div>
        <div className="stylist-card__meta stylist-card__meta--faded">{stylist.distance}</div>
        <div className="stylist-card__tag">{stylist.serviceTag}</div>
      </div>
    </article>
  );

  if (compact) {
    return renderCompactCard();
  }

  return (
    <article className={`stylist-card stylist-card--detail ${selected ? 'selected' : ''}`}>
      <div className="stylist-card__detail-media">
        <img src={image} alt={stylist.name} className="stylist-card__detail-image" />
        <div className="stylist-card__detail-rating">★ {ratingValue || '4.8'}</div>
        <div className="stylist-card__availability">{availabilityLabel}</div>
      </div>
      <div className="stylist-card__detail-body">
        <div className="stylist-card__detail-header">
          <div>
            <h3>{stylist.name}</h3>
            <p>{stylist.specialization || stylist.serviceTag || 'Salon specialist'}</p>
          </div>
          <div className="stylist-card__detail-city">{stylist.city || stylist.distance}</div>
        </div>

        <div className="stylist-card__detail-meta">
          <span>{experience}</span>
          <span>{stylist.area || stylist.branch_name || 'Near you'}</span>
        </div>

        {services.length ? (
          <div className="stylist-card__services" aria-label="Services offered">
            {services.map((service) => (
              <span key={service.id || service.name || service.service_name}>{service.name || service.service_name}</span>
            ))}
          </div>
        ) : null}

        <p className="stylist-card__summary">{stylist.bio || 'Professional stylist available for booking and service selection.'}</p>

        <div className="stylist-card__detail-actions">
          <button type="button" className="stylist-card__primary-action" onClick={() => onSelect?.(stylist)} disabled={loading}>
            {loading ? 'Selecting...' : selected ? 'Selected' : 'Select Stylist'}
          </button>
          <button type="button" className="stylist-card__secondary-action" onClick={() => onViewMore?.(stylist)}>
            View More
          </button>
        </div>

        <div className="stylist-card__detail-links">
          <button type="button" className="text-link text-link--accent" onClick={() => onCertifications?.(stylist)}>
            Certifications
          </button>
          <button type="button" className="text-link text-link--accent" onClick={() => onGallery?.(stylist)}>
            Professional Gallery
          </button>
        </div>
      </div>
    </article>
  );
};

export default StylistCard;
