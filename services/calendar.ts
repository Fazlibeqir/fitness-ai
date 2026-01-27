import * as Calendar from "expo-calendar";
import { TrainingDay } from "@/types";

/**
 * Request calendar permissions
 */
export async function requestCalendarPermission(): Promise<boolean> {
  try {
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    return status === "granted";
  } catch (error) {
    console.error("Error requesting calendar permission:", error);
    return false;
  }
}

/**
 * Get default calendar
 */
export async function getDefaultCalendar(): Promise<Calendar.Calendar | null> {
  try {
    const hasPermission = await requestCalendarPermission();
    if (!hasPermission) {
      return null;
    }

    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    const defaultCalendar = calendars.find((cal) => cal.allowsModifications) || calendars[0];
    return defaultCalendar || null;
  } catch (error) {
    console.error("Error getting calendar:", error);
    return null;
  }
}

/**
 * Create calendar events for weekly plan
 */
export async function createWeeklyPlanEvents(
  trainingDays: TrainingDay[],
  weekStart: Date
): Promise<string[]> {
  try {
    const calendar = await getDefaultCalendar();
    if (!calendar) {
      throw new Error("No calendar available");
    }

    const eventIds: string[] = [];
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    for (const trainingDay of trainingDays) {
      const dayIndex = dayNames.indexOf(trainingDay.day);
      if (dayIndex === -1) continue;

      const eventDate = new Date(weekStart);
      eventDate.setDate(weekStart.getDate() + dayIndex);

      // Set time (default to 6 PM, user can adjust)
      eventDate.setHours(18, 0, 0, 0);

      const exercises = trainingDay.exercises.map((ex) => `${ex.name} (${ex.sets}×${ex.reps})`).join(", ");

      const eventId = await Calendar.createEventAsync(calendar.id, {
        title: `Training: ${trainingDay.focus}`,
        startDate: eventDate,
        endDate: new Date(eventDate.getTime() + 60 * 60 * 1000), // 1 hour
        notes: `Exercises: ${exercises}`,
        timeZone: "UTC",
      });

      eventIds.push(eventId);
    }

    return eventIds;
  } catch (error) {
    console.error("Error creating calendar events:", error);
    throw error;
  }
}

/**
 * Generate iCal format for export
 */
export function generateICalFile(
  trainingDays: TrainingDay[],
  weekStart: Date
): string {
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const formatDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  };

  let ical = "BEGIN:VCALENDAR\n";
  ical += "VERSION:2.0\n";
  ical += "PRODID:-//FitnessAI//Training Plan//EN\n";
  ical += "CALSCALE:GREGORIAN\n";

  for (const trainingDay of trainingDays) {
    const dayIndex = dayNames.indexOf(trainingDay.day);
    if (dayIndex === -1) continue;

    const eventDate = new Date(weekStart);
    eventDate.setDate(weekStart.getDate() + dayIndex);
    eventDate.setHours(18, 0, 0, 0);

    const endDate = new Date(eventDate);
    endDate.setHours(19, 0, 0, 0);

    const exercises = trainingDay.exercises.map((ex) => `${ex.name} (${ex.sets}×${ex.reps})`).join(", ");

    ical += "BEGIN:VEVENT\n";
    ical += `UID:${Date.now()}-${Math.random()}@fitnessai.com\n`;
    ical += `DTSTART:${formatDate(eventDate)}\n`;
    ical += `DTEND:${formatDate(endDate)}\n`;
    ical += `SUMMARY:Training: ${trainingDay.focus}\n`;
    ical += `DESCRIPTION:Exercises: ${exercises}\n`;
    ical += "END:VEVENT\n";
  }

  ical += "END:VCALENDAR\n";
  return ical;
}

/**
 * Generate Google Calendar URL
 */
export function generateGoogleCalendarUrl(
  trainingDays: TrainingDay[],
  weekStart: Date
): string {
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const baseUrl = "https://calendar.google.com/calendar/render?action=TEMPLATE";

  // For simplicity, create URL for first training day
  // In production, you'd create multiple events or use batch creation
  const firstDay = trainingDays[0];
  const dayIndex = dayNames.indexOf(firstDay.day);
  const eventDate = new Date(weekStart);
  eventDate.setDate(weekStart.getDate() + dayIndex);

  const exercises = firstDay.exercises.map((ex) => `${ex.name} (${ex.sets}×${ex.reps})`).join(", ");

  const params = new URLSearchParams({
    text: `Training: ${firstDay.focus}`,
    dates: `${eventDate.toISOString().replace(/[-:]/g, "").split(".")[0]}Z/${new Date(eventDate.getTime() + 60 * 60 * 1000).toISOString().replace(/[-:]/g, "").split(".")[0]}Z`,
    details: `Exercises: ${exercises}`,
  });

  return `${baseUrl}&${params.toString()}`;
}
