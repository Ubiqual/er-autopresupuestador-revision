export function formatTimestampToLocalISOString(timestamp: Date): string {
  const year = timestamp.getFullYear();
  const month = String(timestamp.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
  const date = String(timestamp.getDate()).padStart(2, '0');
  const hours = String(timestamp.getHours()).padStart(2, '0');
  const minutes = String(timestamp.getMinutes()).padStart(2, '0');
  const seconds = String(timestamp.getSeconds()).padStart(2, '0');
  const milliseconds = String(timestamp.getMilliseconds()).padStart(3, '0');

  // Construct the formatted string
  return `${year}-${month}-${date}T${hours}:${minutes}:${seconds}.${milliseconds}Z`;
}
