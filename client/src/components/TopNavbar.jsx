import { useNavigate } from 'react-router-dom';
import { clearAuthStorage, getAuthLoginPath, getAuthSnapshot, getRoleNavigationItems } from '../utils/auth';

const TopNavbar = ({ active = 'Home', onNavigate }) => {
  const navigate = useNavigate();
  const { isAuthenticated, customer, role } = getAuthSnapshot();
  const navItems = getRoleNavigationItems(role);

  const handleLogout = () => {
    clearAuthStorage();
    navigate(getAuthLoginPath(role), { replace: true });
  };

  const isCustomerNav = role === 'customer' || !role;
  const visibleNavItems = isCustomerNav ? navItems.filter((item) => ['Home', 'Bookings', 'Profile', 'Logout'].includes(item.label)) : navItems;

  return (
    <header className="top-navbar desktop-only" aria-label="Desktop navigation">
      <button type="button" className="top-navbar__brand" onClick={() => onNavigate?.('/')}>
        <span className="top-navbar__name">SalonBook</span>
      </button>

      <nav className="top-navbar__links" aria-label="Primary">
        {isAuthenticated ? (
          <>
            {visibleNavItems.map((item) => (
              item.action === 'logout' ? (
                <button key={item.label} type="button" className="top-navbar__link top-navbar__link--logout" onClick={handleLogout}>
                  {item.label}
                </button>
              ) : (
                <button
                  key={item.label}
                  type="button"
                  className={`top-navbar__link ${active === item.label ? 'active' : ''}`}
                  onClick={() => onNavigate?.(item.target)}
                >
                  {item.label}
                </button>
              )
            ))}
            {isCustomerNav ? (
              <button type="button" className="top-navbar__cta" onClick={() => onNavigate?.('/stylists')}>
                Book Appointment
              </button>
            ) : null}
            {customer?.name ? <span className="top-navbar__badge">{customer.name}</span> : null}
          </>
        ) : (
          <button type="button" className="top-navbar__cta" onClick={() => navigate(getAuthLoginPath('customer'))}>
            Login
          </button>
        )}
      </nav>
    </header>
  );
};

export default TopNavbar;
