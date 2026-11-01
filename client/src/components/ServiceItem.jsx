const ServiceItem = ({ service, onRemove }) => {
  const serviceName = service.service_name || service.name || '';

  return (
    <article className="booking-service-item">
      <div className="booking-service-item__left">
        <div className="booking-service-item__name">{serviceName}</div>
        <div className="booking-service-item__meta">{service.duration || 'Duration not set'}</div>
      </div>

      <div className="booking-service-item__right">
        <div className="booking-service-item__price">₹{Number(service.price || 0)}</div>

        {onRemove ? (
          <button
            type="button"
            className="booking-service-item__remove"
            aria-label={`Remove ${serviceName}`}
            onClick={() => onRemove(service)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M3 6h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8 6v14a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M10 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        ) : null}
      </div>
    </article>
  );
};

export default ServiceItem;