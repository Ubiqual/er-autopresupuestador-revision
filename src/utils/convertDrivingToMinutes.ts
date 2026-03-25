export function convertDurationToMinutes(duration: {
  days?: number;
  hours: number;
  minutes?: number;
  seconds?: number;
}) {
  const daysToMinutes = (duration.days ?? 0) * 24 * 60;
  const hoursInMinutes = (duration.hours ?? 0) * 60;
  const minutes = duration.minutes ?? 0;
  const seconds = duration.seconds ?? 0;

  return daysToMinutes + hoursInMinutes + minutes + seconds / 60;
}
