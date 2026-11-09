import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/axios';
import {
  clearAuthStorage,
  getAuthRedirectPath,
  getStoredAuthRole,
  getStoredAuthToken,
  isTokenValid,
  parseJwtPayload,
  storeAuthSession,
} from '../../utils/auth';

const OTP_LENGTH = 6;
const emptyOtp = Array.from({ length: OTP_LENGTH }, () => '');

const LOGIN_MODES = {
  customer: 'customer',
  staffAdmin: 'staffAdmin',
};

const PhoneAuth = () => {
  const navigate = useNavigate();
  const otpRefs = useRef([]);

  const [mode, setMode] = useState(LOGIN_MODES.customer);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [otpDigits, setOtpDigits] = useState(emptyOtp);
  const [step, setStep] = useState('credentials');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [pendingCustomer, setPendingCustomer] = useState(null);

  const normalizedIdentifier = useMemo(
    () => String(identifier).trim(),
    [identifier]
  );

  const normalizedEmail = useMemo(
    () => String(identifier).trim().toLowerCase(),
    [identifier]
  );

  const otpValue = useMemo(
    () => otpDigits.join(''),
    [otpDigits]
  );

  useEffect(() => {
    const token = getStoredAuthToken();

    if (token && isTokenValid(token)) {
      const payload = parseJwtPayload(token);
      const role =
        getStoredAuthRole() ||
        payload?.role ||
        (payload?.customer_id ? 'customer' : '');

      navigate(getAuthRedirectPath(role), {
        replace: true,
      });

      return;
    }

    if (token && !isTokenValid(token)) {
      clearAuthStorage();
    }
  }, [navigate]);

  useEffect(() => {
    setStep('credentials');
    setOtpDigits(emptyOtp);
    setError('');
    setDevOtp('');
    setPendingCustomer(null);
    setPassword('');
  }, [mode]);

  const focusOtpBox = (index) => {
    otpRefs.current[index]?.focus?.();
  };

  const startCustomerOtp = async () => {
    setError('');

    if (!normalizedIdentifier || !password.trim()) {
      setError('Mobile number and password are required');
      return;
    }

    try {
      setLoading(true);

      const response = await apiClient.post('/auth/login', {
        identifier: normalizedIdentifier,
        email: normalizedEmail,
        mobile_number: normalizedIdentifier.replace(/\D/g, ''),
        password: password.trim(),
      });

      const customer =
        response?.data?.customer || null;

      const generatedOtp =
        response?.data?.generated_otp || '';

      setPendingCustomer(customer);
      setDevOtp(generatedOtp);
      setStep('otp');
      setOtpDigits(emptyOtp);

      focusOtpBox(0);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          'Invalid mobile number or password.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleStaffAdminLogin = async (event) => {
    event.preventDefault();

    if (!normalizedEmail || !password.trim()) {
      setError('Email and password are required');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await apiClient.post(
        '/auth/staff-admin-login',
        {
          email: normalizedEmail,
          password: password.trim(),
        }
      );

      const token =
        response?.data?.token || '';

      const user =
        response?.data?.user || null;

      const userRole =
        response?.data?.role || 'staff';

      storeAuthSession({
        token,
        role: userRole,
        userId:
          user?._id ||
          user?.id ||
          '',
        user,
      });

      navigate(
        getAuthRedirectPath(userRole),
        {
          replace: true,
        }
      );
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          'Invalid email or password.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    const digit = value
      .replace(/\D/g, '')
      .slice(-1);

    setOtpDigits((current) => {
      const next = [...current];
      next[index] = digit;
      return next;
    });

    if (
      digit &&
      index < OTP_LENGTH - 1
    ) {
      focusOtpBox(index + 1);
    }
  };

  const verifyCustomerOtp = async () => {
    if (otpValue.length !== OTP_LENGTH) {
      setError('Enter the 6-digit OTP');
      return;
    }

    try {
      setLoading(true);

      const response = await apiClient.post(
        '/auth/verify-otp',
        {
          identifier: normalizedIdentifier,
          email: normalizedEmail,
          mobile_number:
            normalizedIdentifier.replace(/\D/g, ''),
          otp: otpValue,
        }
      );

      const token =
        response?.data?.token;

      const customer =
        response?.data?.customer ||
        pendingCustomer;

      if (token) {
        storeAuthSession({
          token,
          role: 'customer',
          userId:
            customer?._id ||
            customer?.id ||
            '',
          customer,
        });
      }

      navigate('/', {
        replace: true,
      });
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          'OTP verification failed'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="auth-page app-shell min-h-screen w-full overflow-x-hidden"
      style={{
        position: 'relative',
        zIndex: 10,
        minHeight: '100vh',
        width: '100%',
        background: 'transparent',
      }}
    >
      {/* IMPORTANT:
          The old auth-page backdrop elements were removed.
          RibbonGlow from App.jsx is now visible behind this page.
      */}

      <div
        className="auth-page__layout auth-page__layout--compact app-container"
        style={{
          position: 'relative',
          zIndex: 10,
          background: 'transparent',
        }}
      >
        <aside className="auth-rail auth-rail--register">
          <div className="auth-brand auth-brand--compact">
            <div className="auth-brand__mark">
              ✂
            </div>

            <div>
              <div className="auth-brand__name">
                SalonBook
              </div>

              <div className="auth-brand__tagline">
                Premium Salon Booking Platform
              </div>
            </div>
          </div>

          <h1 className="auth-rail__title">
            One login.

            <span>
              All roles, one entry point.
            </span>
          </h1>

          <p className="auth-rail__description">
            Customers use the OTP flow. Staff and
            admins sign in with email and password.
            The system routes each role to the
            correct dashboard automatically.
          </p>

          <div className="auth-mini-features">
            <span className="auth-mini-feature">
              Customer OTP
            </span>

            <span className="auth-mini-feature">
              Staff/Admin login
            </span>

            <span className="auth-mini-feature">
              Role-based redirect
            </span>
          </div>

          <div className="auth-rail__accent auth-rail__accent--register" />
        </aside>

        <main className="auth-flow-shell auth-flow-shell--register">
          <section className="auth-flow-card auth-flow-card--register">
            <div className="auth-step">
              Unified login
            </div>

            <h2 className="auth-card__title">
              Welcome back
            </h2>

            <p className="auth-card__description">
              Choose your login method and continue.
            </p>

            <div
              className="auth-mode-switch"
              style={{
                display: 'grid',
                gridTemplateColumns:
                  '1fr 1fr',
                gap: 8,
                marginBottom: 20,
              }}
            >
              <button
                type="button"
                onClick={() =>
                  setMode(
                    LOGIN_MODES.customer
                  )
                }
                className={`auth-button ${
                  mode ===
                  LOGIN_MODES.customer
                    ? 'auth-button--full'
                    : ''
                }`}
                style={{
                  opacity:
                    mode ===
                    LOGIN_MODES.customer
                      ? 1
                      : 0.72,
                }}
              >
                CUSTOMER LOGIN
              </button>

              <button
                type="button"
                onClick={() =>
                  setMode(
                    LOGIN_MODES.staffAdmin
                  )
                }
                className={`auth-button ${
                  mode ===
                  LOGIN_MODES.staffAdmin
                    ? 'auth-button--full'
                    : ''
                }`}
                style={{
                  opacity:
                    mode ===
                    LOGIN_MODES.staffAdmin
                      ? 1
                      : 0.72,
                }}
              >
                Staff/Admin Login
              </button>
            </div>

            {mode ===
            LOGIN_MODES.customer ? (
              step === 'credentials' ? (
                <div className="auth-form">
                  <label className="auth-form__field">
                    <span className="auth-form__label">
                      Mobile number or email
                    </span>

                    <div className="auth-field-group">
                      <span className="auth-field-group__icon">
                        ✉
                      </span>

                      <input
                        type="text"
                        value={identifier}
                        onChange={(event) =>
                          setIdentifier(
                            event.target.value
                          )
                        }
                        placeholder="Enter mobile number or email"
                        className="auth-input"
                        autoComplete="username"
                      />
                    </div>
                  </label>

                  <label className="auth-form__field">
                    <span className="auth-form__label">
                      Password
                    </span>

                    <div className="auth-field-group">
                      <span className="auth-field-group__icon">
                        🔑
                      </span>

                      <input
                        type="password"
                        value={password}
                        onChange={(event) =>
                          setPassword(
                            event.target.value
                          )
                        }
                        placeholder="Enter password"
                        className="auth-input"
                        autoComplete="current-password"
                      />
                    </div>
                  </label>

                  {error ? (
                    <div className="auth-alert auth-alert--error">
                      {error}
                    </div>
                  ) : null}

                  <button
                    type="button"
                    onClick={startCustomerOtp}
                    disabled={loading}
                    className="auth-button auth-button--full"
                  >
                    {loading
                      ? 'Sending...'
                      : 'CUSTOMER LOGIN'}
                  </button>

                  <div
                    style={{
                      marginTop: 12,
                      display: 'flex',
                      justifyContent:
                        'space-between',
                    }}
                  >
                    <button
                      type="button"
                      className="auth-link-button"
                      onClick={() =>
                        navigate('/register')
                      }
                    >
                      Create account
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="auth-card__description">
                    Enter the 6-digit code sent
                    to your phone.
                  </p>

                  <div className="auth-otp-grid">
                    {otpDigits.map(
                      (digit, index) => (
                        <input
                          key={index}
                          ref={(el) =>
                            (otpRefs.current[
                              index
                            ] = el)
                          }
                          value={digit}
                          onChange={(event) =>
                            handleOtpChange(
                              index,
                              event.target.value
                            )
                          }
                          maxLength={1}
                          className="auth-otp-input"
                        />
                      )
                    )}
                  </div>

                  <div className="auth-alert auth-alert--success">
                    Dev OTP: {devOtp}
                  </div>

                  {error ? (
                    <div className="auth-alert auth-alert--error">
                      {error}
                    </div>
                  ) : null}

                  <button
                    type="button"
                    onClick={
                      verifyCustomerOtp
                    }
                    disabled={loading}
                    className="auth-button auth-button--full"
                  >
                    Verify OTP
                  </button>

                  <button
                    type="button"
                    className="auth-back-link"
                    onClick={() =>
                      setStep('credentials')
                    }
                  >
                    ← Back
                  </button>
                </div>
              )
            ) : (
              <form
                className="auth-form"
                onSubmit={
                  handleStaffAdminLogin
                }
              >
                <label className="auth-form__field">
                  <span className="auth-form__label">
                    Work email
                  </span>

                  <div className="auth-field-group">
                    <span className="auth-field-group__icon">
                      ✉
                    </span>

                    <input
                      type="email"
                      value={identifier}
                      onChange={(event) =>
                        setIdentifier(
                          event.target.value
                        )
                      }
                      placeholder="name@salon.com"
                      className="auth-input"
                      autoComplete="email"
                    />
                  </div>
                </label>

                <label className="auth-form__field">
                  <span className="auth-form__label">
                    Password
                  </span>

                  <div className="auth-field-group">
                    <span className="auth-field-group__icon">
                      🔑
                    </span>

                    <input
                      type="password"
                      value={password}
                      onChange={(event) =>
                        setPassword(
                          event.target.value
                        )
                      }
                      placeholder="Enter password"
                      className="auth-input"
                      autoComplete="current-password"
                    />
                  </div>
                </label>

                {error ? (
                  <div className="auth-alert auth-alert--error">
                    {error}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={loading}
                  className="auth-button auth-button--full"
                >
                  {loading
                    ? 'Signing in...'
                    : 'Sign in'}

                  <span className="auth-button__arrow">
                    →
                  </span>
                </button>
              </form>
            )}
          </section>
        </main>
      </div>
    </div>
  );
};

export default PhoneAuth;