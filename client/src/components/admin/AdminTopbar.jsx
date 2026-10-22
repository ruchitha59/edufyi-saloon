const AdminTopbar = ({ activeLabel, salonName, onRefresh, onCreate, onMenuToggle }) => {
  return (
    <header className="admin-topbar">
      <button type="button" className="admin-topbar__menu" onClick={onMenuToggle} aria-label="Toggle sidebar">
        <span className="admin-topbar__menu-icon" aria-hidden="true">☰</span>
      </button>
      <div>
        <div className="admin-topbar__eyebrow">Admin dashboard</div>
        <h1 className="admin-topbar__title">{activeLabel}</h1>
        <p className="admin-topbar__subtitle">{salonName ? `Managing ${salonName}` : 'Select a salon to continue'}</p>
      </div>

      <div className="admin-topbar__actions">
        <button type="button" className="admin-button admin-button--ghost" onClick={onRefresh}>Refresh</button>
        <button type="button" className="admin-button admin-button--primary" onClick={onCreate}>Quick Add</button>
      </div>
    </header>
  );
};

export default AdminTopbar;
