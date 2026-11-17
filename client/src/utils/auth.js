const AUTH_STORAGE_KEYS = ['token', 'customer', 'customer_status', 'userId', 'auth_role', 'auth_userId', 'auth_user'];

export const normalizeRole = (role = '') => {
  if (role === 'stylist' || role === 'manager') {
    return 'staff';
  }

  return role;
};

const base64UrlDecode = (value) => {
  const normalizedValue = value.replace(/-/g, '+').replace(/_/g, '/');
  const paddedValue = normalizedValue.padEnd(Math.ceil(normalizedValue.length / 4) * 4, '=');

  return window.atob(paddedValue);
};

export const getStoredAuthToken = () => localStorage.getItem('token') || '';

export const getStoredAuthRole = () => normalizeRole(localStorage.getItem('auth_role') || parseJwtPayload(getStoredAuthToken())?.role || '');

export const getStoredAuthUserId = () => localStorage.getItem('auth_userId') || parseJwtPayload(getStoredAuthToken())?.userId || parseJwtPayload(getStoredAuthToken())?.customer_id || '';

export const getStoredCustomer = () => {
  const rawCustomer = localStorage.getItem('customer');

  if (!rawCustomer) {
    return null;
  }

  try {
    return JSON.parse(rawCustomer);
  } catch {
    return null;
  }
};

export const parseJwtPayload = (token = '') => {
  if (!token || !token.includes('.')) {
    return null;
  }

  try {
    const [, payload] = token.split('.');
    return JSON.parse(base64UrlDecode(payload));
  } catch {
    return null;
  }
};

export const isTokenValid = (token = '') => {
  const payload = parseJwtPayload(token);

  if (!payload || !payload.exp) {
    return false;
  }

  return payload.exp * 1000 > Date.now();
};

export const getAuthSnapshot = () => {
  const token = getStoredAuthToken();
  const payload = parseJwtPayload(token);

  return {
    token,
    isAuthenticated: Boolean(token) && isTokenValid(token),
    customer: getStoredCustomer(),
    payload,
    role: normalizeRole(getStoredAuthRole() || payload?.role || (payload?.customer_id ? 'customer' : '')),
    userId: getStoredAuthUserId() || payload?.userId || payload?.customer_id || '',
  };
};

export const getAuthRedirectPath = (role = '') => {
  const normalizedRole = normalizeRole(role);

  if (normalizedRole === 'admin') {
    return '/admin';
  }

  if (normalizedRole === 'staff') {
    return '/staff';
  }

  return '/';
};

export const getAuthLoginPath = (role = '') => {
  return '/login';
};

export const getRoleNavigationItems = (role = '') => {
  const normalizedRole = normalizeRole(role);
  const sharedLogout = { label: 'Logout', target: getAuthLoginPath(normalizedRole), action: 'logout' };

  if (normalizedRole === 'admin') {
    return [
      { label: 'Dashboard', target: '/admin/dashboard' },
      sharedLogout,
    ];
  }

  if (normalizedRole === 'staff') {
    return [
      { label: 'Dashboard', target: '/staff/dashboard' },
      sharedLogout,
    ];
  }

  return [
    { label: 'Home', target: '/' },
    { label: 'Bookings', target: '/bookings' },
    { label: 'Profile', target: '/profile' },
    sharedLogout,
  ];
};

export const storeAuthSession = ({ token = '', role = '', userId = '', user = null, customer = null }) => {
  if (token) {
    localStorage.setItem('token', token);
  }

  if (role) {
    localStorage.setItem('auth_role', role);
  }

  if (userId) {
    localStorage.setItem('auth_userId', userId);
    localStorage.setItem('userId', userId);
  }

  if (user) {
    localStorage.setItem('auth_user', JSON.stringify(user));
  }

  if (customer) {
    localStorage.setItem('customer', JSON.stringify(customer));
    localStorage.setItem('customer_status', customer.status || 'OS');
  }
};

export const getAuthenticatedCustomerId = (fallbackCustomerId = '') => {
  if (fallbackCustomerId) {
    return fallbackCustomerId;
  }

  const storedCustomer = getStoredCustomer();

  if (storedCustomer?._id) {
    return storedCustomer._id;
  }

  const payload = parseJwtPayload(getStoredAuthToken());

  return payload?.customer_id || payload?.customerId || payload?.userId || getStoredAuthUserId() || '';
};

export const clearAuthStorage = () => {
  AUTH_STORAGE_KEYS.forEach((key) => {
    localStorage.removeItem(key);
  });
};
