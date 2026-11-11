import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import BottomNavbar from '../components/BottomNavbar';
import MobileHeader from '../components/MobileHeader';
import TopNavbar from '../components/TopNavbar';
import { getAppointmentById, markAppointmentPaymentFailed, updateAppointment } from '../services/appointmentService';
import { getCustomerId } from '../utils/customerIdentity';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const paymentOptions = [
  { id: 'UPI', title: 'UPI', meta: 'Google Pay, PhonePe, Paytm', icon: 'upi' },
  { id: 'CARD', title: 'Card', meta: 'Visa, Mastercard, RuPay', icon: 'card' },
  { id: 'NET_BANKING', title: 'Net Banking', meta: 'All major banks', icon: 'bank' },
  { id: 'WALLET', title: 'Wallet', meta: 'Fast wallet checkout', icon: 'wallet' },
];

const normalizeService = (service = {}) => ({
  id: service.id || service.service_id || service.name || service.service_name || '',
  name: service.name || service.service_name || service.serviceName || '',
  duration: service.duration || '',
  price: Number(service.price || 0),
});

const PaymentIcon = ({ type }) => {
  const paths = {
    upi: 'M5 7h6l-2 10h6l4-14h-6l-1 4H7l-2 10',
    card: 'M4 7h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1Zm0 4h17M7 15h5',
    bank: 'M4 10h16L12 5 4 10Zm2 2v6m4-6v6m4-6v6m4-6v6M4 20h16',
    wallet: 'M5 7h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h12M16 14h5',
  };

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={paths[type] || paths.card} />
    </svg>
  );
};

