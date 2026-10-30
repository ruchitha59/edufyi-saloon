const SearchBar = ({ placeholder }) => {
  return (
    <label className="search-bar">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15zm6-1.5L21 21" />
      </svg>
      <input type="text" placeholder={placeholder} aria-label={placeholder} />
    </label>
  );
};

export default SearchBar;