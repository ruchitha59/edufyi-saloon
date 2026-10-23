import { useNavigate } from 'react-router-dom';
import { clearAuthStorage, getAuthLoginPath, getAuthSnapshot, getRoleNavigationItems } from '../utils/auth';

const iconPaths = {
  home: 'M4 11.5L12 4l8 7.5V20a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z',
  bookings: 'M8 3v3m8-3v3M5 9h14M6 5h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zm3 8h3m-3 4h6',
  orders: 'M7 6h10a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1zm2 3h6m-6 3h6m-6 3h4',
  order: 'M7 6h10a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1zm2 3h6m-6 3h6m-6 3h4',
  profile: 'M12 12.5a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm-6.5 7.5a6.5 6.5 0 0 1 13 0',
  account: 'M12 12.5a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm-6.5 7.5a6.5 6.5 0 0 1 13 0',
  logout: 'M10 17l1.5-1.5L8.5 12H20v-2H8.5l3-3L10 5l-6 7zm7-12h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3',
};

const BottomNavbar = ({ active = 'Home', onNavigate }) => {
  const navigate = useNavigate();
  const { isAuthenticated, role } = getAuthSnapshot();
  const navItems = getRoleNavigationItems(role);

  if (!isAuthenticated) {
    return null;
  }

  if (role !== 'customer') {
    return null;
  }

  const handleNavigate = (item) => {
    if (item.action === 'logout') {
      clearAuthStorage();
      navigate(getAuthLoginPath(role), { replace: true });
      return;
    }

    if (item.target) {
      navigate(item.target);
      return;
    }

    onNavigate?.(item.label);
  };

  return (
    <nav className="bottom-navbar" aria-label="Primary navigation">
      {navItems.map((item) => {
        const isActive = active === item.label;

        return (
          <button key={item.label} type="button" className={`bottom-nav-item ${isActive ? 'active' : ''}`} onClick={() => handleNavigate(item)}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d={iconPaths[item.action === 'logout' ? 'logout' : item.label.toLowerCase()] || iconPaths.home} />
            </svg>
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNavbar;
