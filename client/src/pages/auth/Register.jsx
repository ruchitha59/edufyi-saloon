import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/axios';
import { clearAuthStorage, getAuthRedirectPath, getStoredAuthRole, getStoredAuthToken, isTokenValid, parseJwtPayload } from '../../utils/auth';

const authHighlights = ['Create a customer account', 'Keep login details in sync', 'OTP-ready phone verification'];

const Register = () => {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const token = getStoredAuthToken();

    if (token && isTokenValid(token)) {
      const payload = parseJwtPayload(token);
      const role = getStoredAuthRole() || payload?.role || (payload?.customer_id ? 'customer' : '');

      if (role) {
        navigate(getAuthRedirectPath(role), { replace: true });
        return;
      }
    }

    if (token && !isTokenValid(token)) {
      clearAuthStorage();
    }

    setInitializing(false);
  }, [navigate]);

  const validateForm = () => {
    const nextFieldErrors = {};
    const trimmedName = name.trim();
    const trimmedAge = String(age).trim();
    const normalizedAge = Number(trimmedAge);
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedMobileNumber = String(mobileNumber).replace(/\D/g, '').slice(0, 10);
    const trimmedPassword = password.trim();
    const trimmedConfirmPassword = confirmPassword.trim();

    if (!trimmedName) {
      nextFieldErrors.name = 'Required';
    }

    if (!trimmedAge) {
      nextFieldErrors.age = 'Required';
    }

    if (!gender) {
      nextFieldErrors.gender = 'Required';
    }

    if (!normalizedEmail) {
      nextFieldErrors.email = 'Required';
    }

    if (!normalizedMobileNumber) {
      nextFieldErrors.mobileNumber = 'Required';
    }

    if (!trimmedPassword) {
      nextFieldErrors.password = 'Required';
    }

    if (!trimmedConfirmPassword) {
      nextFieldErrors.confirmPassword = 'Required';
    }

    if (!nextFieldErrors.name && (trimmedName.length < 3 || trimmedName.length > 20)) {
      nextFieldErrors.name = 'Name must be between 3 and 20 characters';
    }

    if (!nextFieldErrors.age && (!Number.isInteger(normalizedAge) || normalizedAge < 1 || normalizedAge > 146)) {
      nextFieldErrors.age = 'Age you entered is invalid';
    }

    if (!nextFieldErrors.gender && !['Male', 'Female', 'Other'].includes(gender)) {
      nextFieldErrors.gender = 'Please select a gender';
    }

    if (!nextFieldErrors.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      nextFieldErrors.email = 'Please enter a valid email';
    }

    if (!nextFieldErrors.mobileNumber && !/^[6-9]\d{9}$/.test(normalizedMobileNumber)) {
      nextFieldErrors.mobileNumber = 'Mobile number you entered is invalid';
    }

    if (!nextFieldErrors.password && trimmedPassword.length < 6) {
      nextFieldErrors.password = 'Password must be at least 6 characters';
    }

    if (!nextFieldErrors.confirmPassword && trimmedPassword !== trimmedConfirmPassword) {
      nextFieldErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(nextFieldErrors).length) {
      setFieldErrors(nextFieldErrors);
      setErrorMessage(
        nextFieldErrors.name ||
          nextFieldErrors.age ||
          nextFieldErrors.gender ||
          nextFieldErrors.email ||
          nextFieldErrors.mobileNumber ||
          nextFieldErrors.password ||
          nextFieldErrors.confirmPassword ||
          'Please fill all required fields'
      );
      return null;
    }

    setFieldErrors({});
    setErrorMessage('');
    return {
      name: trimmedName,
      age: normalizedAge,
      gender,
      email: normalizedEmail,
      mobile_number: normalizedMobileNumber,
      password: trimmedPassword,
      confirm_password: trimmedConfirmPassword,
    };
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const payload = validateForm();
    if (!payload) {
      return;
    }

    try {
      setLoading(true);
      setErrorMessage('');
      setSuccessMessage('');

      const response = await apiClient.post('/auth/register', payload);

      setSuccessMessage(response?.data?.message || 'Your account has been created successfully');

      window.setTimeout(() => {
        navigate('/login');
      }, 900);
    } catch (requestError) {
      const responseMessage = requestError?.response?.data?.message || 'Something went wrong while creating the account';
      setErrorMessage(responseMessage);
    } finally {
      setLoading(false);
    }
  };

  if (initializing) {
    return (
      <div className="auth-loading-screen">
        <div className="auth-loading-card">
          <div className="auth-spinner" />
          <p>Loading registration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page app-shell min-h-screen w-full overflow-x-hidden">
      <div className="auth-page__backdrop auth-page__backdrop--one" />
      <div className="auth-page__backdrop auth-page__backdrop--two" />

      <div className="auth-page__layout auth-page__layout--compact app-container">
        <aside className="auth-rail auth-rail--register">
          <div className="auth-brand auth-brand--compact">
            <div className="auth-brand__mark">✂</div>
            <div>
              <div className="auth-brand__name">SalonBook</div>
              <div className="auth-brand__tagline">Premium Salon Booking Platform</div>
            </div>
          </div>

          <button type="button" onClick={() => navigate('/login')} className="auth-back-link">
            ← Back to login
          </button>

          <h1 className="auth-rail__title">
            Create your account.
            <span>One profile, one login.</span>
          </h1>

          <p className="auth-rail__description">
            Enter your customer details once. We will keep the profile linked to your email and phone number so you can log in without creating duplicates.
          </p>

          <div className="auth-mini-features">
            {authHighlights.map((item) => (
              <span key={item} className="auth-mini-feature">
                {item}
              </span>
            ))}
          </div>

          <div className="auth-rail__accent auth-rail__accent--register" />
        </aside>

        <main className="auth-flow-shell auth-flow-shell--register">
          <section className="auth-flow-card auth-flow-card--register">
            <div className="auth-step">Customer registration</div>
            <h2 className="auth-card__title">Create your account</h2>
            <p className="auth-card__description">Fill in your details, email, phone number, and password. The account will be linked to your existing customer profile when possible.</p>

            <form className="auth-form" onSubmit={handleSubmit}>
              <label className="auth-form__field">
                <span className="auth-form__label">Full name</span>
                <div className="auth-field-group">
                  <span className="auth-field-group__icon">👤</span>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Enter your full name"
                    className="auth-input"
                    autoComplete="name"
                  />
                </div>
                {fieldErrors.name ? <p className="auth-field-error">{fieldErrors.name}</p> : null}
              </label>

              <div className="auth-form__row">
                <label className="auth-form__field">
                  <span className="auth-form__label">Age</span>
                  <div className="auth-field-group">
                    <span className="auth-field-group__icon">🎂</span>
                    <input
                      id="age"
                      type="number"
                      min="1"
                      max="146"
                      value={age}
                      onChange={(event) => setAge(event.target.value)}
                      placeholder="Enter your age"
                      className="auth-input"
                    />
                  </div>
                  {fieldErrors.age ? <p className="auth-field-error">{fieldErrors.age}</p> : null}
                </label>

                <label className="auth-form__field">
                  <span className="auth-form__label">Gender</span>
                  <div className="auth-field-group">
                    <span className="auth-field-group__icon">⚲</span>
                    <select
                      id="gender"
                      value={gender}
                      onChange={(event) => setGender(event.target.value)}
                      className="auth-input auth-select"
                    >
                      <option value="">Select your gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  {fieldErrors.gender ? <p className="auth-field-error">{fieldErrors.gender}</p> : null}
                </label>
              </div>

              <label className="auth-form__field">
                <span className="auth-form__label">Email</span>
                <div className="auth-field-group">
                  <span className="auth-field-group__icon">✉</span>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="name@example.com"
                    className="auth-input"
                    autoComplete="email"
                  />
                </div>
                {fieldErrors.email ? <p className="auth-field-error">{fieldErrors.email}</p> : null}
              </label>

              <label className="auth-form__field">
                <span className="auth-form__label">Phone number</span>
                <div className="auth-field-group auth-field-group--phone">
                  <div className="auth-country-code">
                    <span>+91</span>
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M7 10l5 5 5-5" />
                    </svg>
                  </div>
                  <input
                    id="mobile_number"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    placeholder="Enter 10 digit mobile number"
                    value={mobileNumber}
                    onChange={(event) => setMobileNumber(event.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="auth-input"
                  />
                </div>
                {fieldErrors.mobileNumber ? <p className="auth-field-error">{fieldErrors.mobileNumber}</p> : null}
              </label>

              <div className="auth-form__row">
                <label className="auth-form__field">
                  <span className="auth-form__label">Password</span>
                  <div className="auth-field-group">
                    <span className="auth-field-group__icon">🔑</span>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Create a password"
                      className="auth-input"
                      autoComplete="new-password"
                    />
                  </div>
                  {fieldErrors.password ? <p className="auth-field-error">{fieldErrors.password}</p> : null}
                </label>

                <label className="auth-form__field">
                  <span className="auth-form__label">Confirm password</span>
                  <div className="auth-field-group">
                    <span className="auth-field-group__icon">🔐</span>
                    <input
                      id="confirm_password"
                      type="password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      placeholder="Repeat your password"
                      className="auth-input"
                      autoComplete="new-password"
                    />
                  </div>
                  {fieldErrors.confirmPassword ? <p className="auth-field-error">{fieldErrors.confirmPassword}</p> : null}
                </label>
              </div>

              {errorMessage ? <div className="auth-alert auth-alert--error">{errorMessage}</div> : null}
              {successMessage ? <div className="auth-alert auth-alert--success">{successMessage}</div> : null}

              <button type="submit" disabled={loading} className="auth-button auth-button--full">
                {loading ? (
                  <span className="auth-loading-inline">
                    <span className="auth-spinner auth-spinner--small" />
                    Creating account...
                  </span>
                ) : (
                  <>
                    Create account
                    <span className="auth-button__arrow">→</span>
                  </>
                )}
              </button>

              <div className="auth-actions-row auth-actions-row--compact">
                <button type="button" onClick={() => navigate('/login')} className="auth-secondary-button">
                  Already have an account? Sign in
                </button>
                <div className="auth-note">
                  <span className="auth-note__icon">🔒</span>
                  <span>Your details stay tied to a single customer profile.</span>
                </div>
              </div>
            </form>
          </section>
        </main>
      </div>
    </div>
  );
};

export default Register;
