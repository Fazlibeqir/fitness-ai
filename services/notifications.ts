import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Request notification permissions
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.warn("Notification permissions not granted");
      return false;
    }

    // For Android, create a notification channel
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Fitness AI",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF6B6B",
      });
    }

    return true;
  } catch (error) {
    console.error("Error requesting notification permissions:", error);
    return false;
  }
}

/**
 * Schedule a weekly review notification
 */
export async function scheduleWeeklyReviewNotification(): Promise<string | null> {
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      return null;
    }

    // Cancel any existing weekly review notifications
    await Notifications.cancelAllScheduledNotificationsAsync();

    // Schedule for every Sunday at 6 PM
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "📊 Weekly Review Time!",
        body: "Check your progress and get your next week's plan",
        sound: true,
        data: { type: "weekly_review" },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        weekday: 0, // Sunday
        hour: 18, // 6 PM
        minute: 0,
        repeats: true,
      },
    });

    console.log("🔔 Weekly review notification scheduled: Every Sunday at 18:00 (6 PM)");
    return notificationId;
  } catch (error) {
    console.error("Error scheduling weekly review:", error);
    return null;
  }
}

/**
 * Schedule a monthly review notification
 */
export async function scheduleMonthlyReviewNotification(): Promise<string | null> {
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      return null;
    }

    // Schedule for the 1st of every month at 9 AM
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "📈 Monthly Review Time!",
        body: "Review your monthly progress and adjust your plan",
        sound: true,
        data: { type: "monthly_review" },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        day: 1, // 1st of month
        hour: 9, // 9 AM
        minute: 0,
        repeats: true,
      },
    });

    console.log("🔔 Monthly review notification scheduled: 1st of every month at 09:00 (9 AM)");
    return notificationId;
  } catch (error) {
    console.error("Error scheduling monthly review:", error);
    return null;
  }
}

/**
 * Schedule session reminder notifications
 */
export async function scheduleSessionReminders(trainingDays: string[]): Promise<string[]> {
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      return [];
    }

    const dayMap: { [key: string]: number } = {
      Sunday: 0,
      Monday: 1,
      Tuesday: 2,
      Wednesday: 3,
      Thursday: 4,
      Friday: 5,
      Saturday: 6,
    };

    const notificationIds: string[] = [];

    for (const day of trainingDays) {
      const weekday = dayMap[day];
      if (weekday !== undefined) {
        const id = await Notifications.scheduleNotificationAsync({
          content: {
            title: `💪 ${day} Training Day!`,
            body: "Time for your workout. Let's get it!",
            sound: true,
            data: { type: "session_reminder", day },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
            weekday: weekday + 1, // expo uses 1-7
            hour: 8, // 8 AM reminder
            minute: 0,
            repeats: true,
          },
        });
        notificationIds.push(id);
      }
    }

    return notificationIds;
  } catch (error) {
    console.error("Error scheduling session reminders:", error);
    return [];
  }
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Get all scheduled notifications
 */
export async function getAllScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
  return await Notifications.getAllScheduledNotificationsAsync();
}
