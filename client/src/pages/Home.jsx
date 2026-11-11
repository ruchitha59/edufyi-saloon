import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import BottomNavbar from '../components/BottomNavbar';
import CategoryCard from '../components/CategoryCard';
import MobileHeader from '../components/MobileHeader';
import TopNavbar from '../components/TopNavbar';
import { SALON_CATEGORIES } from '../config/appConstants';
import { getSalons } from '../services/salonService';
import { getStylists } from '../services/stylistService';

const toArray = (response) => (Array.isArray(response?.data?.data) ? response.data.data : Array.isArray(response?.data) ? response.data : []);

const CATEGORY_META = {
  Men: {
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=640&q=80',
    description: 'Sharp fades, beard care, grooming rituals',
  },
  Women: {
    image: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=640&q=80',
    description: 'Hair styling, skin care, color and finish',
  },
  Children: {
    image: 'https://images.unsplash.com/photo-1503919545889-aef636e10ad4?auto=format&fit=crop&w=640&q=80',
    description: 'Gentle cuts and quick family appointments',
  },
};

const POPULAR_SERVICES = [
  { name: 'Signature cut', duration: '45 min', price: 900 },
  { name: 'Gloss and tone', duration: '75 min', price: 2200 },
  { name: 'Ritual shave', duration: '30 min', price: 650 },
];

const TESTIMONIALS = [
  {
    result: 'Walked in between meetings and left with the best cut I have had in years.',
    name: 'Aarav Mehta',
    role: 'Founder · Studio North',
  },
  {
    result: 'The stylist match felt personal, not random. Booking was calm, fast, and beautifully clear.',
    name: 'Nisha Rao',
    role: 'Design Lead · Finora',
  },
];

