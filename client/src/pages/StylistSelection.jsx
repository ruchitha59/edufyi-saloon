import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import BottomNavbar from '../components/BottomNavbar';
import BranchInfo from '../components/BranchInfo';
import BrandCard from '../components/BrandCard';
import MobileHeader from '../components/MobileHeader';
import ServiceSelection from '../components/ServiceSelection';
import TopNavbar from '../components/TopNavbar';
import { getSalons } from '../services/salonService';
import { getStylistDetails } from '../services/stylistService';
import { updateAppointmentStylist } from '../services/stylistService';
import { getCustomerId } from '../utils/customerIdentity';

const brands = [
  { name: "L'OREAL PARIS", logo: 'L' },
  { name: 'MY', logo: 'MY' },
  { name: 'HIVEA', logo: 'H' },
  { name: "Stylist's Edge", logo: 'SE' },
];

const toArray = (response) => (Array.isArray(response?.data?.data) ? response.data.data : Array.isArray(response?.data) ? response.data : []);

const StylistSelection = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const selectedCategory = location.state?.category || '';
  const selectedSubcategory = location.state?.subcategory || '';
  const appointmentId = location.state?.appointment_id || '';
  const customerId = getCustomerId(location.state?.customer_id || '');
  const createdBy = location.state?.created_by || customerId;

  const [activeStylistId, setActiveStylistId] = useState(location.state?.stylist_id || location.state?.stylist?._id || location.state?.stylist?.id || '');
  const [selectedServiceIds, setSelectedServiceIds] = useState(
    () => location.state?.selected_services?.map((service) => service.id || service.name).filter(Boolean) || []
  );
  const [bookingLoading, setBookingLoading] = useState(false);
  const [activeStylist, setActiveStylist] = useState(location.state?.stylist || null);
  const [activeSalon, setActiveSalon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const resolvedStylist = useMemo(() => location.state?.stylist || activeStylist, [activeStylist, location.state?.stylist]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setLoading(true);
        setErrorMessage('');

        const [salonResp, stylistResp] = await Promise.all([getSalons(), activeStylistId ? getStylistDetails(activeStylistId) : Promise.resolve(null)]);

        if (!active) {
          return;
        }

        const salons = toArray(salonResp);
        setActiveSalon(salons[0] || null);

        if (stylistResp?.data) {
          setActiveStylist(stylistResp.data);
        }

        const providedServiceIds = location.state?.selected_services?.map((service) => service.id || service.name).filter(Boolean) || [];
        if (providedServiceIds.length) {
          setSelectedServiceIds(providedServiceIds);
          return;
        }

        const stylist = stylistResp?.data || location.state?.stylist || null;
        if (stylist?.services?.length) {
          setSelectedServiceIds([stylist.services[0].id || stylist.services[0].name]);
        }
      } catch (error) {
        if (active) {
          const message = error?.response?.data?.message || 'Failed to load stylist details.';
          setErrorMessage(message);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [activeStylistId, location.state?.selected_services, location.state?.stylist]);

  const branchDetails = {
    name: activeSalon?.name || activeStylist?.branch_name || 'Salon',
    area: activeStylist?.area || activeSalon?.area_id || activeSalon?.address || '—',
    working_hours: activeSalon?.workingHours?.start && activeSalon?.workingHours?.end ? `${activeSalon.workingHours.start} - ${activeSalon.workingHours.end}` : '—',
    city: activeStylist?.city || activeSalon?.city_id || '—',
    rating: Number(activeStylist?.rating || activeSalon?.rating || 0),
  };

  const handleContinueBooking = async () => {
    if (!navigator.onLine) {
      toast.error('Mobile not connected to internet');
      return;
    }

    if (!appointmentId) {
      toast.error('No appointment was created on the previous screen.');
      return;
    }

    if (!activeStylist) {
      toast.error('No stylist was selected on the previous screen.');
      return;
    }

    if (!selectedServiceIds.length) {
      toast.error('Select a service to continue booking.');
      return;
    }

    const selectedServices = activeStylist.services?.filter((service) => selectedServiceIds.includes(service.id || service.name)) || [];
    const stylistId = activeStylist._id || activeStylist.id || activeStylist.stylist_id || '';

    try {
      setBookingLoading(true);
      await updateAppointmentStylist(appointmentId, {
        stylist_id: stylistId,
        branch_id: activeStylist.branch_id || location.state?.branch_id || '',
        city_id: activeStylist.city_id || location.state?.city_id || '',
        area_id: activeStylist.area_id || location.state?.area_id || '',
        state_id: activeStylist.state_id || location.state?.state_id || '',
        salon_id: activeSalon?._id || location.state?.salon_id || '',
        modified_by: createdBy,
        selected_service: selectedServices[0]?.name || '',
        selected_services: selectedServices,
      });

      navigate('/booking', {
        state: {
          appointment_id: appointmentId,
          customer_id: customerId,
          stylist_id: stylistId,
          branch_id: activeStylist.branch_id || location.state?.branch_id || '',
          city_id: activeStylist.city_id || location.state?.city_id || '',
          area_id: activeStylist.area_id || location.state?.area_id || '',
          state_id: activeStylist.state_id || location.state?.state_id || '',
          created_by: createdBy,
          category: selectedCategory,
          subcategory: activeStylist.subcategory || selectedSubcategory,
          selected_services: selectedServices,
        },
      });
    } catch (error) {
      const message = error?.response?.data?.message || 'Unable to update the appointment right now.';
      toast.error(message);
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div className="customer-portal site-shell site-shell--selection app-shell min-h-screen w-full overflow-x-hidden">
      <TopNavbar active="Home" onNavigate={(target) => navigate(target)} />

      <main className="page-main page-main--selection app-container">
        <section className="mobile-header mobile-header--mobile-only">
          <MobileHeader title="Services" showBack showMenu centerTitle onBack={() => navigate(-1)} />
        </section>

        <section className="page-hero page-hero--selection reveal-up">
          <div className="page-hero__content">
            <div className="page-kicker">Service selection</div>
            <h1>Build your appointment with {activeStylist?.name || 'your stylist'}.</h1>
            <p>Select one or more services and review the running summary before choosing a time.</p>

            <div className="selection-chip-row">
              <span className="selection-chip selection-chip--static">{selectedCategory}</span>
              <span className="selection-chip selection-chip--static">{activeStylist?.subcategory || selectedSubcategory}</span>
            </div>
          </div>

          <div className="page-hero__panel page-hero__panel--selection">
            <BranchInfo branch={branchDetails} />
          </div>
        </section>

        {loading ? <div className="loading-state">Loading services...</div> : null}
        {errorMessage ? <div className="admin-alert">{errorMessage}</div> : null}

        <section className="selection-layout">
          <div className="selection-layout__main">
            <section className="page-section selection-section reveal-up reveal-delay-1">
              <div className="section-header-row section-header-row--wide">
                <div>
                  <div className="section-kicker">Our Services</div>
                  <div className="section-heading">Services</div>
                  <div className="section-subheading">Clear duration and pricing for every selection.</div>
                </div>
              </div>

              <ServiceSelection
                services={resolvedStylist?.services || []}
                selectedServiceIds={selectedServiceIds}
                onToggleService={(service) => {
                  const serviceKey = service.id || service.name;
                  setSelectedServiceIds((currentServiceIds) =>
                    currentServiceIds.includes(serviceKey)
                      ? currentServiceIds.filter((currentServiceId) => currentServiceId !== serviceKey)
                      : [...currentServiceIds, serviceKey]
                  );
                }}
              />
            </section>

            <section className="page-section selection-section reveal-up reveal-delay-2">
              <div className="section-header-row section-header-row--wide">
                <div>
                  <div className="section-kicker">About the Studio</div>
                  <div className="section-heading">Trusted products</div>
                  <div className="section-subheading">Premium care partners used by the salon.</div>
                </div>
              </div>

              <div className="brand-grid">
                {brands.map((brand) => (
                  <BrandCard key={brand.name} brand={brand} />
                ))}
              </div>
            </section>

            <section className="page-section selection-section reveal-up reveal-delay-3">
              <div className="section-header-row section-header-row--wide">
                <div>
                  <div className="section-kicker">Your Appointment</div>
                  <div className="section-heading">Booking summary</div>
                  <div className="section-subheading">Your stylist was selected on the previous screen</div>
                </div>
              </div>

              <div className="selection-summary-card selection-summary-card--full">
                <div className="selection-summary-card__title">Current stylist</div>
                <div className="selection-summary-card__value">{activeStylist?.name || 'Select a stylist first'}</div>
                <div className="selection-summary-card__meta">{activeStylist?.specialization || 'Stylist details will appear here.'}</div>
              </div>
            </section>
          </div>

          <aside className="selection-layout__sidebar desktop-only">
            <div className="selection-summary-card">
              <div className="selection-summary-card__title">Current selection</div>
              <div className="selection-summary-card__value">{activeStylist?.name || 'Select a stylist'}</div>
              <div className="selection-summary-card__meta">{activeStylist?.specialization || 'Stylist details will appear here.'}</div>

              <div className="selection-summary-card__services">
                <span>Chosen service</span>
                <strong>
                  {selectedServiceIds.length
                    ? activeStylist?.services
                        ?.filter((service) => selectedServiceIds.includes(service.id || service.name))
                        .map((service) => service.name)
                        .join(', ')
                    : 'None selected'}
                </strong>
              </div>

                <div className="selection-summary-card__services selection-summary-card__services--compact">
                  <span>Total selected</span>
                  <strong>{selectedServiceIds.length} services</strong>
                </div>

              <button type="button" className="continue-button continue-button--wide" onClick={handleContinueBooking} disabled={bookingLoading}>
                {bookingLoading ? 'Updating...' : 'Continue Booking'}
              </button>
            </div>
          </aside>
        </section>
      </main>

      <BottomNavbar active="Home" onNavigate={(item) => item === 'Home' && navigate('/')} />
    </div>
  );
};

export default StylistSelection;
