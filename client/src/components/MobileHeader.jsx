import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { clearAuthStorage, getAuthLoginPath, getAuthSnapshot, getRoleNavigationItems } from '../utils/auth';

const MobileHeader = ({ title, showBack = false, showMenu = false, onBack, centerTitle = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, role } = getAuthSnapshot();
  const navItems = useMemo(() => getRoleNavigationItems(role), [role]);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) {
      return undefined;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [menuOpen]);

  const handleMenuItemClick = (item) => {
    if (item.action === 'logout') {
      clearAuthStorage();
      navigate(getAuthLoginPath(role), { replace: true });
      setMenuOpen(false);
      return;
    }

    if (item.target) {
      navigate(item.target);
      setMenuOpen(false);
    }
  };

  return (
    <header className="mobile-header">
      <div className="mobile-header__bar">
        {showBack ? (
          <button type="button" className="icon-button" onClick={onBack} aria-label="Go back">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        ) : (
          <div className="header-spacer" />
        )}

        <div className={`mobile-header__title ${centerTitle ? 'mobile-header__title--centered' : ''}`}>{title}</div>

        {showMenu ? (
          <button type="button" className="icon-button" onClick={() => setMenuOpen((value) => !value)} aria-label="Open navigation menu" aria-expanded={menuOpen}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
        ) : (
          <div className="header-spacer" />
        )}
      </div>

      {showMenu && menuOpen ? (
        <div className="mobile-nav" role="dialog" aria-modal="true" aria-label="Mobile navigation">
          <button type="button" className="mobile-nav__backdrop" onClick={() => setMenuOpen(false)} aria-label="Close navigation menu" />
          <div className="mobile-nav__panel">
            <div className="mobile-nav__header">
              <div>
                <div className="mobile-nav__eyebrow">SalonBook</div>
                <div className="mobile-nav__title">Menu</div>
              </div>
              <button type="button" className="icon-button mobile-nav__close" onClick={() => setMenuOpen(false)} aria-label="Close navigation menu">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>

            <nav className="mobile-nav__links" aria-label="Mobile primary navigation">
              {isAuthenticated ? (
                navItems.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    className={`mobile-nav__link ${location.pathname === item.target ? 'is-active' : ''}`}
                    onClick={() => handleMenuItemClick(item)}
                  >
                    {item.label}
                  </button>
                ))
              ) : (
                <button type="button" className="mobile-nav__link" onClick={() => navigate(getAuthLoginPath('customer'))}>
                  Login
                </button>
              )}
            </nav>
          </div>
        </div>
      ) : null}
    </header>
  );
};

export default MobileHeader;