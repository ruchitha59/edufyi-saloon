const BrandCard = ({ brand }) => {
  return (
    <article className="brand-card">
      <div className="brand-card__logo">{brand.logo}</div>
      <div className="brand-card__name">{brand.name}</div>
    </article>
  );
};

export default BrandCard;