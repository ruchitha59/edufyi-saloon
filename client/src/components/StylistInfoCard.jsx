const StylistInfoCard = ({ stylist, branchName, area, city }) => {
  if (!stylist) {
    return null;
  }

  const ratingValue = typeof stylist.rating === 'number' ? stylist.rating.toFixed(1) : stylist.rating || '4.5';

  return (
    <article className="booking-card booking-card--stylist">
      <img
        src={stylist.image || stylist.stylist_photo}
        alt={stylist.name}
        className="booking-stylist__image"
      />

      <div className="booking-stylist__body">
        <div className="booking-card__eyebrow">Selected stylist</div>
        <h2 className="booking-stylist__name">{stylist.name}</h2>
        <div className="booking-stylist__meta">{branchName || stylist.branch_name || 'Salon branch'}</div>
        <div className="booking-stylist__meta booking-stylist__meta--soft">
          {area || stylist.area || 'Near you'} {city ? `, ${city}` : ''}
        </div>
      </div>

      <div className="booking-stylist__rating">★ {ratingValue}</div>
    </article>
  );
};

export default StylistInfoCard;