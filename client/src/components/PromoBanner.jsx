const PromoBanner = () => {
  return (
    <section className="promo-banner">
      <div className="promo-copy">
        <p className="promo-copy__percent">30% Off</p>
        <p className="promo-copy__subtext">on 1st service</p>
        <button type="button" className="promo-button">SEE MORE</button>
      </div>

      <div className="promo-image-wrap">
        <div className="promo-shape promo-shape--blue" />
        <img
          src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=420&q=80"
          alt="Stylist"
          className="promo-image"
        />
      </div>

      <div className="promo-dots" aria-hidden="true">
        <span className="active" />
        <span />
        <span />
        <span />
      </div>
    </section>
  );
};

export default PromoBanner;