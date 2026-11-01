import ServiceCard from './ServiceCard';

const ServiceSelection = ({ services, selectedServiceIds = [], onToggleService }) => {
  if (!services.length) {
    return (
      <div className="premium-empty-state">
        <div className="premium-empty-state__icon">✦</div>
        <strong>No services available yet</strong>
        <span>This stylist does not have active services configured.</span>
      </div>
    );
  }

  return (
    <div className="service-selection-grid service-selection-grid--services">
      {services.map((service) => (
        <ServiceCard
          key={service.id || service.name}
          service={service}
          selected={selectedServiceIds.includes(service.id || service.name)}
          onToggle={onToggleService}
        />
      ))}
    </div>
  );
};

export default ServiceSelection;
