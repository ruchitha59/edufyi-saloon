const AdminStatCard = ({ label, value, detail, tone = 'gold' }) => {
  return (
    <article className={`admin-stat-card admin-stat-card--${tone}`}>
      <div className="admin-stat-card__label">{label}</div>
      <div className="admin-stat-card__value">{value}</div>
      <div className="admin-stat-card__detail">{detail}</div>
    </article>
  );
};

export default AdminStatCard;