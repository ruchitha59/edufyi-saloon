import React from 'react';

const ServiceList = ({ services = [] }) => (
  <ul className="staff-appointment__services">
    {services.map((s) => (
      <li key={s._id || s.serviceId || s.id}>{s.name || s.serviceName || s.title} — {s.duration || s.length || ''}m • ${s.price || s.cost || ''}</li>
    ))}
  </ul>
);

const StaffAppointmentCard = ({ appointment, onUpdateStatus }) => {
  const customer = appointment.customerId || appointment.customer || {};
  const services = appointment.selectedServices?.map((ss) => ss.serviceId || ss) || appointment.services || [];

  const handleChange = (newStatus) => {
    if (onUpdateStatus) onUpdateStatus(appointment._id || appointment.id, newStatus);
  };

  return (
    <article className="staff-appointment-card">
      <div className="staff-appointment-card__meta">
        <div>
          <div className="muted">Customer</div>
          <div className="bold">{customer.name || customer.fullName || customer.phone || 'Unknown'}</div>
          <div className="muted">{customer.mobile_number || customer.phone || customer.contact_number || ''}</div>
        </div>
        <div>
          <div className="muted">Time</div>
          <div className="bold">{new Date(appointment.bookingDate || appointment.createdAt).toLocaleString()}</div>
        </div>
        <div>
          <div className="muted">Status</div>
          <div className={`status status--${(appointment.bookingStatus || '').toLowerCase()}`}>{appointment.bookingStatus}</div>
        </div>
      </div>

      <div className="staff-appointment-card__body">
        <div className="staff-appointment-card__services">
          <div className="muted">Services</div>
          <ServiceList services={services} />
        </div>
        <div className="staff-appointment-card__actions">
          {(appointment.bookingStatus || '').toUpperCase() === 'PENDING' && (
            <button className="admin-button" onClick={() => handleChange('CONFIRMED')}>Confirm</button>
          )}

          {(appointment.bookingStatus || '').toUpperCase() !== 'COMPLETED' && (
            <button className="admin-button admin-button--primary" onClick={() => handleChange('COMPLETED')}>Mark Completed</button>
          )}

          {(appointment.bookingStatus || '').toUpperCase() !== 'CANCELLED' && (
            <button className="admin-button admin-button--danger" onClick={() => handleChange('CANCELLED')}>Cancel</button>
          )}
        </div>
      </div>
    </article>
  );
};

export default StaffAppointmentCard;
