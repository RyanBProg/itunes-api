export function getDayName(date?: string): string {
  const dayNames = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];

  const d = date ? new Date(date) : new Date();

  if (isNaN(d.getTime())) {
    throw new Error(`Invalid date string: "${date}"`);
  }

  return dayNames[d.getDay()];
}
