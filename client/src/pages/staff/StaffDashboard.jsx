import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import StaffTopbar from '../../components/staff/StaffTopbar';
import StaffAppointmentCard from '../../components/staff/StaffAppointmentCard';
import { getStaffAppointments, getStaffServices, updateStaffAppointmentStatus } from '../../services/staffService';

const StaffDashboard = () => {
  const [appointments, setAppointments] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [appointmentDate, setAppointmentDate] = useState(() => new Date().toISOString().slice(0, 10));

  const load = async () => {
    setLoading(true);
    try {
      const [appointmentsData, servicesData] = await Promise.all([getStaffAppointments({ date: appointmentDate }), getStaffServices()]);
      setAppointments(Array.isArray(appointmentsData) ? appointmentsData : appointmentsData?.data || []);
      setServices(Array.isArray(servicesData) ? servicesData : servicesData?.data || []);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [appointmentDate]);

  const handleUpdateStatus = async (id, status) => {
    try {
      await updateStaffAppointmentStatus(id, status);
      toast.success('Appointment updated');
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update appointment');
    }
  };

  const upcoming = useMemo(() => appointments.filter((a) => !['COMPLETED', 'CANCELLED'].includes((a.bookingStatus || '').toUpperCase())), [appointments]);
  const completed = useMemo(() => appointments.filter((a) => (a.bookingStatus || '').toUpperCase() === 'COMPLETED'), [appointments]);

  return (
    <div className="staff-dashboard page app-shell min-h-screen w-full overflow-x-hidden">
      <StaffTopbar />

      <main className="staff-dashboard__main app-container">
        <section className="admin-slot-toolbar">
          <label className="admin-field">
            <span>Selected date</span>
            <input className="admin-input" type="date" value={appointmentDate} onChange={(event) => setAppointmentDate(event.target.value)} />
          </label>
        </section>

        <section className="staff-dashboard__services">
          <div className="staff-dashboard__services-header">
            <h2>Assigned services</h2>
            <span>{services.length} live services</span>
          </div>
          <div className="staff-dashboard__services-grid">
            {services.length === 0 ? <div className="muted">No services assigned yet.</div> : null}
            {services.map((service) => (
              <article key={service._id || service.id} className="staff-service-card">
                <div className="staff-service-card__title">{service.serviceName || service.service_name || 'Service'}</div>
                <div className="staff-service-card__meta">{service.duration || '—'} · Rs {Number(service.price || 0).toLocaleString()}</div>
                <div className="staff-service-card__meta">{service.salonId?.name || service.salon_id?.name || 'Salon'}</div>
              </article>
            ))}
          </div>
        </section>

        <section className="staff-dashboard__controls">
          <div className="tabs">
            <button className={`tab ${activeTab === 'upcoming' ? 'is-active' : ''}`} onClick={() => setActiveTab('upcoming')}>Upcoming ({upcoming.length})</button>
            <button className={`tab ${activeTab === 'completed' ? 'is-active' : ''}`} onClick={() => setActiveTab('completed')}>Completed ({completed.length})</button>
          </div>
        </section>

        <section className="staff-dashboard__list">
          {loading && <div className="muted">Loading...</div>}

          {!loading && activeTab === 'upcoming' && (
            <div className="staff-dashboard__grid">
              {upcoming.length === 0 && <div className="muted">No upcoming appointments</div>}
              {upcoming.map((a) => (
                <StaffAppointmentCard key={a._id || a.id} appointment={a} onUpdateStatus={handleUpdateStatus} />
              ))}
            </div>
          )}

          {!loading && activeTab === 'completed' && (
            <div className="staff-dashboard__grid">
              {completed.length === 0 && <div className="muted">No completed appointments</div>}
              {completed.map((a) => (
                <StaffAppointmentCard key={a._id || a.id} appointment={a} onUpdateStatus={handleUpdateStatus} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default StaffDashboard;
