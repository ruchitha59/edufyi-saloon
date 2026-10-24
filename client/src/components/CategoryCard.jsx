const CategoryCard = ({ category, selected, onClick }) => {
  return (
    <button type="button" className={`category-chip ${selected ? 'selected' : ''}`} onClick={onClick} aria-pressed={selected}>
      <span className="category-chip__media">
        {category?.image ? <img src={category.image} alt={category.name} /> : <span>{String(category?.name || '?').slice(0, 1)}</span>}
      </span>
      <span className="category-chip__content">
        <span className="category-chip__label">{category.name}</span>
        {category?.description ? <span className="category-chip__description">{category.description}</span> : null}
      </span>
      <span className="category-chip__arrow">→</span>
    </button>
  );
};

export default CategoryCard;
