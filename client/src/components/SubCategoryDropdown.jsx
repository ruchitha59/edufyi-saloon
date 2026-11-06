const SubCategoryDropdown = ({ value, onChange, disabled, subCategories = [] }) => {
  return (
    <div className="selector-group">
      <label className="section-label" htmlFor="sub-category">
        Sub Category
      </label>
      <select
        id="sub-category"
        className="sub-category-select"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
      >
        <option value="">Select a sub category</option>
        {subCategories.map((subCategory) => (
          <option key={subCategory} value={subCategory}>
            {subCategory}
          </option>
        ))}
      </select>
    </div>
  );
};

export default SubCategoryDropdown;