const PaymentGateway = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state || {};
  const appointmentId = state.appointment_id || '';
  const customerId = getCustomerId(state.customer_id || '');
  const createdBy = state.created_by || customerId;
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(Boolean(appointmentId));
  const [selectedMethod, setSelectedMethod] = useState('UPI');
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [confirmExitOpen, setConfirmExitOpen] = useState(false);
  const allowLeaveRef = useRef(false);
  const failingRef = useRef(false);

  useEffect(() => {
    let active = true;

    const loadAppointment = async () => {
      if (!appointmentId) {
        setLoading(false);
        return;
      }

      try {
        const response = await getAppointmentById(appointmentId);
        if (active) {
          setAppointment(response?.data || null);
        }
      } catch (error) {
        if (active) {
          toast.error(error?.response?.data?.message || 'Unable to load payment details.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadAppointment();

    return () => {
      active = false;
    };
  }, [appointmentId]);

  const services = useMemo(() => {
    const source = state.selected_services?.length ? state.selected_services : appointment?.selectedServices || appointment?.selected_services || [];
    return source.map(normalizeService).filter((service) => service.id || service.name);
  }, [appointment?.selectedServices, appointment?.selected_services, state.selected_services]);

  const totalPrice = useMemo(
    () => Number(state.total_price || appointment?.totalPrice || appointment?.total_price || services.reduce((sum, service) => sum + service.price, 0)),
    [appointment?.totalPrice, appointment?.total_price, services, state.total_price]
  );

  const bookingDate = state.booking_date || appointment?.bookingDate || appointment?.booking_date || '';
  const bookingSlot = state.booking_slot || appointment?.bookingSlot || appointment?.booking_slot || '';
  const stylistName = state.stylist?.name || appointment?.staffId || 'Selected stylist';
  const branchName = state.branch_name || 'Salon branch';

  const failPayment = useCallback(async ({ silent = false } = {}) => {
    if (!appointmentId || allowLeaveRef.current || failingRef.current || success) {
      return;
    }

    failingRef.current = true;

    try {
      await markAppointmentPaymentFailed(appointmentId, { modified_by: createdBy });
      if (!silent) {
        toast.info('Payment cancelled. Your reserved slot has been released.');
      }
    } catch (error) {
      if (!silent) {
        toast.error(error?.response?.data?.message || 'Unable to cancel payment cleanly.');
      }
    } finally {
      failingRef.current = false;
    }
  }, [appointmentId, createdBy, success]);

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (allowLeaveRef.current || success || !appointmentId) {
        return undefined;
      }

      const payload = JSON.stringify({ modified_by: createdBy });
      navigator.sendBeacon?.(`${API_BASE_URL}/appointments/${appointmentId}/payment-failed`, new Blob([payload], { type: 'application/json' }));
      event.preventDefault();
      event.returnValue = 'Leaving this page will cancel your booking and payment process.';
      return event.returnValue;
    };

    const handlePageHide = () => {
      if (!allowLeaveRef.current && !success && appointmentId) {
        const payload = JSON.stringify({ modified_by: createdBy });
        navigator.sendBeacon?.(`${API_BASE_URL}/appointments/${appointmentId}/payment-failed`, new Blob([payload], { type: 'application/json' }));
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [appointmentId, createdBy, success]);

  const requestExit = () => {
    if (success || allowLeaveRef.current) {
      navigate(-1);
      return;
    }

    setConfirmExitOpen(true);
  };

  const confirmExit = async () => {
    await failPayment();
    allowLeaveRef.current = true;
    navigate('/bookings', { replace: true });
  };

  const handlePayNow = async () => {
    if (!appointmentId) {
      toast.error('No appointment found for payment.');
      return;
    }

    try {
      setProcessing(true);
      await new Promise((resolve) => window.setTimeout(resolve, 2400));
      const response = await updateAppointment(appointmentId, {
        booking_status: 'CONFIRMED',
        payment_status: 'SUCCESS',
        payment_method: selectedMethod,
        modified_by: createdBy,
      });

      allowLeaveRef.current = true;
      setAppointment(response?.data || appointment);
      setSuccess(true);
      toast.success('Payment successful. Your booking is confirmed.');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Payment could not be completed.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="customer-portal site-shell site-shell--payment app-shell min-h-screen w-full overflow-x-hidden">
      <TopNavbar active="Home" onNavigate={(target) => navigate(target)} />

      <main className="page-main page-main--payment app-container">
        <section className="mobile-header mobile-header--mobile-only">
          <MobileHeader title="Payment" showBack showMenu centerTitle onBack={requestExit} />
        </section>

        <section className="payment-hero reveal-up">
          <div>
            <div className="page-kicker">Secure checkout</div>
            <h1>{success ? 'Your salon visit is confirmed.' : 'Complete payment to confirm your slot.'}</h1>
            <p>{success ? 'We have locked in your stylist, services, and appointment time.' : 'Your selected slot is reserved while this payment is pending.'}</p>
          </div>
          <div className={`payment-status-orb ${success ? 'payment-status-orb--success' : ''}`}>
            <span>{success ? 'Paid' : 'Pending'}</span>
            <strong>{success ? 'SUCCESS' : 'PAYMENT_PENDING'}</strong>
          </div>
        </section>

        {loading ? <div className="premium-skeleton premium-skeleton--checkout" /> : null}

        {!loading ? (
          <section className="payment-layout">
            <article className="payment-panel payment-panel--methods reveal-up reveal-delay-1">
              <div className="section-header-row section-header-row--wide">
                <div>
                  <div className="section-heading">Payment method</div>
                  <div className="section-subheading">Choose a dummy method to simulate checkout.</div>
                </div>
              </div>

              <div className="payment-method-grid">
                {paymentOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={`payment-method-card ${selectedMethod === option.id ? 'selected' : ''}`}
                    onClick={() => setSelectedMethod(option.id)}
                    disabled={processing || success}
                  >
                    <span className="payment-method-card__icon"><PaymentIcon type={option.icon} /></span>
                    <span>
                      <strong>{option.title}</strong>
                      <small>{option.meta}</small>
                    </span>
                    <span className="payment-method-card__radio" />
                  </button>
                ))}
              </div>

              <div className="dummy-pay-card">
                <div>
                  <span>Salon Book Pay</span>
                  <strong>₹{totalPrice.toLocaleString()}</strong>
                </div>
                <p>This gateway is a dummy simulation for development. No real money is charged.</p>
              </div>

              {!success ? (
                <button type="button" className="continue-button continue-button--wide payment-pay-button" onClick={handlePayNow} disabled={processing}>
                  {processing ? <span className="button-loader" /> : null}
                  {processing ? 'Processing payment...' : `Pay ₹${totalPrice.toLocaleString()} Now`}
                </button>
              ) : (
                <button type="button" className="continue-button continue-button--wide payment-pay-button" onClick={() => navigate('/bookings', { replace: true })}>
                  View booking
                </button>
              )}

              {!success ? (
                <button type="button" className="payment-cancel-button" onClick={() => setConfirmExitOpen(true)} disabled={processing}>
                  Cancel payment
                </button>
              ) : null}
            </article>

            <aside className="payment-panel payment-panel--summary reveal-up reveal-delay-2">
              <div className="payment-summary-top">
                <span>Booking summary</span>
                <strong>₹{totalPrice.toLocaleString()}</strong>
              </div>

              <div className="payment-summary-list">
                <div><span>Stylist</span><strong>{stylistName}</strong></div>
                <div><span>Salon</span><strong>{branchName}</strong></div>
                <div><span>Date</span><strong>{bookingDate || 'Pending'}</strong></div>
                <div><span>Time</span><strong>{bookingSlot || 'Pending'}</strong></div>
                <div><span>Duration</span><strong>{state.total_duration || appointment?.totalDuration || appointment?.total_duration || 'Not set'}</strong></div>
              </div>

              <div className="payment-services">
                <span>Services</span>
                {services.length ? services.map((service) => (
                  <div key={service.id || service.name} className="payment-service-row">
                    <strong>{service.name}</strong>
                    <em>₹{service.price.toLocaleString()}</em>
                  </div>
                )) : <p>Services pending</p>}
              </div>
            </aside>
          </section>
        ) : null}
      </main>

      <BottomNavbar active="Home" />

      {confirmExitOpen ? (
        <div className="booking-complete-modal" role="dialog" aria-modal="true" aria-labelledby="payment-exit-title">
          <div className="booking-complete-modal__card payment-exit-card">
            <div className="booking-complete-modal__icon">!</div>
            <h2 id="payment-exit-title">Leaving this page will cancel your booking and payment process.</h2>
            <p>Your reserved slot will be released and the payment status will be marked as failed.</p>
            <div className="payment-exit-actions">
              <button type="button" className="payment-cancel-button" onClick={() => setConfirmExitOpen(false)}>Stay on payment</button>
              <button type="button" className="continue-button" onClick={confirmExit}>Cancel booking</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default PaymentGateway;
