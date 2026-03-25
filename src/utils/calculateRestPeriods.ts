export function calculateRestPeriods(
  remainingDrivingMinutes: number,
  drivingTimeLimitInMinutes: number,
  restDurationInHours: number,
  restPeriodsCount: number = 0
): number {
  if (remainingDrivingMinutes <= 0) {
    // Base case: no more driving time left
    return restPeriodsCount * restDurationInHours;
  }

  // Calculate driving time for this session (limited by the driving time limit)
  const currentDrivingMinutes = Math.min(remainingDrivingMinutes, drivingTimeLimitInMinutes);
  remainingDrivingMinutes -= currentDrivingMinutes;

  // If there are still minutes left, increment the rest period count and subtract the rest time
  if (remainingDrivingMinutes > 0) {
    return calculateRestPeriods(
      remainingDrivingMinutes - restDurationInHours * 60,
      drivingTimeLimitInMinutes,
      restDurationInHours,
      restPeriodsCount + 1
    );
  }

  // Final return for the rest periods
  return restPeriodsCount * restDurationInHours;
}
