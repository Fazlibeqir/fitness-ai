# Date Logic & Review Scheduling Explanation

## Plan Date (week_start)

The **plan date** is the date that determines which week a training plan belongs to. This is stored in the `week_start` column in the `training_plans` table.

### How it's calculated:

1. **When creating a plan (onboarding):**
   ```typescript
   const weekStart = new Date();
   weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Gets Sunday
   const weekStartStr = weekStart.toISOString().slice(0, 10); // "YYYY-MM-DD"
   ```
   - This calculates the **Sunday** of the current week
   - Example: If today is Wednesday, Jan 29, 2026 → week_start = "2026-01-26" (Sunday)

2. **When loading a plan:**
   - First tries to find a plan for the **current week's Sunday**
   - If not found, loads the **most recent plan** (could be from a past week)
   - The plan's `week_start` date is what determines which week it belongs to

### Important:
- The plan date is **static** - it doesn't change once created
- It represents the **start of the week** (Sunday) that the plan is for
- Plans are stored with format: `"YYYY-MM-DD"` (e.g., "2026-01-26")

---

## Review Scheduling Times (Separate from Plan Date)

Review notifications are scheduled at **fixed times** and are **independent** of when the plan was created.

### Weekly Review:
- **Time:** Every Sunday at 6:00 PM (18:00)
- **Frequency:** Repeats every week
- **Trigger:** Calendar-based, not tied to plan creation date

### Monthly Review:
- **Time:** 1st of every month at 9:00 AM
- **Frequency:** Repeats every month
- **Trigger:** Calendar-based, not tied to plan creation date

### Session Reminders:
- **Time:** 8:00 AM on training days
- **Frequency:** Repeats every week on training days
- **Trigger:** Based on the days in your plan (Monday, Tuesday, etc.)

---

## Key Differences

| Aspect | Plan Date (week_start) | Review Scheduling |
|--------|------------------------|-------------------|
| **Purpose** | Identifies which week the plan belongs to | When to notify user |
| **Format** | Date string: "YYYY-MM-DD" | Time: Hour:Minute (e.g., 18:00) |
| **Changes** | Static (set when plan created) | Dynamic (repeats on schedule) |
| **Used For** | Database queries, displaying plan | Notification triggers |

---

## Example Scenario

**Today:** Wednesday, January 29, 2026

1. **Plan Created:**
   - `week_start` = "2026-01-26" (Sunday of this week)
   - Plan is stored with this date

2. **Weekly Review Scheduled:**
   - Every Sunday at 6:00 PM
   - Next notification: Sunday, Feb 2, 2026 at 6:00 PM
   - **Not** tied to when the plan was created

3. **Monthly Review Scheduled:**
   - 1st of every month at 9:00 AM
   - Next notification: February 1, 2026 at 9:00 AM
   - **Not** tied to when the plan was created

---

## Current Implementation

### Plan Date Calculation:
- Location: `app/onboarding.tsx` (line ~160)
- Location: `app/(tabs)/plan.tsx` (helper functions `getWeekStart()`)

### Review Scheduling:
- Location: `services/notifications.ts`
- Weekly: Sunday at 18:00 (6 PM)
- Monthly: Day 1 at 09:00 (9 AM)
- Session: Training days at 08:00 (8 AM)

---

## Notes

- The plan date (`week_start`) is used to:
  - Query which plan belongs to which week
  - Display the correct week in the calendar
  - Match session logs to the correct plan week

- Review scheduling is independent and:
  - Happens at fixed times regardless of plan creation
  - Can be rescheduled without affecting plan dates
  - Uses device's calendar system for triggers
