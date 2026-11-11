import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNavbar from '../components/BottomNavbar';
import MobileHeader from '../components/MobileHeader';
import TopNavbar from '../components/TopNavbar';
import { getBookingsForCustomer } from '../services/bookingService';
import { getAuthSnapshot } from '../utils/auth';
import { getCustomerId } from '../utils/customerIdentity';

const toArray = (response) => (Array.isArray(response?.data) ? response.data : Array.isArray(response?.data?.data) ? response.data.data : []);

const normalizeBooking = (booking = {}) => {
  const services = booking.selectedServices || booking.selected_services || [];

  return {
    id: booking._id || booking.id || booking.appointmentId || booking.appointment_id || '',
    date: booking.bookingDate || booking.booking_date || '',
    slot: booking.bookingSlot || booking.booking_slot || '',
    status: String(booking.bookingStatus || booking.booking_status || 'PENDING').toUpperCase(),
    paymentStatus: String(booking.paymentStatus || booking.payment_status || 'NOT_STARTED').toUpperCase(),
    services,
    totalPrice: Number(booking.totalPrice || booking.total_price || 0),
    totalDuration: booking.totalDuration || booking.total_duration || '',
    category: booking.mainCategory || booking.main_category || '',
  };
};

const isPastBooking = (booking) => {
  const dateText = booking.date;

  if (!dateText || booking.status === 'COMPLETED' || booking.status === 'CANCELLED' || booking.status === 'PAYMENT_FAILED') {
    return booking.status === 'COMPLETED' || booking.status === 'CANCELLED' || booking.status === 'PAYMENT_FAILED';
  }

  const bookingDate = new Date(`${dateText}T23:59:59`);

  if (Number.isNaN(bookingDate.getTime())) {
    return false;
  }

  return bookingDate.getTime() < Date.now();
};

const formatDate = (dateText = '') => {
  const date = new Date(`${dateText}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? dateText || 'Date pending'
    : date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
};

const BookingCard = ({ booking }) => {
  const serviceNames = booking.services.map((service) => service.name || service.service_name || service.serviceName).filter(Boolean);

  return (
    <article className="customer-booking-card">
      <div className="customer-booking-card__header">
        <div>
          <span className="customer-booking-card__eyebrow">{booking.category || 'Salon appointment'}</span>
          <h3>{formatDate(booking.date)}</h3>
        </div>
        <span className={`customer-booking-status customer-booking-status--${booking.status.toLowerCase()}`}>{booking.status}</span>
      </div>

      <div className="customer-booking-card__meta">
        <div><span>Slot</span><strong>{booking.slot || 'Time pending'}</strong></div>
        <div><span>Duration</span><strong>{booking.totalDuration || 'Not set'}</strong></div>
        <div><span>Total</span><strong>₹{booking.totalPrice.toLocaleString()}</strong></div>
        <div><span>Payment</span><strong>{booking.paymentStatus.replace('_', ' ')}</strong></div>
      </div>

      <div className="customer-booking-card__services">
        {serviceNames.length ? serviceNames.map((name) => <span key={name}>{name}</span>) : <span>Services pending</span>}
      </div>
    </article>
  );
};

const CustomerBookings = () => {
  const navigate = useNavigate();
  const { userId } = getAuthSnapshot();
  const customerId = getCustomerId(userId);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let active = true;

    const loadBookings = async () => {
      if (!customerId) {
        setLoading(false);
        setErrorMessage('Customer profile is not available for this session.');
        return;
      }

      try {
        setLoading(true);
        setErrorMessage('');
        const response = await getBookingsForCustomer(customerId);

        if (active) {
          setBookings(toArray(response).map(normalizeBooking));
        }
      } catch (error) {
        if (active) {
          setErrorMessage(error?.response?.data?.message || 'Unable to load your bookings right now.');
          setBookings([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadBookings();

    return () => {
      active = false;
    };
  }, [customerId]);

  const currentBookings = useMemo(() => bookings.filter((booking) => !isPastBooking(booking)), [bookings]);
  const previousBookings = useMemo(() => bookings.filter(isPastBooking), [bookings]);

  return (
    <div className="customer-portal site-shell site-shell--bookings app-shell min-h-screen w-full overflow-x-hidden">
      <TopNavbar active="Bookings" onNavigate={(target) => navigate(target)} />

      <main className="page-main page-main--bookings app-container">
        <section className="mobile-header mobile-header--mobile-only">
          <MobileHeader title="Bookings" showBack showMenu centerTitle onBack={() => navigate(-1)} />
        </section>

        <section className="profile-hero reveal-up">
          <div className="profile-avatar">BK</div>
          <div>
            <div className="page-kicker">Your bookings</div>
            <h1>Appointments, all in one place.</h1>
            <p>Review current appointments and previous salon visits from your customer profile.</p>
          </div>
        </section>

        {loading ? <div className="loading-state">Loading your bookings...</div> : null}
        {errorMessage ? <div className="admin-alert">{errorMessage}</div> : null}

        {!loading && !errorMessage ? (
          <section className="customer-bookings-layout reveal-up reveal-delay-1">
            <article className="profile-card">
              <div className="section-header-row section-header-row--wide">
                <div>
                  <div className="section-heading">Current bookings</div>
                  <div className="section-subheading">Upcoming or active appointments.</div>
                </div>
              </div>

              <div className="customer-bookings-list">
                {currentBookings.length ? currentBookings.map((booking) => <BookingCard key={booking.id} booking={booking} />) : (
                  <div className="premium-empty-state premium-empty-state--compact">
                    <div className="premium-empty-state__icon">✦</div>
                    <strong>No current bookings</strong>
                    <span>Book a service and your upcoming appointment will appear here.</span>
                    <button type="button" className="continue-button" onClick={() => navigate('/')}>Book a service</button>
                  </div>
                )}
              </div>
            </article>

            <article className="profile-card">
              <div className="section-header-row section-header-row--wide">
                <div>
                  <div className="section-heading">Previous bookings</div>
                  <div className="section-subheading">Completed, cancelled, or past appointments.</div>
                </div>
              </div>

              <div className="customer-bookings-list">
                {previousBookings.length ? previousBookings.map((booking) => <BookingCard key={booking.id} booking={booking} />) : (
                  <div className="premium-empty-state premium-empty-state--compact">
                    <div className="premium-empty-state__icon">✦</div>
                    <strong>No previous bookings</strong>
                    <span>Your appointment history will build up after your first visit.</span>
                  </div>
                )}
              </div>
            </article>
          </section>
        ) : null}
      </main>

      <BottomNavbar active="Bookings" />
    </div>
  );
};

export default CustomerBookings;
