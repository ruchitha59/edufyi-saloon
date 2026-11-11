import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNavbar from '../components/BottomNavbar';
import MobileHeader from '../components/MobileHeader';
import TopNavbar from '../components/TopNavbar';
import { getAuthSnapshot, getStoredCustomer, storeAuthSession } from '../utils/auth';

const CustomerProfile = () => {
  const navigate = useNavigate();
  const snapshot = getAuthSnapshot();
  const storedCustomer = getStoredCustomer() || snapshot.customer || {};

  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: storedCustomer.name || '',
    email: storedCustomer.email || '',
    mobile_number: storedCustomer.mobile_number || storedCustomer.mobileNumber || '',
    gender: storedCustomer.gender || '',
  });

  const initials = useMemo(() => {
    const value = profile.name || profile.email || 'Customer';
    return value
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }, [profile.email, profile.name]);

  const handleSave = (event) => {
    event.preventDefault();
    const nextCustomer = { ...storedCustomer, ...profile };
    storeAuthSession({ role: 'customer', userId: snapshot.userId, customer: nextCustomer });
    setEditing(false);
  };

  return (
    <div className="customer-portal site-shell site-shell--profile app-shell min-h-screen w-full overflow-x-hidden">
      <TopNavbar active="Profile" onNavigate={(target) => navigate(target)} />

      <main className="page-main page-main--profile app-container">
        <section className="mobile-header mobile-header--mobile-only">
          <MobileHeader title="Profile" showBack showMenu centerTitle onBack={() => navigate(-1)} />
        </section>

        <section className="profile-hero reveal-up">
          <div className="profile-avatar">{initials}</div>
          <div>
            <div className="page-kicker">Customer profile</div>
            <h1>{profile.name || 'Your profile'}</h1>
            <p>Manage your salon booking identity and review appointment activity.</p>
          </div>
        </section>

        <section className="profile-layout reveal-up reveal-delay-1">
          <article className="profile-card">
            <div className="section-header-row section-header-row--wide">
              <div>
                <div className="section-heading">Personal details</div>
                <div className="section-subheading">These details are used for customer booking records.</div>
              </div>
              <button type="button" className="text-link text-link--accent" onClick={() => setEditing((current) => !current)}>
                {editing ? 'Cancel' : 'Edit profile'}
              </button>
            </div>

            {editing ? (
              <form className="profile-form" onSubmit={handleSave}>
                <label className="booking-field">
                  <span>Full name</span>
                  <input value={profile.name} onChange={(event) => setProfile((current) => ({ ...current, name: event.target.value }))} />
                </label>
                <label className="booking-field">
                  <span>Email</span>
                  <input type="email" value={profile.email} onChange={(event) => setProfile((current) => ({ ...current, email: event.target.value }))} />
                </label>
                <label className="booking-field">
                  <span>Phone</span>
                  <input value={profile.mobile_number} onChange={(event) => setProfile((current) => ({ ...current, mobile_number: event.target.value }))} />
                </label>
                <label className="booking-field">
                  <span>Gender</span>
                  <input value={profile.gender} onChange={(event) => setProfile((current) => ({ ...current, gender: event.target.value }))} />
                </label>
                <button type="submit" className="continue-button">Save details</button>
              </form>
            ) : (
              <div className="profile-info-grid">
                <div><span>Name</span><strong>{profile.name || 'Not added'}</strong></div>
                <div><span>Email</span><strong>{profile.email || 'Not added'}</strong></div>
                <div><span>Phone</span><strong>{profile.mobile_number || 'Not added'}</strong></div>
                <div><span>Gender</span><strong>{profile.gender || 'Not added'}</strong></div>
              </div>
            )}
          </article>

          <article className="profile-card">
            <div className="section-heading">Appointment history</div>
            <div className="premium-empty-state premium-empty-state--compact">
              <div className="premium-empty-state__icon">✦</div>
              <strong>No bookings yet</strong>
              <span>Your completed and upcoming appointments will appear here after confirmation.</span>
              <button type="button" className="continue-button" onClick={() => navigate('/')}>Book a service</button>
            </div>
          </article>
        </section>
      </main>

      <BottomNavbar active="Profile" />
    </div>
  );
};

export default CustomerProfile;
