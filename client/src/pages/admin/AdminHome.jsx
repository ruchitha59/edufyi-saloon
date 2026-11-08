import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import AdminModal from '../../components/admin/AdminModal';
import AdminSectionCard from '../../components/admin/AdminSectionCard';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminStatCard from '../../components/admin/AdminStatCard';
import AdminTable from '../../components/admin/AdminTable';
import AdminTopbar from '../../components/admin/AdminTopbar';
import { getSalons } from '../../services/salonService';
import { SALON_CATEGORIES } from '../../config/appConstants';
import { clearAuthStorage } from '../../utils/auth';
import { getSlotAvailabilityState } from '../../utils/slotAvailability';
import {
  assignAdminSlot,
  createAdminService,
  createAdminSlots,
  createAdminStaff,
  deleteAdminService,
  deleteAdminStaff,
  disableAdminSlot,
  getAdminBookings,
  getAdminSlots,
  getAdminServices,
  getAdminStaff,
  toggleAdminService,
  updateAdminBookingStatus,
  updateAdminSalon,
  updateAdminSalonSlotTimings,
  updateAdminSalonWorkingHours,
  updateAdminService,
  updateAdminStaff,
  updateAdminSlotAvailability,
} from '../../services/adminService';

const SECTION_LABELS = {
  overview: 'Dashboard Overview',
  staff: 'Staff Management',
  services: 'Services',
  bookings: 'Bookings',
  slots: 'Slots',
  settings: 'Salon Settings',
};

const BOOKING_STATUSES = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];

const EMPTY_STAFF_FORM = {
  name: '',
  email: '',
  password: '',
  category: [SALON_CATEGORIES[0]],
  specialization: '',
  profileImage: '',
  salonId: '',
  workingStartTime: '09:00',
  workingEndTime: '18:00',
  serviceIds: [],
};

const EMPTY_SERVICE_FORM = {
  serviceName: '',
  duration: '30 min',
  price: '',
  salonId: '',
  assignedStaffIds: [],
  active: true,
};

const EMPTY_SLOT_FORM = {
  salonId: '',
  staffId: '',
  date: '',
  startTime: '',
  endTime: '',
};

const EMPTY_SALON_FORM = {
  name: '',
  description: '',
  address: '',
  city_id: '',
  area_id: '',
  state_id: '',
  contact_number: '',
  opening_hours: '',
  status: 'AA',
  imagesText: '',
  workingHoursStartTime: '09:00',
  workingHoursEndTime: '18:00',
  slotTimingsStartTime: '',
  slotTimingsEndTime: '',
  slotTimingsIntervalMinutes: '30',
  slotTimingsMaxParallelSlots: '1',
};

const parseCommaSeparatedIds = (value = '') =>
  String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const formatCurrency = (value = 0) => `Rs ${Number(value || 0).toLocaleString()}`;

const normalizeText = (value = '') => String(value || '').trim();

const toggleArrayValue = (items = [], value) =>
  items.includes(value) ? items.filter((item) => item !== value) : [...items, value];

const getEntityId = (entity) => entity?._id || entity?.id || '';
const getEntitySalonId = (entity) =>
  entity?.salonId?._id ||
  entity?.salonId ||
  entity?.salon_id ||
  entity?.slotId?.salonId?._id ||
  entity?.slotId?.salonId ||
  entity?.slotId?.salon_id ||
  '';

