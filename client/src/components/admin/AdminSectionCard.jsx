const AdminSectionCard = ({ title, description, action, children }) => {
  return (
    <section className="admin-section-card">
      <div className="admin-section-card__header">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        {action ? <div className="admin-section-card__action">{action}</div> : null}
      </div>
      {children}
    </section>
  );
};

export default AdminSectionCard;