const formatDateKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseTimeToMinutes = (value = '') => {
  const text = String(value || '').trim().toUpperCase();

  if (!text) {
    return null;
  }

  const match = text.match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/);
  if (!match) {
    return null;
  }

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[3] || '';

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null;
  }

  if (meridiem === 'PM' && hours < 12) {
    hours += 12;
  }

  if (meridiem === 'AM' && hours === 12) {
    hours = 0;
  }

  return hours * 60 + minutes;
};

const buildSlotDateTime = (selectedDate = '', timeValue = '') => {
  const dateKey = formatDateKey(new Date(selectedDate));
  const minutes = parseTimeToMinutes(timeValue);

  if (!dateKey || minutes === null || Number.isNaN(minutes)) {
    return null;
  }

  const dateTime = new Date(`${dateKey}T00:00:00`);
  if (Number.isNaN(dateTime.getTime())) {
    return null;
  }

  dateTime.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return dateTime;
};

export const getSlotAvailabilityState = ({ slot = {}, selectedDate = '', now = new Date() } = {}) => {
  const timeValue = slot.start_time || slot.startTime || slot.time || '';
  const rawStatus = String(slot.status || '').trim().toUpperCase();
  const slotDateTime = buildSlotDateTime(selectedDate || slot.date || slot.slotDate || '', timeValue);
  const todayKey = formatDateKey(now);
  const selectedKey = formatDateKey(new Date(selectedDate || now));
  const currentTime = now.getTime();
  const slotTime = slotDateTime?.getTime() || 0;
  const isBooked = Boolean(rawStatus === 'BOOKED' || slot.isBooked || slot.is_booked || slot.booking_id);
  const manuallyDisabled = Boolean(rawStatus === 'UNAVAILABLE' || rawStatus === 'BREAK' || slot.manuallyDisabled || slot.is_active === false);
  const selectedDateTime = new Date(`${selectedKey}T00:00:00`);
  const todayDateTime = new Date(`${todayKey}T00:00:00`);
  const isBeforeToday = !Number.isNaN(selectedDateTime.getTime()) && selectedDateTime < todayDateTime;
  const isPastTodaySlot = selectedKey === todayKey && Boolean(slotDateTime) && slotTime < currentTime;
  const isPast = !isBooked && !manuallyDisabled && Boolean(slotDateTime) && (isBeforeToday || isPastTodaySlot);
  const available = !isBooked && !manuallyDisabled && !isPast;

  return {
    time: timeValue,
    isBooked,
    isPast,
    manuallyDisabled,
    available,
    label: isBooked ? 'Booked' : manuallyDisabled ? 'Unavailable' : isPast ? 'Passed' : 'Available',
    statusClass: isBooked ? 'booked' : manuallyDisabled ? 'unavailable' : isPast ? 'expired' : 'available',
    slotDateTime,
  };
};

export default getSlotAvailabilityState;
