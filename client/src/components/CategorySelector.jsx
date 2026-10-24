import { SALON_CATEGORIES } from '../config/appConstants';

const CategorySelector = ({ value, onChange, categories = SALON_CATEGORIES }) => {
  return (
    <div className="selector-group">
      <div className="section-label">Main Category</div>
      <div className="category-grid" role="list" aria-label="Main categories">
        {categories.map((category) => (
          <button
            key={typeof category === 'string' ? category : category.value || category.label}
            type="button"
            className={`category-card ${value === (category.value || category.label || category) ? 'active' : ''}`}
            onClick={() => onChange(category.value || category.label || category)}
            role="listitem"
            aria-pressed={value === (category.value || category.label || category)}
          >
            <span className="category-title">{category.label || category}</span>
            <span className="category-description">Tap to choose</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategorySelector;
