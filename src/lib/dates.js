import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import isoWeek from 'dayjs/plugin/isoWeek';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(isBetween);
dayjs.extend(weekOfYear);
dayjs.extend(isoWeek);
dayjs.extend(customParseFormat);

/**
 * Get array of 7 day objects for a given week starting on Monday.
 */
export function getWeekDays(weekStartDate) {
    const start = dayjs(weekStartDate);
    return Array.from({ length: 7 }, (_, i) => {
        const date = start.add(i, 'day');
        return {
            date: date.format('YYYY-MM-DD'),
            dayName: date.format('ddd'),
            dayNumber: date.format('D'),
            monthName: date.format('MMM'),
            isToday: date.isSame(dayjs(), 'day'),
            isPast: date.isBefore(dayjs(), 'day'),
        };
    });
}

/**
 * Generate time slot labels for the grid.
 */
export function getTimeSlots(startHour = 6, endHour = 23, slotMinutes = 60) {
    const slots = [];
    for (let h = startHour; h < endHour; h++) {
        if (slotMinutes === 30) {
            slots.push({
                label: dayjs().hour(h).minute(0).format('h:mm A'),
                time: `${String(h).padStart(2, '0')}:00`,
            });
            slots.push({
                label: dayjs().hour(h).minute(30).format('h:mm A'),
                time: `${String(h).padStart(2, '0')}:30`,
            });
        } else {
            slots.push({
                label: dayjs().hour(h).minute(0).format('h A'),
                time: `${String(h).padStart(2, '0')}:00`,
            });
        }
    }
    return slots;
}

/**
 * Format a time string (HH:mm) to display format.
 */
export function formatTime(time) {
    return dayjs(time, 'HH:mm').format('h:mm A');
}

/**
 * Get week range string, e.g., "Feb 10 – 16, 2026"
 */
export function getWeekRangeLabel(weekStartDate) {
    const start = dayjs(weekStartDate);
    const end = start.add(6, 'day');

    if (start.month() === end.month()) {
        return `${start.format('MMM D')} – ${end.format('D, YYYY')}`;
    }
    return `${start.format('MMM D')} – ${end.format('MMM D, YYYY')}`;
}

/**
 * Check if a given week is the current week.
 */
export function isCurrentWeek(weekStartDate) {
    const now = dayjs();
    const start = dayjs(weekStartDate);
    const end = start.add(6, 'day');
    return now.isBetween(start.subtract(1, 'day'), end.add(1, 'day'));
}

/**
 * Calculate how far through the current day we are (for the time indicator line).
 * Returns a percentage 0–100.
 */
export function getCurrentTimePosition(startHour = 6, endHour = 23) {
    const now = dayjs();
    const currentMinutes = now.hour() * 60 + now.minute();
    const dayStartMinutes = startHour * 60;
    const dayEndMinutes = endHour * 60;
    const totalMinutes = dayEndMinutes - dayStartMinutes;

    if (currentMinutes < dayStartMinutes) return 0;
    if (currentMinutes > dayEndMinutes) return 100;

    return ((currentMinutes - dayStartMinutes) / totalMinutes) * 100;
}

export { dayjs };
