const SubcategoryCard = ({ subcategory, selected = subcategory.selected, onClick }) => {
  return (
    <button type="button" className={`subcategory-card ${selected ? 'selected' : ''}`} aria-pressed={selected} onClick={onClick}>
      <img src={subcategory.image} alt={subcategory.title} className="subcategory-card__image" />
      <div className="subcategory-card__overlay" />
      <span className="subcategory-card__title">{subcategory.title}</span>
      <span className="subcategory-card__check" aria-hidden="true">✓</span>
    </button>
  );
};

export default SubcategoryCard;