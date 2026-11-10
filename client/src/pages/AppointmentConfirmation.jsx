import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import BottomNavbar from '../components/BottomNavbar';
import ChatModal from '../components/ChatModal';
import ConfirmBookingButton from '../components/ConfirmBookingButton';
import ContactActions from '../components/ContactActions';
import PremiumBooking from '../components/PremiumBooking';
import MobileHeader from '../components/MobileHeader';
import PriceSummary from '../components/PriceSummary';
import ServiceList from '../components/ServiceList';
import StylistInfoCard from '../components/StylistInfoCard';
import TopNavbar from '../components/TopNavbar';
import { getAppointmentById, updateAppointment } from '../services/appointmentService';
import { getStylistDetails } from '../services/stylistService';
import { getCustomerId } from '../utils/customerIdentity';

const todayInputValue = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const splitDateTime = (value = '') => {
  if (!value) {
    return { date: '', time: '' };
  }

  const dateValue = new Date(value);

  if (Number.isNaN(dateValue.getTime())) {
    return { date: '', time: '' };
  }

  const year = dateValue.getFullYear();
  const month = String(dateValue.getMonth() + 1).padStart(2, '0');
  const day = String(dateValue.getDate()).padStart(2, '0');
  const hours = String(dateValue.getHours()).padStart(2, '0');
  const minutes = String(dateValue.getMinutes()).padStart(2, '0');

  return {
    date: `${year}-${month}-${day}`,
    time: `${hours}:${minutes}`,
  };
};

const parseDurationToMinutes = (duration = '') => {
  const value = String(duration).trim().toLowerCase();

  if (!value) {
    return 0;
  }

  const hourMatch = value.match(/(\d+(?:\.\d+)?)\s*(h|hr|hrs|hour|hours)/);
  if (hourMatch) {
    return Math.round(Number.parseFloat(hourMatch[1]) * 60);
  }

  const minuteMatch = value.match(/(\d+)\s*(m|min|mins|minute|minutes)/);
  if (minuteMatch) {
    return Number.parseInt(minuteMatch[1], 10);
  }

  return 0;
};

const formatMinutes = (minutes = 0) => {
  const safeMinutes = Math.max(0, Math.round(minutes));
  const hours = Math.floor(safeMinutes / 60);
  const remainingMinutes = safeMinutes % 60;

  if (!hours && !remainingMinutes) {
    return '0 min';
  }

  if (!hours) {
    return `${remainingMinutes} min`;
  }

  if (!remainingMinutes) {
    return `${hours} hour${hours === 1 ? '' : 's'}`;
  }

  return `${hours} hour${hours === 1 ? '' : 's'} ${remainingMinutes} min`;
};

const buildDateTimeFromParts = (dateValue = '', timeValue = '') => {
  if (!dateValue || !timeValue) {
    return null;
  }

  const [timePart, meridiemPart] = String(timeValue).trim().split(' ');
  const [hoursPart, minutesPart = '00'] = timePart.split(':');
  let hours = Number.parseInt(hoursPart, 10);
  const minutes = Number.parseInt(minutesPart, 10);
  const meridiem = String(meridiemPart || '').toUpperCase();

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null;
  }

  if (meridiem === 'PM' && hours < 12) {
    hours += 12;
  }

  if (meridiem === 'AM' && hours === 12) {
    hours = 0;
  }

  const combinedValue = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(combinedValue.getTime())) {
    return null;
  }

  combinedValue.setHours(hours, minutes, 0, 0);
  return combinedValue;
};

const normalizeService = (service) => ({
  id: service?.id || service?.service_id || service?.name || service?.service_name || '',
  name: service?.name || service?.service_name || '',
  service_name: service?.service_name || service?.name || '',
  duration: service?.duration || '',
  price: Number(service?.price || 0),
});

const AppointmentConfirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const appointmentId = location.state?.appointment_id || '';
  const customerId = getCustomerId(location.state?.customer_id || '');
  const createdBy = location.state?.created_by || customerId;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [appointment, setAppointment] = useState(null);
  const [stylist, setStylist] = useState(null);
  const [selectedServices, setSelectedServices] = useState(
    () => location.state?.selected_services?.map(normalizeService).filter((service) => service.id || service.name) || []
  );
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    let mounted = true;

    const loadBooking = async () => {
      if (!appointmentId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const appointmentResult = await getAppointmentById(appointmentId);
        const appointmentData = appointmentResult?.data || null;

        if (!mounted) {
          return;
        }

        setAppointment(appointmentData);

        const bookingServices = Array.isArray(appointmentData?.selected_services)
          ? appointmentData.selected_services.map(normalizeService).filter((service) => service.id || service.name)
          : [];

        if (bookingServices.length) {
          setSelectedServices(bookingServices);
        }

        if (appointmentData?.appointment_date_time) {
          const splitValue = splitDateTime(appointmentData.appointment_date_time);
          setAppointmentDate(splitValue.date);
          setAppointmentTime(splitValue.time);
          setSelectedSlot({
            slot_id: appointmentData?.slotId || appointmentData?.slot_id || '',
            date: splitValue.date,
            start_time: splitValue.time,
            end_time: '',
          });
        }

        // salon flow: customer address is no longer required

        const stylistId = appointmentData?.stylist_id || location.state?.stylist_id || '';
        if (stylistId) {
          const stylistResult = await getStylistDetails(stylistId);
          if (mounted) {
            setStylist(stylistResult?.data || null);
          }
        }
      } catch {
        if (mounted) {
          setStylist(location.state?.stylist || null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadBooking();

    return () => {
      mounted = false;
    };
  }, [appointmentId, location.state?.stylist]);

  const normalizedServices = useMemo(
    () => (selectedServices.length ? selectedServices : location.state?.selected_services?.map(normalizeService).filter(Boolean) || []),
    [location.state?.selected_services, selectedServices]
  );

  const totalPrice = useMemo(
    () => normalizedServices.reduce((sum, service) => sum + Number(service.price || 0), 0),
    [normalizedServices]
  );

  const totalDuration = useMemo(() => {
    const totalMinutes = normalizedServices.reduce((sum, service) => sum + parseDurationToMinutes(service.duration), 0);
    return formatMinutes(totalMinutes);
  }, [normalizedServices]);

  const minDate = todayInputValue();
  const branchName = stylist?.branch_name || appointment?.branch_id || location.state?.branch_id || 'Salon branch';
  const area = stylist?.area || location.state?.area_id || appointment?.area_id || 'Near you';
  const city = stylist?.city || location.state?.city_id || appointment?.city_id || 'Bangalore';

  const buildDateTime = () => {
    return buildDateTimeFromParts(appointmentDate, appointmentTime);
  };

  const handleCallStylist = () => {
    const phone = stylist?.phone || location.state?.phone;

    if (!phone) {
      toast.error('Stylist contact is not available yet.');
      return;
    }

    window.location.href = `tel:${phone.replace(/\s+/g, '')}`;
  };

  const handleConfirmBooking = async () => {
    if (!navigator.onLine) {
      toast.error('Mobile not connected to internet');
      return;
    }

    const dateTimeValue = buildDateTime();

    if (!dateTimeValue) {
      toast.error('Please enter the Date and Time to confirm');
      return;
    }

    if (dateTimeValue.getTime() < Date.now()) {
      toast.error('Please enter a valid Date and Time');
      return;
    }

    if (!appointmentId) {
      toast.error('No appointment was created on the previous screen.');
      return;
    }

    if (!selectedSlot?.slot_id) {
      toast.error('Please select a slot before confirming booking.');
      return;
    }

    try {
      setSaving(true);

      const payload = {
        stylist_id: stylist?.id || location.state?.stylist_id || appointment?.stylist_id || '',
        salon_id: stylist?.salonId || location.state?.salon_id || appointment?.salonId || appointment?.salon_id || '',
        slot_id: selectedSlot.slot_id || null,
        booking_date: appointmentDate,
        booking_slot: appointmentTime,
        service_ids: normalizedServices.map((s) => s.id).filter(Boolean),
        selected_services: normalizedServices,
        total_price: totalPrice,
        total_duration: totalDuration,
        modified_by: createdBy,
        booking_status: 'PENDING',
        payment_status: 'PAYMENT_PENDING',
      };

      const response = await updateAppointment(appointmentId, payload);
      setAppointment(response?.data || appointment);
      setSuccessMessage('Your slot is reserved while payment is pending.');
      toast.success('Slot reserved. Continue to payment.');
      navigate('/payment', {
        state: {
          appointment_id: appointmentId,
          customer_id: customerId,
          created_by: createdBy,
          stylist_id: payload.stylist_id,
          stylist: stylist || location.state?.stylist || null,
          selected_services: normalizedServices,
          booking_date: appointmentDate,
          booking_slot: appointmentTime,
          total_price: totalPrice,
          total_duration: totalDuration,
          slot_id: selectedSlot.slot_id,
          category: location.state?.category || appointment?.mainCategory || '',
          branch_name: branchName,
          area,
          city,
        },
      });
    } catch (error) {
      const message = error?.response?.data?.message || 'Unable to confirm the appointment right now.';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveService = (service) => {
    const key = service?.id || service?.name || service?.service_name || '';

    setSelectedServices((prev) => prev.filter((s) => {
      const sKey = s?.id || s?.name || s?.service_name || '';
      return sKey !== key;
    }));
  };

  return (
    <div className="customer-portal site-shell site-shell--booking app-shell min-h-screen w-full overflow-x-hidden">
      <TopNavbar active="Home" onNavigate={(target) => navigate(target)} />

      <main className="page-main page-main--booking app-container">
        <section className="mobile-header mobile-header--mobile-only">
          <MobileHeader title="Service Request" showBack showMenu centerTitle onBack={() => navigate(-1)} />
        </section>

        {loading ? <div className="loading-state">Loading appointment details...</div> : null}

        <section className="page-hero page-hero--booking">
          <div className="page-hero__content">
            <div className="page-kicker">Finalize appointment</div>
            <h1>Choose a time, then continue to secure payment.</h1>
            <p>Review your stylist, service breakdown, date, slot, and total before reserving the appointment.</p>
            <div className="booking-progress">
              <span className="complete">Stylist</span>
              <span className="complete">Services</span>
              <span className={selectedSlot ? 'complete' : 'active'}>Slot</span>
              <span>Payment</span>
            </div>

            {successMessage ? <div className="booking-success-banner">{successMessage}</div> : null}
          </div>

          <div className="page-hero__panel page-hero__panel--booking">
            <StylistInfoCard stylist={stylist || location.state?.stylist} branchName={branchName} area={area} city={city} />
          </div>
        </section>

        <section className="booking-layout">
          <div className="booking-layout__main">
            {/* Address removed for salon booking flow */}

            <article className="booking-timeline-card reveal-up">
              <div>
                <span>01</span>
                <strong>{stylist?.name || 'Stylist selected'}</strong>
                <em>{branchName}</em>
              </div>
              <div>
                <span>02</span>
                <strong>{normalizedServices.length} services</strong>
                <em>{totalDuration}</em>
              </div>
              <div>
                <span>03</span>
                <strong>{appointmentTime || 'Choose slot'}</strong>
                <em>{appointmentDate || 'Date pending'}</em>
              </div>
            </article>

            <article className="booking-card">
              <div className="section-header-row section-header-row--wide">
                <div>
                  <div className="section-heading">Selected services</div>
                  <div className="section-subheading">Review the chosen services, duration, and price</div>
                </div>
                <button
                  type="button"
                  className="text-link text-link--accent"
                  onClick={() =>
                    navigate('/services', {
                      state: {
                        appointment_id: appointmentId,
                        customer_id: customerId,
                        stylist_id: stylist?.id || location.state?.stylist_id || '',
                        branch_id: stylist?.branch_id || location.state?.branch_id || '',
                        city_id: stylist?.city_id || location.state?.city_id || '',
                        area_id: stylist?.area_id || location.state?.area_id || '',
                        state_id: stylist?.state_id || location.state?.state_id || '',
                        created_by: createdBy,
                        category: location.state?.category || 'Men',
                        subcategory: location.state?.subcategory || 'Hair care',
                        selected_services: normalizedServices,
                      },
                    })
                  }
                >
                  Add More Services
                </button>
              </div>

              <ServiceList services={normalizedServices} onRemove={handleRemoveService} />
            </article>

            <article className="booking-card">
              <div className="section-header-row section-header-row--wide">
                <div>
                  <div className="section-heading">Date and time</div>
                  <div className="section-subheading">Pick an available slot from the salon schedule.</div>
                </div>
              </div>

              <PremiumBooking
                stylistId={stylist?.id || location.state?.stylist_id || ''}
                selectedSlot={selectedSlot || (appointment?.booking_slot ? { start_time: appointment.booking_slot, end_time: '' } : null)}
                onSlotSelect={(slot) => {
                  setAppointmentDate(slot.date);
                  setAppointmentTime(slot.start_time);
                  setSelectedSlot(slot);
                }}
                initialDate={appointmentDate || undefined}
              />
            </article>

            <article className="booking-card">
              <div className="section-header-row section-header-row--wide">
                <div>
                  <div className="section-heading">Need help?</div>
                  <div className="section-subheading">Call or chat with the stylist if you need help</div>
                </div>
              </div>

              <ContactActions onCall={handleCallStylist} onChat={() => setChatOpen(true)} />
            </article>

            <article className="booking-summary-card booking-summary-card--mobile mobile-only">
              <div className="booking-summary-card__title">Booking summary</div>
              <PriceSummary serviceCount={normalizedServices.length} totalDuration={totalDuration} totalPrice={totalPrice} appointmentId={appointmentId} />
              <ConfirmBookingButton loading={saving} onClick={handleConfirmBooking} label="Reserve & Pay" loadingLabel="Reserving..." />
            </article>
          </div>

          <aside className="booking-layout__sidebar desktop-only">
            <div className="booking-summary-card">
              <div className="booking-summary-card__title">Booking summary</div>
              <PriceSummary serviceCount={normalizedServices.length} totalDuration={totalDuration} totalPrice={totalPrice} appointmentId={appointmentId} />
              <ConfirmBookingButton loading={saving} onClick={handleConfirmBooking} label="Reserve & Pay" loadingLabel="Reserving..." />
            </div>
          </aside>
        </section>
      </main>

      <BottomNavbar active="Home" onNavigate={(item) => item === 'Home' && navigate('/')} />

      <ChatModal
        isOpen={chatOpen}
        stylistName={stylist?.name || 'stylist'}
        onClose={() => setChatOpen(false)}
        onSend={() => {
          toast.success('Chat message sent successfully.');
          setChatOpen(false);
          setSuccessMessage('Chat message sent successfully.');
        }}
      />

    </div>
  );
};

export default AppointmentConfirmation;
