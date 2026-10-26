const ContinueButton = ({ loading, disabled, onClick }) => {
  return (
    <button type="button" className="continue-button" onClick={onClick} disabled={disabled || loading}>
      {loading ? 'Saving appointment...' : 'Continue'}
    </button>
  );
};

export default ContinueButton;
