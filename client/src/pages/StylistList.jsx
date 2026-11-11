import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import BottomNavbar from '../components/BottomNavbar';
import BranchInfo from '../components/BranchInfo';
import MobileHeader from '../components/MobileHeader';
import StylistCard from '../components/StylistCard';
import TopNavbar from '../components/TopNavbar';
import { createAppointment } from '../services/appointmentService';
import { getSalons } from '../services/salonService';
import { getCustomerId } from '../utils/customerIdentity';
import { getStylists } from '../services/stylistService';

const toArray = (response) => (Array.isArray(response?.data?.data) ? response.data.data : Array.isArray(response?.data) ? response.data : []);

const StylistList = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const selectedCategory = location.state?.category || '';
  const selectedSubcategory = location.state?.subcategory || '';
  const customerId = getCustomerId(location.state?.customer_id || '');
  const createdBy = location.state?.created_by || customerId;
  const [selectedStylistId, setSelectedStylistId] = useState(location.state?.stylist_id || '');
  const [loadingStylistId, setLoadingStylistId] = useState('');
  const [offlineError, setOfflineError] = useState(false);
  const [stylists, setStylists] = useState([]);
  const [loadingStylists, setLoadingStylists] = useState(true);
  const [salons, setSalons] = useState([]);
  const [loadingSalon, setLoadingSalon] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const getStylistKey = (stylist) => stylist?._id || stylist?.id || '';

  const availableStylists = useMemo(() => {
    const matchedStylists = stylists.filter((stylist) => (stylist.status || '').toUpperCase() === 'AA');
    return matchedStylists.filter(
      (stylist) => {
        if (!selectedCategory) {
          return true;
        }

        const categories = Array.isArray(stylist.category) ? stylist.category : stylist.category ? [stylist.category] : [stylist.main_category].filter(Boolean);
        return categories.some((category) => String(category).toLowerCase() === String(selectedCategory || '').toLowerCase());
      }
    );
  }, [stylists, selectedCategory]);

  useEffect(() => {
    let active = true;

    const loadStylists = async () => {
      try {
        setLoadingStylists(true);
        setLoadingSalon(true);
        setErrorMessage('');

        const [stylistResp, salonResp] = await Promise.all([
          getStylists({ category: selectedCategory, subcategory: selectedSubcategory }),
          getSalons(),
        ]);

        if (!active) {
          return;
        }

        setStylists(toArray(stylistResp));
        setSalons(toArray(salonResp));
      } catch (error) {
        if (active) {
          const message = error?.response?.data?.message || 'Failed to load stylists.';
          setErrorMessage(message);
          setStylists([]);
          setSalons([]);
        }
      } finally {
        if (active) {
          setLoadingStylists(false);
          setLoadingSalon(false);
        }
      }
    };

    loadStylists();
    return () => {
      active = false;
    };
  }, [selectedCategory, selectedSubcategory]);

  useEffect(() => {
    if (!availableStylists.length) {
      return;
    }

    const hasSelectedStylist = availableStylists.some((stylist) => getStylistKey(stylist) === selectedStylistId);

    if (!hasSelectedStylist) {
      setSelectedStylistId(getStylistKey(availableStylists[0]));
    }
  }, [availableStylists, selectedStylistId]);

  const handleSelectStylist = async (stylist) => {
    if (!navigator.onLine) {
      setOfflineError(true);
      toast.error('Mobile not connected to internet');
      return;
    }

    try {
      const stylistKey = getStylistKey(stylist);
      setLoadingStylistId(stylistKey);
      setOfflineError(false);
      setSelectedStylistId(stylistKey);

      const salon = salons[0] || null;

      const appointment = await createAppointment({
        customer_id: customerId,
        main_category: selectedCategory,
        sub_category: stylist.subcategory || '',
        stylist_id: stylistKey,
        salon_id: salon?._id || location.state?.salon_id || '',
        created_by: createdBy,
        modified_by: createdBy,
        branch_id: stylist.branch_id || salon?._id || location.state?.branch_id || '',
        city_id: stylist.city_id || salon?.city_id || location.state?.city_id || '',
        area_id: stylist.area_id || salon?.area_id || location.state?.area_id || '',
        state_id: stylist.state_id || salon?.state_id || location.state?.state_id || '',
      });

      navigate('/services', {
        state: {
          appointment_id: appointment?.data?._id,
          customer_id: customerId,
          stylist_id: stylistKey,
          salon_id: salon?._id || location.state?.salon_id || '',
          branch_id: stylist.branch_id || salon?._id || location.state?.branch_id || '',
          city_id: stylist.city_id || salon?.city_id || location.state?.city_id || '',
          area_id: stylist.area_id || salon?.area_id || location.state?.area_id || '',
          state_id: stylist.state_id || salon?.state_id || location.state?.state_id || '',
          created_by: createdBy,
          category: selectedCategory,
          subcategory: stylist.subcategory || selectedSubcategory || '',
          stylist,
        },
      });
    } catch (error) {
      const message = error?.response?.data?.message || error?.message || 'Unable to select this stylist right now.';
      const statusCode = error?.response?.status || 'unknown';
      console.error('Stylist selection error:', {
        status: statusCode,
        message,
        fullError: error?.response?.data || error,
      });
      toast.error(`${message} (${statusCode})`);
    } finally {
      setLoadingStylistId('');
    }
  };

  const activeStylist = availableStylists.find((stylist) => getStylistKey(stylist) === selectedStylistId) || availableStylists[0] || null;
  const activeSalon = salons[0] || null;
  const branchDetails = {
    name: activeSalon?.name || 'Salon',
    area: activeSalon?.area_id || activeSalon?.address || '—',
    working_hours: activeSalon?.workingHours?.start && activeSalon?.workingHours?.end ? `${activeSalon.workingHours.start} - ${activeSalon.workingHours.end}` : '—',
    rating: Number(activeSalon?.rating || 0),
    city: activeSalon?.city_id || '—',
  };

  return (
    <div className="customer-portal site-shell site-shell--subcategories app-shell min-h-screen w-full overflow-x-hidden">
      <TopNavbar active="Categories" onNavigate={(target) => navigate(target)} />

      <main className="page-main page-main--subcategory app-container">
        <section className="mobile-header mobile-header--mobile-only">
          <MobileHeader title="Stylists" showBack showMenu centerTitle onBack={() => navigate(-1)} />
        </section>

        <section className="page-hero page-hero--subcategory reveal-up">
          <div className="page-hero__content">
            <div className="page-kicker">Curated professionals</div>
            <h1>Choose your stylist{selectedCategory ? ` for ${selectedCategory}` : ''}.</h1>
            <p>Compare specialists, availability, and salon details before moving into services.</p>
            <div className="selection-chip-row">
              {selectedCategory ? <span className="selection-chip selection-chip--static">{selectedCategory}</span> : null}
            </div>
          </div>

          <div className="page-hero__panel page-hero__panel--selection">
            <BranchInfo branch={branchDetails} />
          </div>
        </section>

        {offlineError ? (
          <div className="connection-banner connection-banner--inline">
            <div>
              <strong>Mobile not connected to internet</strong>
              <span>Reconnect before selecting a stylist to continue booking.</span>
            </div>
            <button type="button" className="connection-banner__retry" onClick={() => setOfflineError(false)}>
              Retry
            </button>
          </div>
        ) : null}

        <section className="page-section page-section--stylists reveal-up reveal-delay-1">
          <div className="section-header-row section-header-row--wide">
            <div>
              <div className="section-heading section-heading--tight">Available stylists</div>
              <div className="section-subheading">Every card includes experience, specialties, services, and status.</div>
            </div>
            <button type="button" className="text-link" onClick={() => navigate('/')}>Change category</button>
          </div>

          {loadingStylists || loadingSalon ? <div className="loading-state">Loading stylists...</div> : null}

          {!loadingStylists && !loadingSalon && availableStylists.length ? (
            <div className="selection-stylists-grid">
              {availableStylists.map((stylist) => (
                <StylistCard
                  key={getStylistKey(stylist)}
                  stylist={stylist}
                  selected={selectedStylistId === getStylistKey(stylist)}
                  loading={loadingStylistId === getStylistKey(stylist)}
                  onSelect={handleSelectStylist}
                />
              ))}
            </div>
          ) : null}

          {!loadingStylists && !loadingSalon && !availableStylists.length ? (
            <div className="premium-empty-state">
              <div className="premium-empty-state__icon">✦</div>
              <strong>No stylists available</strong>
              <span>Try another category or check back after the salon updates its staff schedule.</span>
            </div>
          ) : null}

          {errorMessage ? <div className="admin-alert">{errorMessage}</div> : null}
        </section>
      </main>

      <BottomNavbar active="Home" onNavigate={(item) => item === 'Home' && navigate('/')} />
    </div>
  );
};

export default StylistList;
