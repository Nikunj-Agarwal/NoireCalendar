import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generates time slots for a day view
 * @param startHour Starting hour (0-23)
 * @param endHour Ending hour (0-23)
 * @param intervalMinutes Interval in minutes
 */
export function generateTimeSlots(
  startHour = 0,
  endHour = 23,
  intervalMinutes = 60
) {
  const slots = [];
  for (let hour = startHour; hour <= endHour; hour++) {
    for (let min = 0; min < 60; min += intervalMinutes) {
      if (hour === endHour && min > 0) {
        break;
      }
      
      slots.push({
        hour,
        minute: min,
        label: formatTimeSlot(hour, min),
      });
    }
  }
  return slots;
}

/**
 * Formats a time slot as a string (e.g., "9:00 AM")
 */
function formatTimeSlot(hour: number, minute: number) {
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  const displayMinute = minute.toString().padStart(2, "0");
  return `${displayHour}:${displayMinute} ${period}`;
}
