import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import AdminSectionCard from '../../components/admin/AdminSectionCard';
import AdminTable from '../../components/admin/AdminTable';
import { clearAuthStorage } from '../../utils/auth';
import { getSlotAvailabilityState } from '../../utils/slotAvailability';
import { getStaffAppointments, getStaffSlots, updateStaffAppointmentStatus, updateStaffSlotAvailability } from '../../services/staffService';

const BOOKING_STATUSES = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];

const StaffHome = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshTick, setRefreshTick] = useState(0);
  const [appointmentDate, setAppointmentDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [slotDate, setSlotDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [now, setNow] = useState(() => new Date());

  const refresh = () => setRefreshTick((value) => value + 1);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setLoading(true);
        const [appointmentsResp, slotsResp] = await Promise.all([
          getStaffAppointments({ date: appointmentDate }),
          getStaffSlots({ date: slotDate, includeAll: true }),
        ]);

        if (!active) {
          return;
        }

        const nextAppointments = Array.isArray(appointmentsResp?.data?.data)
          ? appointmentsResp.data.data
          : Array.isArray(appointmentsResp?.data)
            ? appointmentsResp.data
            : [];

        const nextSlots = Array.isArray(slotsResp?.data?.data)
          ? slotsResp.data.data
          : Array.isArray(slotsResp?.data)
            ? slotsResp.data
            : [];

        setAppointments(nextAppointments);
        setSlots(nextSlots);
      } catch (error) {
        if (active) {
          toast.error(error?.response?.data?.message || 'Failed to load staff dashboard');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    load();

    const interval = setInterval(load, 15000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [refreshTick, slotDate, appointmentDate]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slotDate]);

  const selectedDateAppointments = useMemo(() => appointments, [appointments]);

  const upcomingAppointments = useMemo(
    () => appointments.filter((appointment) => (appointment.bookingStatus || appointment.booking_status || '').toUpperCase() !== 'COMPLETED').slice(0, 8),
    [appointments]
  );

  const slotSummary = useMemo(() => {
    const counts = slots.reduce(
      (accumulator, slot) => {
        const status = getSlotAvailabilityState({ slot, selectedDate: slotDate, now }).statusClass.toUpperCase();

        if (status === 'BOOKED') accumulator.booked += 1;
        else if (status === 'EXPIRED') accumulator.expired += 1;
        else if (status === 'UNAVAILABLE') accumulator.unavailable += 1;
        else accumulator.available += 1;

        return accumulator;
      },
      { total: slots.length, available: 0, unavailable: 0, booked: 0, expired: 0 }
    );

    return [
      { label: 'Total Slots', value: counts.total, detail: 'For the selected day and your schedule' },
      { label: 'Available Slots', value: counts.available, detail: 'You can toggle these' },
      { label: 'Booked Slots', value: counts.booked, detail: 'Reserved by customers' },
      { label: 'Unavailable Slots', value: counts.unavailable, detail: 'Disabled manually' },
      { label: 'Expired Slots', value: counts.expired, detail: 'Past time slots' },
    ];
  }, [now, slotDate, slots]);

  const activeSlots = useMemo(() => slots.filter((slot) => getSlotAvailabilityState({ slot, selectedDate: slotDate, now }).available), [now, slotDate, slots]);

  const handleLogout = () => {
    clearAuthStorage();
    navigate('/login', { replace: true });
  };

  const handleAppointmentStatus = async (appointmentId, status) => {
    try {
      await updateStaffAppointmentStatus(appointmentId, status);
      toast.success('Appointment status updated');
      refresh();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to update appointment status');
    }
  };

  const handleSlotStatus = async (slotId, status) => {
    try {
      await updateStaffSlotAvailability(slotId, { status });
      toast.success('Slot availability updated');
      refresh();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to update slot status');
    }
  };

  return (
    <div className="admin-shell app-shell min-h-screen w-full overflow-x-hidden">
      <div className="admin-shell__content app-container">
        <header className="admin-topbar">
          <div>
            <div className="admin-topbar__eyebrow">Staff workspace</div>
            <h1 className="admin-topbar__title">Appointments and availability</h1>
            <p className="admin-topbar__subtitle">Monitor today’s bookings, manage status changes, and control your slot availability.</p>
          </div>
          <div className="admin-topbar__actions">
            <button type="button" className="admin-button admin-button--ghost" onClick={refresh}>
              Refresh
            </button>
            <button type="button" className="admin-button admin-button--primary" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </header>

        <main className="admin-main app-container">
          <AdminSectionCard title="Appointment date" description="Choose the date whose bookings you want to view.">
            <div className="admin-slot-toolbar">
              <label className="admin-field">
                <span>Selected date</span>
                <input className="admin-input" type="date" value={appointmentDate} onChange={(event) => setAppointmentDate(event.target.value)} />
              </label>
            </div>
          </AdminSectionCard>

          <section className="admin-stats-grid">
            <article className="admin-stat-card">
              <div className="admin-stat-card__label">Today</div>
              <div className="admin-stat-card__value">{selectedDateAppointments.length}</div>
              <div className="admin-stat-card__detail">Appointments scheduled for selected date</div>
            </article>
            <article className="admin-stat-card">
              <div className="admin-stat-card__label">Upcoming</div>
              <div className="admin-stat-card__value">{upcomingAppointments.length}</div>
              <div className="admin-stat-card__detail">Active bookings in the queue</div>
            </article>
            <article className="admin-stat-card">
              <div className="admin-stat-card__label">Slots</div>
              <div className="admin-stat-card__value">{activeSlots.length}</div>
              <div className="admin-stat-card__detail">Available or configurable slots</div>
            </article>
            <article className="admin-stat-card">
              <div className="admin-stat-card__label">Live sync</div>
              <div className="admin-stat-card__value">On</div>
              <div className="admin-stat-card__detail">Auto-refresh every 15 seconds</div>
            </article>
          </section>

          {loading ? <div className="loading-state">Loading staff dashboard...</div> : null}

          <AdminSectionCard title="Selected date appointments" description="Appointments assigned to you for the selected date.">
            <AdminTable
              columns={[
                { key: 'customer', label: 'Customer' },
                { key: 'when', label: 'When' },
                { key: 'services', label: 'Services' },
                { key: 'status', label: 'Status' },
              ]}
              rows={selectedDateAppointments}
              emptyMessage="No appointments found for selected date."
              renderCell={(row, column) => {
                if (column.key === 'customer') {
                  const customer = row.customerId || row.customer || {};
                  return customer.name || customer.fullName || customer.phone || 'Customer';
                }

                if (column.key === 'when') {
                  return `${row.bookingDate || row.booking_date || '—'} ${row.bookingSlot || row.booking_slot || ''}`.trim();
                }

                if (column.key === 'services') {
                  const list = row.selectedServices || row.selected_services || [];
                  return list.map((service) => service.name || service.serviceName || service.title || service).join(', ');
                }

                if (column.key === 'status') {
                  return (
                    <select className="admin-select admin-select--inline" value={row.bookingStatus || row.booking_status || 'PENDING'} onChange={(event) => handleAppointmentStatus(row._id, event.target.value)}>
                      {BOOKING_STATUSES.map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  );
                }

                return '—';
              }}
            />
          </AdminSectionCard>

          <AdminSectionCard title="Slot availability" description="Visual schedule with booked and expired slots locked automatically.">
            <section className="admin-stats-grid admin-stats-grid--slots">
              {slotSummary.map((item) => (
                <article key={item.label} className="admin-stat-card">
                  <div className="admin-stat-card__label">{item.label}</div>
                  <div className="admin-stat-card__value">{item.value}</div>
                  <div className="admin-stat-card__detail">{item.detail}</div>
                </article>
              ))}
            </section>

            <div className="admin-slot-toolbar">
              <label className="admin-field">
                <span>Selected date</span>
                <input className="admin-input" type="date" value={slotDate} onChange={(event) => setSlotDate(event.target.value)} />
              </label>
              <div className="slot-legend">
                <span className="slot-legend__item slot-legend__item--available">Available</span>
                <span className="slot-legend__item slot-legend__item--unavailable">Unavailable</span>
                <span className="slot-legend__item slot-legend__item--booked">Booked</span>
                <span className="slot-legend__item slot-legend__item--expired">Expired</span>
              </div>
            </div>

            <div className="slot-grid">
              {slots.length ? slots.map((row) => {
                const availability = getSlotAvailabilityState({ slot: row, selectedDate: slotDate, now });
                const status = availability.statusClass.toUpperCase();
                const isBooked = availability.isBooked;
                const isUnavailable = availability.manuallyDisabled;
                const isExpired = availability.isPast;
                const canToggle = availability.available || isUnavailable;

                return (
                  <button
                    key={row._id}
                    type="button"
                    className={`slot-grid__item slot-grid__item--${status.toLowerCase()} ${isBooked || isExpired ? 'slot-grid__item--locked' : ''}`}
                    disabled={!canToggle}
                    onClick={async () => {
                      if (!canToggle) {
                        return;
                      }

                      const nextStatus = status === 'AVAILABLE' ? 'UNAVAILABLE' : 'AVAILABLE';

                      try {
                        await handleSlotStatus(row._id, nextStatus);
                      } catch {
                        // handled in handler
                      }
                    }}
                    title={isBooked ? 'Booked' : isUnavailable ? 'Unavailable' : isExpired ? 'Passed' : 'Click to toggle availability.'}
                  >
                    <span className="slot-grid__time">{row.start_time || row.startTime || '—'} - {row.end_time || row.endTime || '—'}</span>
                    <span className={`slot-grid__status slot-grid__status--${availability.statusClass}`}>{availability.label}</span>
                    <span className="slot-grid__meta">{row.date || slotDate}</span>
                  </button>
                );
              }) : <div className="loading-state">No slots loaded for this day.</div>}
            </div>
          </AdminSectionCard>
        </main>
      </div>
    </div>
  );
};

export default StaffHome;