const AdminHome = () => {
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshTick, setRefreshTick] = useState(0);
  const [salons, setSalons] = useState([]);
  const [selectedSalonId, setSelectedSalonId] = useState('');
  const [staff, setStaff] = useState([]);
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [slots, setSlots] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [salonForm, setSalonForm] = useState(EMPTY_SALON_FORM);
  const [bookingDate, setBookingDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [bookingStatusFilter, setBookingStatusFilter] = useState('');
  const [bookingStaffFilter, setBookingStaffFilter] = useState('');
  const [slotStylistFilter, setSlotStylistFilter] = useState('');
  const [now, setNow] = useState(() => new Date());

  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [staffEditingId, setStaffEditingId] = useState('');
  const [staffForm, setStaffForm] = useState(EMPTY_STAFF_FORM);

  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [serviceEditingId, setServiceEditingId] = useState('');
  const [serviceForm, setServiceForm] = useState(EMPTY_SERVICE_FORM);

  const [slotModalOpen, setSlotModalOpen] = useState(false);
  const [slotEditingId, setSlotEditingId] = useState('');
  const [slotForm, setSlotForm] = useState(EMPTY_SLOT_FORM);
  const [slotViewDate, setSlotViewDate] = useState(() => new Date().toISOString().slice(0, 10));

  const [salonSaving, setSalonSaving] = useState(false);
  const [modalSaving, setModalSaving] = useState(false);

  const selectedSalon = useMemo(() => salons.find((salon) => salon._id === selectedSalonId) || salons[0] || null, [salons, selectedSalonId]);

  const salonStaff = useMemo(() => staff.filter((item) => String(item.salonId || item.salon_id || '') === String(selectedSalonId)), [staff, selectedSalonId]);
  const salonServices = useMemo(() => services.filter((item) => String(getEntitySalonId(item)) === String(selectedSalonId)), [services, selectedSalonId]);
  const salonBookings = useMemo(() => bookings.filter((item) => String(getEntitySalonId(item)) === String(selectedSalonId)), [bookings, selectedSalonId]);
  const visibleSlots = useMemo(() => {
    if (!selectedSalonId) {
      return slots;
    }

    return slots.filter((item) => {
      const salonMatch = String(item.salon_id || item.salonId || '') === String(selectedSalonId);
      const stylistMatch = !slotStylistFilter || String(item.stylist_id?._id || item.stylist_id?.id || item.stylist_id || item.staffId || '') === String(slotStylistFilter);
      return salonMatch && stylistMatch;
    });
  }, [slots, selectedSalonId, slotStylistFilter]);

  const slotSummary = useMemo(() => {
    const counts = visibleSlots.reduce(
      (accumulator, slot) => {
        const status = getSlotAvailabilityState({ slot, selectedDate: slotViewDate, now }).statusClass.toUpperCase();

        if (status === 'BOOKED') accumulator.booked += 1;
        else if (status === 'EXPIRED') accumulator.expired += 1;
        else if (status === 'UNAVAILABLE') accumulator.unavailable += 1;
        else accumulator.available += 1;

        return accumulator;
      },
      { total: visibleSlots.length, available: 0, unavailable: 0, booked: 0, expired: 0 }
    );

    return [
      { label: 'Total Slots', value: counts.total, detail: 'All slots for the selected stylist and date' },
      { label: 'Available Slots', value: counts.available, detail: 'Ready for booking' },
      { label: 'Booked Slots', value: counts.booked, detail: 'Reserved by customers' },
      { label: 'Unavailable Slots', value: counts.unavailable, detail: 'Disabled by admin or staff' },
      { label: 'Expired Slots', value: counts.expired, detail: 'Past time slots' },
    ];
  }, [visibleSlots, now, slotViewDate]);

  const overviewStats = useMemo(() => {
    const activeStaff = salonStaff.filter((item) => (item.status || '').toUpperCase() === 'AA').length;
    const activeServices = salonServices.filter((item) => item.active !== false).length;
    const confirmedBookings = bookings.filter((item) => (item.bookingStatus || item.booking_status) === 'CONFIRMED').length;
    const revenue = bookings.reduce((sum, item) => sum + Number(item.totalPrice || item.total_price || 0), 0);

    return [
      { label: 'Staff members', value: staff.length, detail: `${activeStaff} active in this salon`, tone: 'gold' },
      { label: 'Services', value: services.length, detail: `${activeServices} currently available`, tone: 'cream' },
      { label: 'Appointments', value: bookings.length, detail: `${confirmedBookings} confirmed bookings`, tone: 'amber' },
      { label: 'Revenue', value: formatCurrency(revenue), detail: 'Based on stored booking totals', tone: 'rose' },
    ];
  }, [bookings, salonServices, salonStaff, services.length, staff.length]);

  const loadData = async () => {
    try {
      setLoading(true);
      setErrorMessage('');

      const [salonResp, staffResp, servicesResp, bookingsResp, slotsResp] = await Promise.all([
        getSalons(),
        getAdminStaff(),
        getAdminServices({ salonId: selectedSalonId || undefined }),
        getAdminBookings({
          date: bookingDate,
          staffId: bookingStaffFilter || undefined,
          bookingStatus: bookingStatusFilter || undefined,
        }),
        getAdminSlots({ salonId: selectedSalonId || undefined, stylistId: slotStylistFilter || undefined, date: slotViewDate, includeAll: true }),
      ]);

      const nextSalons = Array.isArray(salonResp?.data?.data)
        ? salonResp.data.data
        : Array.isArray(salonResp?.data)
          ? salonResp.data
          : [];
      const nextSelectedSalonId = selectedSalonId || nextSalons[0]?._id || '';

      setSalons(nextSalons);
      if (nextSelectedSalonId && nextSelectedSalonId !== selectedSalonId) {
        setSelectedSalonId(nextSelectedSalonId);
      }

      const nextBookings = Array.isArray(bookingsResp?.data?.data)
        ? bookingsResp.data.data
        : Array.isArray(bookingsResp?.data)
          ? bookingsResp.data
          : [];

      console.log('Bookings returned:', nextBookings);
      console.log('Bookings count:', nextBookings.length);

      setStaff(Array.isArray(staffResp?.data?.data) ? staffResp.data.data : Array.isArray(staffResp?.data) ? staffResp.data : []);
      setServices(Array.isArray(servicesResp?.data?.data) ? servicesResp.data.data : Array.isArray(servicesResp?.data) ? servicesResp.data : []);
      setBookings(nextBookings);
      setSlots(Array.isArray(slotsResp?.data?.data) ? slotsResp.data.data : Array.isArray(slotsResp?.data) ? slotsResp.data : []);
    } catch (error) {
      setErrorMessage(error?.response?.data?.message || error?.message || 'Failed to load admin data.');
      setSlots([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTick, selectedSalonId, slotViewDate, bookingDate, bookingStaffFilter, bookingStatusFilter, slotStylistFilter]);

  useEffect(() => {
    if (!selectedSalonId && salons[0]?._id) {
      setSelectedSalonId(salons[0]._id);
    }
  }, [salons, selectedSalonId]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (selectedSalon) {
      setSalonForm({
        name: selectedSalon.name || '',
        description: selectedSalon.description || '',
        address: selectedSalon.address || '',
        city_id: selectedSalon.city_id || '',
        area_id: selectedSalon.area_id || '',
        state_id: selectedSalon.state_id || '',
        contact_number: selectedSalon.contact_number || '',
        opening_hours: selectedSalon.opening_hours || '',
        status: selectedSalon.status || 'AA',
        imagesText: (selectedSalon.images || []).join(', '),
        workingHoursStartTime: selectedSalon.workingHours?.start || selectedSalon.working_hours?.start || selectedSalon.workingHours?.startTime || selectedSalon.working_hours?.startTime || '09:00',
        workingHoursEndTime: selectedSalon.workingHours?.end || selectedSalon.working_hours?.end || selectedSalon.workingHours?.endTime || selectedSalon.working_hours?.endTime || '18:00',
        slotTimingsStartTime: selectedSalon.slotTimings?.startTime || selectedSalon.slot_timings?.startTime || '',
        slotTimingsEndTime: selectedSalon.slotTimings?.endTime || selectedSalon.slot_timings?.endTime || '',
        slotTimingsIntervalMinutes: String(selectedSalon.slotTimings?.intervalMinutes || selectedSalon.slot_timings?.intervalMinutes || 30),
        slotTimingsMaxParallelSlots: String(selectedSalon.slotTimings?.maxParallelSlots || selectedSalon.slot_timings?.maxParallelSlots || 1),
      });
    }
  }, [selectedSalon]);

  useEffect(() => {
    if (!salonStaff.length) {
      setSlotStylistFilter('');
      return;
    }

    if (!slotStylistFilter || !salonStaff.some((item) => String(item._id) === String(slotStylistFilter))) {
      setSlotStylistFilter(salonStaff[0]._id);
    }
  }, [salonStaff, slotStylistFilter]);

  const handleLogout = () => {
    clearAuthStorage();
    navigate('/login', { replace: true });
  };

  const refreshAll = () => setRefreshTick((value) => value + 1);

  const openQuickAdd = () => {
    if (activeSection === 'staff') {
      setStaffEditingId('');
      setStaffForm({ ...EMPTY_STAFF_FORM, salonId: selectedSalonId });
      setStaffModalOpen(true);
      return;
    }

    if (activeSection === 'services') {
      setServiceEditingId('');
      setServiceForm({ ...EMPTY_SERVICE_FORM, salonId: selectedSalonId });
      setServiceModalOpen(true);
      return;
    }

    if (activeSection === 'slots') {
      setSlotEditingId('');
      setSlotForm({ ...EMPTY_SLOT_FORM, salonId: selectedSalonId });
      setSlotModalOpen(true);
      return;
    }

    setActiveSection('staff');
  };

  const openStaffModal = (entity = null) => {
    setStaffEditingId(getEntityId(entity));
    setStaffForm({
      name: entity?.name || '',
      email: entity?.email || '',
      password: '',
      category: Array.isArray(entity?.category) ? entity.category : entity?.category ? [entity.category] : [SALON_CATEGORIES[0]],
      specialization: entity?.specialization || '',
      profileImage: entity?.profileImage || entity?.profile_image || '',
      salonId: entity?.salonId || entity?.salon_id || selectedSalonId,
      workingStartTime: entity?.workingHours?.start || entity?.working_hours?.start || entity?.workingHours?.startTime || entity?.working_hours?.startTime || '09:00',
      workingEndTime: entity?.workingHours?.end || entity?.working_hours?.end || entity?.workingHours?.endTime || entity?.working_hours?.endTime || '18:00',
      serviceIds: (entity?.services || []).map((item) => item?._id || item?.id || item).filter(Boolean),
    });
    setStaffModalOpen(true);
  };

  const openServiceModal = (entity = null) => {
    setServiceEditingId(getEntityId(entity));
    setServiceForm({
      serviceName: entity?.serviceName || entity?.service_name || '',
      duration: entity?.duration || '',
      price: entity?.price ?? '',
      salonId: entity?.salonId || entity?.salon_id || selectedSalonId,
      assignedStaffIds: (entity?.assignedStaff || entity?.assigned_staff || []).map((item) => item?._id || item).filter(Boolean),
      active: entity?.active !== false,
    });
    setServiceModalOpen(true);
  };

  const openSlotModal = (entity = null) => {
    setSlotEditingId(getEntityId(entity));
    setSlotForm({
      salonId: entity?.salon_id || entity?.salonId || selectedSalonId,
      staffId: entity?.stylist_id || entity?.staffId || '',
      date: entity?.date || '',
      startTime: entity?.start_time || entity?.startTime || '',
      endTime: entity?.end_time || entity?.endTime || '',
    });
    setSlotModalOpen(true);
  };

  const submitStaff = async (event) => {
    event.preventDefault();

    try {
      setModalSaving(true);

      const payload = {
        name: normalizeText(staffForm.name),
        email: normalizeText(staffForm.email),
        category: Array.isArray(staffForm.category) && staffForm.category.length ? staffForm.category : [SALON_CATEGORIES[0]],
        specialization: normalizeText(staffForm.specialization),
        profileImage: normalizeText(staffForm.profileImage),
        salonId: normalizeText(staffForm.salonId || selectedSalonId),
        services: Array.isArray(staffForm.serviceIds) ? staffForm.serviceIds : [],
        workingHours: {
          start: normalizeText(staffForm.workingStartTime),
          end: normalizeText(staffForm.workingEndTime),
        },
      };

      if (staffForm.password.trim()) {
        payload.password = staffForm.password.trim();
      }

      if (staffEditingId) {
        await updateAdminStaff(staffEditingId, payload);
        toast.success('Staff updated successfully');
      } else {
        await createAdminStaff(payload);
        toast.success('Staff created successfully');
      }

      setStaffModalOpen(false);
      setStaffEditingId('');
      setStaffForm(EMPTY_STAFF_FORM);
      refreshAll();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to save staff');
    } finally {
      setModalSaving(false);
    }
  };

  const submitService = async (event) => {
    event.preventDefault();

    try {
      setModalSaving(true);
      const payload = {
        serviceName: normalizeText(serviceForm.serviceName),
        duration: normalizeText(serviceForm.duration),
        price: Number(serviceForm.price || 0),
        salonId: normalizeText(serviceForm.salonId || selectedSalonId),
        assignedStaff: Array.isArray(serviceForm.assignedStaffIds) ? serviceForm.assignedStaffIds : [],
        active: Boolean(serviceForm.active),
      };

      if (serviceEditingId) {
        await updateAdminService(serviceEditingId, payload);
        toast.success('Service updated successfully');
      } else {
        await createAdminService(payload);
        toast.success('Service created successfully');
      }

      setServiceModalOpen(false);
      setServiceEditingId('');
      setServiceForm(EMPTY_SERVICE_FORM);
      refreshAll();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to save service');
    } finally {
      setModalSaving(false);
    }
  };

  const submitSlot = async (event) => {
    event.preventDefault();

    try {
      setModalSaving(true);
      const payload = {
        salonId: normalizeText(slotForm.salonId || selectedSalonId),
        staffId: normalizeText(slotForm.staffId),
        date: normalizeText(slotForm.date),
        startTime: normalizeText(slotForm.startTime),
        endTime: normalizeText(slotForm.endTime),
      };

      if (slotEditingId) {
        await assignAdminSlot(slotEditingId, payload);
        toast.success('Slot assigned successfully');
      } else {
        await createAdminSlots(payload);
        toast.success('Slot created successfully');
      }

      setSlotModalOpen(false);
      setSlotEditingId('');
      setSlotForm(EMPTY_SLOT_FORM);
      refreshAll();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to save slot');
    } finally {
      setModalSaving(false);
    }
  };

  const submitSalon = async (event) => {
    event.preventDefault();

    if (!selectedSalon?._id) {
      toast.error('Select a salon first');
      return;
    }

    try {
      setSalonSaving(true);
      await updateAdminSalon(selectedSalon._id, {
        name: salonForm.name,
        description: salonForm.description,
        address: salonForm.address,
        city_id: salonForm.city_id,
        area_id: salonForm.area_id,
        state_id: salonForm.state_id,
        contact_number: salonForm.contact_number,
        opening_hours: salonForm.opening_hours,
        status: salonForm.status,
        images: salonForm.imagesText ? salonForm.imagesText.split(',').map((item) => item.trim()).filter(Boolean) : [],
      });

      await updateAdminSalonWorkingHours(selectedSalon._id, {
        workingHours: {
          start: salonForm.workingHoursStartTime,
          end: salonForm.workingHoursEndTime,
        },
      });

      await updateAdminSalonSlotTimings(selectedSalon._id, {
        slotTimings: {
          startTime: salonForm.slotTimingsStartTime,
          endTime: salonForm.slotTimingsEndTime,
          intervalMinutes: Number(salonForm.slotTimingsIntervalMinutes || 0),
          maxParallelSlots: Number(salonForm.slotTimingsMaxParallelSlots || 0),
        },
      });

      toast.success('Salon settings updated successfully');
      refreshAll();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to update salon settings');
    } finally {
      setSalonSaving(false);
    }
  };

  const handleUpdateBookingStatus = async (bookingId, bookingStatus) => {
    try {
      await updateAdminBookingStatus(bookingId, { bookingStatus });
      toast.success('Booking status updated');
      refreshAll();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to update booking status');
    }
  };

  const handleServiceToggle = async (service) => {
    try {
      await toggleAdminService(service._id, { active: service.active === false });
      toast.success('Service availability updated');
      refreshAll();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to update service availability');
    }
  };

  const handleDeleteStaff = async (id) => {
    if (!window.confirm('Delete this staff member?')) {
      return;
    }

    try {
      await deleteAdminStaff(id);
      toast.success('Staff deleted');
      refreshAll();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to delete staff');
    }
  };

  const handleDeleteService = async (id) => {
    if (!window.confirm('Delete this service?')) {
      return;
    }

    try {
      await deleteAdminService(id);
      toast.success('Service deleted');
      refreshAll();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to delete service');
    }
  };

  const sectionAction =
    activeSection === 'staff' ? (
      <button type="button" className="admin-button admin-button--primary" onClick={() => openStaffModal()}>
        Add staff
      </button>
    ) : activeSection === 'services' ? (
      <button type="button" className="admin-button admin-button--primary" onClick={() => openServiceModal()}>
        Add service
      </button>
    ) : activeSection === 'slots' ? (
      <button type="button" className="admin-button admin-button--primary" onClick={() => refreshAll()}>
        Refresh slots
      </button>
    ) : null;

  return (
    <div className="admin-dashboard app-shell min-h-screen w-full overflow-x-hidden">
      <div className={`admin-mobile-overlay ${sidebarOpen ? 'is-open' : ''}`} onClick={() => setSidebarOpen(false)} />

      <AdminSidebar
        activeSection={activeSection}
        onSelectSection={(section) => {
          setActiveSection(section);
          setSidebarOpen(false);
        }}
        salons={salons}
        selectedSalonId={selectedSalonId}
        onSelectSalon={setSelectedSalonId}
        onLogout={handleLogout}
        isOpen={sidebarOpen}
      />

      <main className="admin-main app-container">
        <AdminTopbar
          activeLabel={SECTION_LABELS[activeSection]}
          salonName={selectedSalon?.name || ''}
          onRefresh={refreshAll}
          onCreate={openQuickAdd}
          onMenuToggle={() => setSidebarOpen((value) => !value)}
        />

        <div className="admin-toolbar-mobile">
          <button type="button" className="admin-button admin-button--ghost" onClick={() => setSidebarOpen((value) => !value)}>
            Menu
          </button>
          <button type="button" className="admin-button admin-button--primary" onClick={openQuickAdd}>
            Quick Add
          </button>
        </div>

        {errorMessage ? <div className="admin-alert">{errorMessage}</div> : null}
        {loading ? <div className="admin-skeleton">Loading dashboard...</div> : null}

        {activeSection === 'overview' ? (
          <div className="admin-stack">
            <section className="admin-stats-grid">
              {overviewStats.map((item) => (
                <AdminStatCard key={item.label} {...item} />
              ))}
            </section>

            <AdminSectionCard title="Recent bookings" description="Latest appointment activity across the selected salon.">
              <AdminTable
                columns={[
                  { key: 'customer', label: 'Customer' },
                  { key: 'staff', label: 'Staff' },
                  { key: 'slot', label: 'Timing' },
                  { key: 'status', label: 'Status' },
                ]}
                rows={salonBookings.slice(0, 5)}
                emptyMessage="No appointments found for this salon."
                renderCell={(row, column) => {
                  if (column.key === 'customer') {
                    return row.customerId?.name || row.customerId?.mobile_number || row.customer_id?.name || row.customer_id?.mobile_number || 'Customer';
                  }

                  if (column.key === 'staff') {
                    return row.staffId?.name || row.staff_id?.name || 'Staff';
                  }

                  if (column.key === 'slot') {
                    return `${row.bookingDate || row.booking_date || '—'} ${row.bookingSlot || row.booking_slot || ''}`.trim();
                  }

                  if (column.key === 'status') {
                    return <span className="admin-badge">{row.bookingStatus || row.booking_status || 'PENDING'}</span>;
                  }

                  return '—';
                }}
              />
            </AdminSectionCard>
          </div>
        ) : null}

        {activeSection === 'staff' ? (
          <AdminSectionCard title="Staff management" description="Add, edit, or remove staff members and keep each profile tied to the right salon." action={sectionAction}>
            <AdminTable
              columns={[
                { key: 'name', label: 'Name' },
                { key: 'email', label: 'Email' },
                { key: 'specialization', label: 'Specialization' },
                { key: 'status', label: 'Status' },
              ]}
              rows={salonStaff}
              emptyMessage="No staff assigned to this salon yet."
              renderCell={(row, column) => {
                if (column.key === 'status') {
                  return <span className="admin-badge admin-badge--soft">{row.status || 'AA'}</span>;
                }

                return row[column.key] || '—';
              }}
              renderRowActions={(row) => (
                <div className="admin-table-actions">
                  <button type="button" className="admin-link-button" onClick={() => openStaffModal(row)}>
                    Edit
                  </button>
                  <button type="button" className="admin-link-button admin-link-button--danger" onClick={() => handleDeleteStaff(row._id)}>
                    Delete
                  </button>
                </div>
              )}
            />
          </AdminSectionCard>
        ) : null}

        {activeSection === 'services' ? (
          <AdminSectionCard title="Services" description="Manage service menu, pricing, availability, and the staff assigned to each service." action={sectionAction}>
            <AdminTable
              columns={[
                { key: 'serviceName', label: 'Service' },
                { key: 'duration', label: 'Duration' },
                { key: 'price', label: 'Price' },
                { key: 'active', label: 'Availability' },
              ]}
              rows={salonServices}
              emptyMessage="No services found for this salon."
              renderCell={(row, column) => {
                if (column.key === 'price') {
                  return formatCurrency(row.price || 0);
                }

                if (column.key === 'active') {
                  return <span className={`admin-badge ${row.active === false ? 'admin-badge--muted' : ''}`}>{row.active === false ? 'Inactive' : 'Active'}</span>;
                }

                return row[column.key] || '—';
              }}
              renderRowActions={(row) => (
                <div className="admin-table-actions">
                  <button type="button" className="admin-link-button" onClick={() => openServiceModal(row)}>
                    Edit
                  </button>
                  <button type="button" className="admin-link-button" onClick={() => handleServiceToggle(row)}>
                    Toggle
                  </button>
                  <button type="button" className="admin-link-button admin-link-button--danger" onClick={() => handleDeleteService(row._id)}>
                    Delete
                  </button>
                </div>
              )}
            />
          </AdminSectionCard>
        ) : null}

        {activeSection === 'bookings' ? (
          <AdminSectionCard title="Bookings" description="View all appointments for the selected date and update their status from one place.">
            <div className="admin-slot-toolbar">
              <label className="admin-field">
                <span>Selected date</span>
                <input className="admin-input" type="date" value={bookingDate} onChange={(event) => setBookingDate(event.target.value)} />
              </label>
              <label className="admin-field">
                <span>Stylist</span>
                <select className="admin-select" value={bookingStaffFilter} onChange={(event) => setBookingStaffFilter(event.target.value)}>
                  <option value="">All stylists</option>
                  {salonStaff.map((staffMember) => (
                    <option key={staffMember._id} value={staffMember._id}>
                      {staffMember.name || 'Staff'}
                    </option>
                  ))}
                </select>
              </label>
              <label className="admin-field">
                <span>Status</span>
                <select className="admin-select" value={bookingStatusFilter} onChange={(event) => setBookingStatusFilter(event.target.value)}>
                  <option value="">All statuses</option>
                  {BOOKING_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="admin-booking-count">
              Total Bookings: {bookings.length}
            </div>

            <AdminTable
              columns={[
                { key: 'bookingId', label: 'Booking ID' },
                { key: 'customer', label: 'Customer' },
                { key: 'stylist', label: 'Stylist' },
                { key: 'phone', label: 'Phone' },
                { key: 'services', label: 'Services' },
                { key: 'category', label: 'Category' },
                { key: 'date', label: 'Booking Date' },
                { key: 'timing', label: 'Timing' },
                { key: 'created', label: 'Created' },
                { key: 'status', label: 'Status' },
              ]}
              rows={bookings}
              emptyMessage="No bookings found for selected date."
              renderCell={(row, column) => {
                if (column.key === 'bookingId') {
                  return row.bookingId || row._id || row.id || '—';
                }

                if (column.key === 'customer') {
                  return row.customerId?.name || row.customerId?.mobile_number || row.customer_id?.name || row.customer_id?.mobile_number || 'Customer';
                }

                if (column.key === 'stylist') {
                  return row.staffId?.name || row.staffId?.fullName || row.staffId?.stylist_name || row.staffId?.email || '—';
                }

                if (column.key === 'phone') {
                  return row.customerId?.mobile_number || row.customerId?.phone || row.customer_id?.mobile_number || row.customer_id?.phone || '—';
                }

                if (column.key === 'services') {
                  const serviceList = row.selectedServices || row.selected_services || [];
                  return serviceList.map((service) => service.serviceName || service.service_name || service.name || 'Service').join(', ') || '—';
                }

                if (column.key === 'category') {
                  return row.mainCategory || row.main_category || '—';
                }

                if (column.key === 'date') {
                  return row.bookingDate || row.booking_date || '—';
                }

                if (column.key === 'timing') {
                  return `${row.bookingDate || row.booking_date || '—'} ${row.bookingSlot || row.booking_slot || ''}`.trim();
                }

                if (column.key === 'created') {
                  return row.createdAt ? new Date(row.createdAt).toLocaleString() : '—';
                }

                if (column.key === 'status') {
                  return (
                    <select className="admin-select admin-select--inline" value={row.bookingStatus || row.booking_status || 'PENDING'} onChange={(event) => handleUpdateBookingStatus(row._id, event.target.value)}>
                      {BOOKING_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  );
                }

                return '—';
              }}
            />
          </AdminSectionCard>
        ) : null}

        {activeSection === 'slots' ? (
          <AdminSectionCard title="Slot schedule" description="Daily scheduling view with live slot states, manual availability controls, and automatic expiry." action={sectionAction}>
            <section className="admin-stats-grid admin-stats-grid--slots">
              {slotSummary.map((item) => (
                <AdminStatCard key={item.label} {...item} />
              ))}
            </section>

            <div className="admin-slot-toolbar">
              <label className="admin-field">
                <span>Selected stylist</span>
                <select className="admin-select" value={slotStylistFilter} onChange={(event) => setSlotStylistFilter(event.target.value)}>
                  {salonStaff.length ? (
                    salonStaff.map((staffMember) => (
                      <option key={staffMember._id} value={staffMember._id}>
                        {staffMember.name || staffMember.fullName || staffMember.email || 'Staff'}
                      </option>
                    ))
                  ) : (
                    <option value="">No stylists available</option>
                  )}
                </select>
              </label>
              <label className="admin-field">
                <span>Selected date</span>
                <input className="admin-input" type="date" value={slotViewDate} onChange={(event) => setSlotViewDate(event.target.value)} />
              </label>
              <div className="slot-legend">
                <span className="slot-legend__item slot-legend__item--available">Available</span>
                <span className="slot-legend__item slot-legend__item--unavailable">Unavailable</span>
                <span className="slot-legend__item slot-legend__item--booked">Booked</span>
                <span className="slot-legend__item slot-legend__item--expired">Expired</span>
              </div>
            </div>

            <div className="slot-grid">
              {visibleSlots.map((slot) => {
                const availability = getSlotAvailabilityState({ slot, selectedDate: slotViewDate, now });
                const status = availability.statusClass.toUpperCase();
                const isBooked = availability.isBooked;
                const isUnavailable = availability.manuallyDisabled;
                const isExpired = availability.isPast;
                const canToggle = availability.available || isUnavailable;
                const stylistName = slot.stylist_id?.name || slot.stylist_id?.fullName || slot.stylist_id?.email || slot.staffId?.name || 'Staff';

                return (
                  <button
                    key={slot._id}
                    type="button"
                    className={`slot-grid__item slot-grid__item--${status.toLowerCase()} ${isBooked || isExpired ? 'slot-grid__item--locked' : ''}`}
                    onClick={async () => {
                      if (!canToggle) {
                        return;
                      }

                      const nextStatus = status === 'AVAILABLE' ? 'UNAVAILABLE' : 'AVAILABLE';

                      try {
                        await updateAdminSlotAvailability(slot._id, { status: nextStatus });
                        toast.success('Slot availability updated');
                        refreshAll();
                      } catch (error) {
                        toast.error(error?.response?.data?.message || 'Failed to update slot');
                      }
                    }}
                    disabled={!canToggle}
                    title={isBooked ? 'Booked' : isUnavailable ? 'Unavailable' : isExpired ? 'Passed' : 'Click to toggle availability.'}
                  >
                    <span className="slot-grid__time">{slot.start_time || slot.startTime} - {slot.end_time || slot.endTime}</span>
                    <span className={`slot-grid__status slot-grid__status--${availability.statusClass}`}>{availability.label}</span>
                    <span className="slot-grid__meta">{stylistName}</span>
                  </button>
                );
              })}
            </div>
          </AdminSectionCard>
        ) : null}

        {activeSection === 'settings' ? (
          <AdminSectionCard title="Salon settings" description="Update salon profile, working hours, and slot timing rules.">
            <form className="admin-form admin-form--grid" onSubmit={submitSalon}>
              <label className="admin-field">
                <span>Name</span>
                <input className="admin-input" value={salonForm.name} onChange={(event) => setSalonForm((state) => ({ ...state, name: event.target.value }))} />
              </label>
              <label className="admin-field">
                <span>Contact number</span>
                <input className="admin-input" value={salonForm.contact_number} onChange={(event) => setSalonForm((state) => ({ ...state, contact_number: event.target.value }))} />
              </label>
              <label className="admin-field admin-field--wide">
                <span>Description</span>
                <textarea className="admin-textarea" value={salonForm.description} onChange={(event) => setSalonForm((state) => ({ ...state, description: event.target.value }))} />
              </label>
              <label className="admin-field">
                <span>City</span>
                <input className="admin-input" value={salonForm.city_id} onChange={(event) => setSalonForm((state) => ({ ...state, city_id: event.target.value }))} />
              </label>
              <label className="admin-field">
                <span>Area</span>
                <input className="admin-input" value={salonForm.area_id} onChange={(event) => setSalonForm((state) => ({ ...state, area_id: event.target.value }))} />
              </label>
              <label className="admin-field">
                <span>Status</span>
                <select className="admin-select" value={salonForm.status} onChange={(event) => setSalonForm((state) => ({ ...state, status: event.target.value }))}>
                  <option value="AA">Active</option>
                  <option value="IA">Inactive</option>
                </select>
              </label>
              <label className="admin-field admin-field--wide">
                <span>Address</span>
                <input className="admin-input" value={salonForm.address} onChange={(event) => setSalonForm((state) => ({ ...state, address: event.target.value }))} />
              </label>
              <label className="admin-field admin-field--wide">
                <span>Opening hours</span>
                <input className="admin-input" value={salonForm.opening_hours} onChange={(event) => setSalonForm((state) => ({ ...state, opening_hours: event.target.value }))} />
              </label>
              <label className="admin-field admin-field--wide">
                <span>Images</span>
                <input className="admin-input" value={salonForm.imagesText} onChange={(event) => setSalonForm((state) => ({ ...state, imagesText: event.target.value }))} />
              </label>
              <label className="admin-field">
                <span>Working start time</span>
                <input className="admin-input" type="time" value={salonForm.workingHoursStartTime} onChange={(event) => setSalonForm((state) => ({ ...state, workingHoursStartTime: event.target.value }))} />
              </label>
              <label className="admin-field">
                <span>Working end time</span>
                <input className="admin-input" type="time" value={salonForm.workingHoursEndTime} onChange={(event) => setSalonForm((state) => ({ ...state, workingHoursEndTime: event.target.value }))} />
              </label>
              <div className="admin-form-grid admin-form-grid--slot-settings admin-field--wide">
                <label className="admin-field">
                  <span>Slot start</span>
                  <input className="admin-input" type="time" value={salonForm.slotTimingsStartTime} onChange={(event) => setSalonForm((state) => ({ ...state, slotTimingsStartTime: event.target.value }))} />
                </label>
                <label className="admin-field">
                  <span>Slot end</span>
                  <input className="admin-input" type="time" value={salonForm.slotTimingsEndTime} onChange={(event) => setSalonForm((state) => ({ ...state, slotTimingsEndTime: event.target.value }))} />
                </label>
                <label className="admin-field">
                  <span>Interval minutes</span>
                  <input className="admin-input" type="number" min="5" value={salonForm.slotTimingsIntervalMinutes} onChange={(event) => setSalonForm((state) => ({ ...state, slotTimingsIntervalMinutes: event.target.value }))} />
                </label>
                <label className="admin-field">
                  <span>Parallel slots</span>
                  <input className="admin-input" type="number" min="1" value={salonForm.slotTimingsMaxParallelSlots} onChange={(event) => setSalonForm((state) => ({ ...state, slotTimingsMaxParallelSlots: event.target.value }))} />
                </label>
              </div>
              <div className="admin-form__actions admin-field--wide">
                <button type="submit" className="admin-button admin-button--primary" disabled={salonSaving}>
                  {salonSaving ? 'Saving...' : 'Save salon settings'}
                </button>
              </div>
            </form>
          </AdminSectionCard>
        ) : null}
      </main>

      <AdminModal open={staffModalOpen} title={staffEditingId ? 'Edit staff' : 'Add staff'} subtitle="Create a staff profile and connect it to the selected salon." onClose={() => setStaffModalOpen(false)}>
        <form className="admin-form" onSubmit={submitStaff}>
          <div className="admin-form-grid">
            <label className="admin-field">
              <span>Name</span>
              <input className="admin-input" value={staffForm.name} onChange={(event) => setStaffForm((state) => ({ ...state, name: event.target.value }))} />
            </label>
            <label className="admin-field">
              <span>Email</span>
              <input className="admin-input" type="email" value={staffForm.email} onChange={(event) => setStaffForm((state) => ({ ...state, email: event.target.value }))} />
            </label>
            <label className="admin-field">
              <span>Password {staffEditingId ? '(leave blank to keep current)' : ''}</span>
              <input className="admin-input" type="password" value={staffForm.password} onChange={(event) => setStaffForm((state) => ({ ...state, password: event.target.value }))} />
            </label>
            <label className="admin-field">
              <span>Category</span>
              <div className="admin-checkbox-group">
                {SALON_CATEGORIES.map((category) => (
                  <label key={category} className="admin-checkbox-pill">
                    <input
                      type="checkbox"
                      checked={Array.isArray(staffForm.category) && staffForm.category.includes(category)}
                      onChange={() => setStaffForm((state) => ({
                        ...state,
                        category: toggleArrayValue(Array.isArray(state.category) ? state.category : [], category),
                      }))}
                    />
                    <span>{category}</span>
                  </label>
                ))}
              </div>
            </label>
            <label className="admin-field">
              <span>Specialization</span>
              <input className="admin-input" value={staffForm.specialization} onChange={(event) => setStaffForm((state) => ({ ...state, specialization: event.target.value }))} />
            </label>
            <label className="admin-field">
              <span>Working start time</span>
              <input className="admin-input" type="time" value={staffForm.workingStartTime} onChange={(event) => setStaffForm((state) => ({ ...state, workingStartTime: event.target.value }))} />
            </label>
            <label className="admin-field">
              <span>Working end time</span>
              <input className="admin-input" type="time" value={staffForm.workingEndTime} onChange={(event) => setStaffForm((state) => ({ ...state, workingEndTime: event.target.value }))} />
            </label>
            <label className="admin-field admin-field--wide">
              <span>Profile image</span>
              <input className="admin-input" value={staffForm.profileImage} onChange={(event) => setStaffForm((state) => ({ ...state, profileImage: event.target.value }))} />
            </label>
            <label className="admin-field admin-field--wide">
              <span>Assigned services</span>
              <div className="admin-checkbox-grid">
                {salonServices.map((service) => (
                  <label key={service._id} className="admin-checkbox-card">
                    <input
                      type="checkbox"
                      checked={staffForm.serviceIds.includes(service._id)}
                      onChange={() => setStaffForm((state) => ({
                        ...state,
                        serviceIds: toggleArrayValue(state.serviceIds || [], service._id),
                      }))}
                    />
                    <span className="admin-checkbox-card__title">{service.serviceName}</span>
                    <span className="admin-checkbox-card__meta">{service.duration} · Rs {Number(service.price || 0).toLocaleString()}</span>
                  </label>
                ))}
                {!salonServices.length ? <div className="empty-state">No services configured yet.</div> : null}
              </div>
            </label>
          </div>
          <div className="admin-form__actions">
            <button type="button" className="admin-button admin-button--ghost" onClick={() => setStaffModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="admin-button admin-button--primary" disabled={modalSaving}>
              {modalSaving ? 'Saving...' : staffEditingId ? 'Update staff' : 'Create staff'}
            </button>
          </div>
        </form>
      </AdminModal>

      <AdminModal open={serviceModalOpen} title={serviceEditingId ? 'Edit service' : 'Add service'} subtitle="Configure pricing and assign staff members to this service." onClose={() => setServiceModalOpen(false)}>
        <form className="admin-form" onSubmit={submitService}>
          <div className="admin-form-grid">
            <label className="admin-field">
              <span>Service name</span>
              <input className="admin-input" value={serviceForm.serviceName} onChange={(event) => setServiceForm((state) => ({ ...state, serviceName: event.target.value }))} />
            </label>
            <label className="admin-field">
              <span>Duration</span>
              <input className="admin-input" value={serviceForm.duration} onChange={(event) => setServiceForm((state) => ({ ...state, duration: event.target.value }))} />
            </label>
            <label className="admin-field">
              <span>Price</span>
              <input className="admin-input" type="number" min="0" value={serviceForm.price} onChange={(event) => setServiceForm((state) => ({ ...state, price: event.target.value }))} />
            </label>
            <label className="admin-field">
              <span>Salon</span>
              <select className="admin-select" value={serviceForm.salonId} onChange={(event) => setServiceForm((state) => ({ ...state, salonId: event.target.value }))}>
                {salons.map((salon) => (
                  <option key={salon._id} value={salon._id}>
                    {salon.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="admin-field admin-field--wide">
              <span>Assigned staff</span>
              <div className="admin-checkbox-grid">
                {salonStaff.length ? (
                  salonStaff.map((member) => {
                    const memberId = member?._id || member?.id || '';
                    return (
                      <label key={memberId} className="admin-checkbox-card">
                        <input
                          type="checkbox"
                          checked={Array.isArray(serviceForm.assignedStaffIds) && serviceForm.assignedStaffIds.includes(memberId)}
                          onChange={() => setServiceForm((state) => ({
                            ...state,
                            assignedStaffIds: toggleArrayValue(Array.isArray(state.assignedStaffIds) ? state.assignedStaffIds : [], memberId),
                          }))}
                        />
                        <span className="admin-checkbox-card__title">{member?.name || 'Staff member'}</span>
                        <span className="admin-checkbox-card__meta">{member?.email || 'No email'}</span>
                      </label>
                    );
                  })
                ) : (
                  <div className="empty-state">No staff found for this salon.</div>
                )}
              </div>
            </label>
            <label className="admin-field">
              <span>Availability</span>
              <select className="admin-select" value={serviceForm.active ? 'true' : 'false'} onChange={(event) => setServiceForm((state) => ({ ...state, active: event.target.value === 'true' }))}>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </label>
          </div>
          <div className="admin-form__actions">
            <button type="button" className="admin-button admin-button--ghost" onClick={() => setServiceModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="admin-button admin-button--primary" disabled={modalSaving}>
              {modalSaving ? 'Saving...' : serviceEditingId ? 'Update service' : 'Create service'}
            </button>
          </div>
        </form>
      </AdminModal>

      <AdminModal open={slotModalOpen} title={slotEditingId ? 'Assign slot' : 'Create slot'} subtitle="Set availability windows and assign them to a staff member." onClose={() => setSlotModalOpen(false)}>
        <form className="admin-form" onSubmit={submitSlot}>
          <div className="admin-form-grid">
            <label className="admin-field">
              <span>Salon</span>
              <select className="admin-select" value={slotForm.salonId} onChange={(event) => setSlotForm((state) => ({ ...state, salonId: event.target.value }))}>
                {salons.map((salon) => (
                  <option key={salon._id} value={salon._id}>
                    {salon.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="admin-field">
              <span>Staff id</span>
              <input className="admin-input" value={slotForm.staffId} onChange={(event) => setSlotForm((state) => ({ ...state, staffId: event.target.value }))} />
            </label>
            <label className="admin-field">
              <span>Date</span>
              <input className="admin-input" type="date" value={slotForm.date} onChange={(event) => setSlotForm((state) => ({ ...state, date: event.target.value }))} />
            </label>
            <label className="admin-field">
              <span>Start time</span>
              <input className="admin-input" type="time" value={slotForm.startTime} onChange={(event) => setSlotForm((state) => ({ ...state, startTime: event.target.value }))} />
            </label>
            <label className="admin-field">
              <span>End time</span>
              <input className="admin-input" type="time" value={slotForm.endTime} onChange={(event) => setSlotForm((state) => ({ ...state, endTime: event.target.value }))} />
            </label>
          </div>
          <div className="admin-form__actions">
            <button type="button" className="admin-button admin-button--ghost" onClick={() => setSlotModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="admin-button admin-button--primary" disabled={modalSaving}>
              {modalSaving ? 'Saving...' : slotEditingId ? 'Assign slot' : 'Create slot'}
            </button>
          </div>
        </form>
      </AdminModal>
    </div>
  );
};

export default AdminHome;
