const navItems = [
  { id: 'overview', label: 'Dashboard Overview' },
  { id: 'staff', label: 'Staff Management' },
  { id: 'services', label: 'Services' },
  { id: 'bookings', label: 'Bookings' },
  { id: 'slots', label: 'Slots' },
  { id: 'settings', label: 'Salon Settings' },
];

const AdminSidebar = ({ activeSection, onSelectSection, salons = [], selectedSalonId, onSelectSalon, onLogout, isOpen = false }) => {
  return (
    <aside className={`admin-sidebar ${isOpen ? 'is-open' : ''}`}>
      <div className="admin-sidebar__brand">
        <div className="admin-sidebar__mark">S</div>
        <div>
          <div className="admin-sidebar__name">SalonBook Admin</div>
          <div className="admin-sidebar__tag">Premium control room</div>
        </div>
      </div>

      <nav className="admin-sidebar__nav" aria-label="Admin sections">
        {navItems.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-label={item.label}
            title={item.label}
            className={`admin-sidebar__link ${activeSection === item.id ? 'is-active' : ''}`}
            onClick={() => onSelectSection(item.id)}
          >
            <span>{item.label}</span>
            <span className="admin-sidebar__chevron">→</span>
          </button>
        ))}
      </nav>

      <div className="admin-sidebar__panel">
        <div className="admin-sidebar__panel-label">Salon</div>
        <select className="admin-select admin-select--sidebar" value={selectedSalonId} onChange={(event) => onSelectSalon(event.target.value)}>
          {salons.map((salon) => (
            <option key={salon._id} value={salon._id}>
              {salon.name}
            </option>
          ))}
        </select>
        <button type="button" className="admin-button admin-button--ghost" onClick={onLogout}>
          Logout
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
