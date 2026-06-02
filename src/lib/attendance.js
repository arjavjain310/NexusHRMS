/**
 * Calendar date in the user's local timezone, stored as UTC midnight.
 * Avoids Prisma @db.Date shifting to the previous day in IST/UTC+ timezones.
 */
export function getAttendanceDate(reference = new Date()) {
  const r = new Date(reference);
  return new Date(Date.UTC(r.getFullYear(), r.getMonth(), r.getDate()));
}
export function getAttendanceDayRange(reference = new Date()) {
  const start = getAttendanceDate(reference);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return {
    start,
    end
  };
}
export function isSameAttendanceDay(a, b) {
  const da = new Date(a);
  const db = new Date(b);
  return da.getUTCFullYear() === db.getUTCFullYear() && da.getUTCMonth() === db.getUTCMonth() && da.getUTCDate() === db.getUTCDate();
}
export function serializeAttendanceRecord(record) {
  return {
    ...record,
    date: record.date instanceof Date ? record.date.toISOString() : record.date,
    checkIn: record.checkIn ? record.checkIn.toISOString() : null,
    checkOut: record.checkOut ? record.checkOut.toISOString() : null
  };
}