import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { clearAuthStorage, getAuthLoginPath, getAuthRedirectPath, getStoredAuthRole, getStoredAuthToken, isTokenValid, parseJwtPayload, normalizeRole } from '../utils/auth';

const ProtectedRoute = ({ allowedRoles = [] }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = getStoredAuthToken();
    const expectedRole = allowedRoles[0] || 'customer';

    if (!token || !isTokenValid(token)) {
      clearAuthStorage();
      navigate(getAuthLoginPath(expectedRole), { replace: true, state: { from: location.pathname } });
      return;
    }

    const payload = parseJwtPayload(token);
    const role = normalizeRole(getStoredAuthRole() || payload?.role || (payload?.customer_id ? 'customer' : ''));

    if (allowedRoles.length && !allowedRoles.includes(role)) {
      navigate(getAuthRedirectPath(role), { replace: true });
      return;
    }

    setChecking(false);
  }, [allowedRoles, location.pathname, navigate]);

  if (checking) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center overflow-x-hidden bg-[#fff8f3] px-6 text-center text-[#2f1b10]">
        <div>
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-[#ffd2ae] border-t-[#ff7a18]" />
          <p className="mt-4 text-sm font-medium text-[#7f6658]">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;