const Home = () => {
  const [selectedCategory, setSelectedCategory] = useState(SALON_CATEGORIES[0]);
  const [salons, setSalons] = useState([]);
  const [stylists, setStylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setLoading(true);
        setErrorMessage('');

        const [salonResp, stylistResp] = await Promise.all([getSalons(), getStylists()]);

        if (!active) {
          return;
        }

        const nextSalons = toArray(salonResp);
        const nextStylists = toArray(stylistResp);

        setSalons(nextSalons);
        setStylists(nextStylists);

        setSelectedCategory((current) => current || SALON_CATEGORIES[0]);
      } catch (error) {
        if (active) {
          const message = error?.response?.data?.message || 'Failed to load salon data.';
          setErrorMessage(message);
          toast.error(message);
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
  }, []);

  const activeSalon = salons[0] || null;

  const categories = useMemo(
    () => SALON_CATEGORIES.map((name) => ({ name, image: CATEGORY_META[name]?.image || activeSalon?.images?.[0] || '', description: CATEGORY_META[name]?.description || '' })),
    [activeSalon?.images]
  );

  const featuredStylists = useMemo(() => {
    if (!selectedCategory) {
      return stylists;
    }

    return stylists.filter((stylist) => {
      const categories = Array.isArray(stylist.category) ? stylist.category : stylist.category ? [stylist.category] : [stylist.main_category].filter(Boolean);
      return categories.some((category) => String(category).toLowerCase() === String(selectedCategory).toLowerCase());
    });
  }, [selectedCategory, stylists]);

  const handleCategoryClick = (category) => {
    setSelectedCategory(category.name);
    navigate('/stylists', {
      state: {
        category: category.name,
        salon_id: activeSalon?._id || '',
      },
    });
  };

  const handleSelectStylist = () => {
    const category = selectedCategory || categories[0]?.name || '';

    if (!category) {
      toast.error('No categories available yet.');
      return;
    }

    navigate('/stylists', {
      state: {
        category,
        salon_id: activeSalon?._id || '',
      },
    });
  };

  return (
    <div className="customer-portal site-shell site-shell--home app-shell min-h-screen w-full overflow-x-hidden">
      <TopNavbar active="Home" onNavigate={(target) => navigate(target)} />

      <main className="page-main page-main--home app-container">
        <section className="mobile-header mobile-header--mobile-only">
          <MobileHeader title="Home" showMenu centerTitle />
        </section>

        <section className="page-hero page-hero--full customer-editorial-hero reveal-up">
          <div className="page-hero__content">
            <div className="page-kicker">Premium salon appointments</div>
            <h1 className="hero-headline hero-headline--stagger">
              <span className="hero-headline__line">
                <span className="hero-word" style={{ '--word-index': 0 }}>The</span>
                <span className="hero-word" style={{ '--word-index': 1 }}>Art</span>
                <span className="hero-word" style={{ '--word-index': 2 }}>of</span>
              </span>
              <span className="hero-headline__line hero-headline__line--italic">
                <span className="hero-word" style={{ '--word-index': 3 }}>The</span>
                <span className="hero-word" style={{ '--word-index': 4 }}>Cut</span>
              </span>
            </h1>
            <p>
              Discover trusted stylists, compare services, and reserve a time that fits your day through a calm salon booking experience.
            </p>
            <div className="hero-action-row">
              <button type="button" className="luxury-button" onClick={handleSelectStylist}>Book appointment</button>
              <button type="button" className="luxury-button luxury-button--ghost" onClick={() => navigate('/bookings')}>View bookings</button>
            </div>
            <div className="customer-hero__stats">
              <span><strong>{stylists.length || '24+'}</strong> stylists</span>
              <span><strong>4.8</strong> average rating</span>
              <span><strong>Instant</strong> booking</span>
            </div>
          </div>

          <div className="page-hero__panel live-booking-preview" aria-label="Live booking preview">
            <div className="live-booking-preview__top">
              <span>Upcoming Appointment</span>
              <strong>Today, 4:30 PM</strong>
            </div>
            <div className="live-booking-preview__focus">
              <span>Available Stylists</span>
              <strong>{featuredStylists.length || stylists.length || 6}</strong>
              <em>{selectedCategory || 'Women'} specialists ready</em>
            </div>
            <div className="live-booking-preview__services">
              {POPULAR_SERVICES.map((service) => (
                <div key={service.name}>
                  <span>{service.name}</span>
                  <strong>{service.duration}</strong>
                  <em>₹{service.price.toLocaleString()}</em>
                </div>
              ))}
            </div>
            <div className="live-booking-preview__slots">
              {['10:30', '12:15', '14:00', '16:30'].map((slot, index) => (
                <span key={slot} className={index === 3 ? 'selected' : ''}>{slot}</span>
              ))}
            </div>
          </div>
        </section>

        <section className="page-section page-section--categories reveal-up reveal-delay-1">
          <div className="section-header-row section-header-row--wide">
            <div>
              <div className="section-kicker">Our Services</div>
              <div className="section-heading">Choose your experience</div>
              <div className="section-subheading">Start with a category and we will tailor the stylist list.</div>
            </div>
          </div>

          <div className="category-grid-responsive">
            {loading ? <div className="loading-state">Loading categories...</div> : null}
            {!loading && categories.length ? categories.map((category) => (
              <CategoryCard
                key={category.name}
                category={category}
                selected={selectedCategory === category.name}
                onClick={() => handleCategoryClick(category)}
              />
            )) : null}
          </div>

          {!loading && !categories.length ? <div className="empty-state">No services configured yet.</div> : null}
        </section>

        <section className="page-section page-section--services-home reveal-up reveal-delay-2">
          <div className="section-header-row section-header-row--wide">
            <div>
              <div className="section-kicker">Signature Menu</div>
              <div className="section-heading">Most requested</div>
              <div className="section-subheading">A quick look at popular services before you choose a stylist.</div>
            </div>
          </div>
          <div className="home-bento-grid">
            <article>
              <span>Hair architecture</span>
              <strong>Precision cut</strong>
              <em>45 min · ₹900</em>
            </article>
            <article className="home-bento-grid__dark">
              <span>Color studio</span>
              <strong>Gloss, tone and finish</strong>
              <em>75 min · ₹2,200</em>
            </article>
            <article>
              <span>Grooming</span>
              <strong>Beard ritual</strong>
              <em>30 min · ₹650</em>
            </article>
          </div>
        </section>

        <section className="page-section testimonials-section reveal-up reveal-delay-2">
          <div className="section-header-row section-header-row--wide">
            <div>
              <div className="section-kicker">Studio Notes</div>
              <div className="section-heading">Customer results</div>
              <div className="section-subheading">Editorial notes from people who booked without calling the salon.</div>
            </div>
          </div>
          <div className="testimonial-grid">
            {TESTIMONIALS.map((testimonial) => (
              <blockquote key={testimonial.name} className="testimonial-quote">
                <p>{testimonial.result}</p>
                <footer>
                  <strong>{testimonial.name}</strong>
                  <span>{testimonial.role}</span>
                </footer>
              </blockquote>
            ))}
          </div>
        </section>

        <section className="dark-cta-island reveal-up reveal-delay-3">
          <div>
            <span className="page-kicker">Instant booking included</span>
            <h2>Your next appointment is minutes away.</h2>
          </div>
          <button type="button" className="luxury-button luxury-button--light" onClick={handleSelectStylist}>Book appointment</button>
          <div className="dark-cta-island__signals">
            <span>No waiting.</span>
            <span>No calls.</span>
            <span>Instant booking included.</span>
          </div>
        </section>

        {errorMessage ? <div className="admin-alert">{errorMessage}</div> : null}
      </main>

      <BottomNavbar active="Home" onNavigate={(item) => item === 'Home' && navigate('/')} />
    </div>
  );
};

export default Home;
