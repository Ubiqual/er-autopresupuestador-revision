export function convertToUTC(dateString: string): Date {
  // Split the date and time parts
  const [datePart, timePart] = dateString.split(' ');

  // Construct the ISO string by appending 'Z' for UTC
  const isoString = `${datePart}T${timePart}:00.000Z`;

  // Create a new Date object from the ISO string
  return new Date(isoString);
}
