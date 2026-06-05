export const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function deriveTrend(values: string[]) {
  const up = values.filter((value) => value === "up").length;
  const down = values.filter((value) => value === "down").length;
  if (up > down) return "up" as const;
  if (down > up) return "down" as const;
  return "stable" as const;
}

export function calculateActiveWeeks(sessions: Array<{ start_time?: string }>): number {
  return new Set(
    sessions.map((session) => {
      const date = new Date(session.start_time || "");
      const week = new Date(date);
      week.setDate(date.getDate() - date.getDay());
      week.setHours(0, 0, 0, 0);
      return week.toISOString().slice(0, 10);
    })
  ).size;
}
