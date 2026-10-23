import RatingStars from './RatingStars';

const BranchInfo = ({ branch }) => {
  const ratingValue = Number(branch?.rating || 0);

  return (
    <article className="branch-info-card">
      <div className="branch-info-card__title-row">
        <div>
          <div className="branch-info-card__eyebrow">Branch Information</div>
          <h2>{branch?.name || 'Salon'}</h2>
        </div>
        <div className="branch-info-card__city">{branch?.city || '—'}</div>
      </div>

      <div className="branch-info-card__grid">
        <div>
          <span>Area</span>
          <strong>{branch?.area || '—'}</strong>
        </div>
        <div>
          <span>Working hours</span>
          <strong>{branch?.working_hours || '—'}</strong>
        </div>
        <div>
          <span>Ratings</span>
          <strong>{ratingValue ? ratingValue.toFixed(1) : '—'}</strong>
          {ratingValue ? <RatingStars value={ratingValue} /> : null}
        </div>
        <div>
          <span>City</span>
          <strong>{branch?.city || '—'}</strong>
        </div>
      </div>
    </article>
  );
};

export default BranchInfo;