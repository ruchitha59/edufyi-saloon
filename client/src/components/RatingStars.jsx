const RatingStars = ({ value = 0 }) => {
  const filledCount = Math.max(0, Math.min(5, Math.round(value)));

  return (
    <div className="rating-stars" aria-label={`Rating ${value} out of 5`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <span key={`star-${index}`} className={index < filledCount ? 'rating-stars__star rating-stars__star--filled' : 'rating-stars__star'}>
          ★
        </span>
      ))}
    </div>
  );
};

export default RatingStars;