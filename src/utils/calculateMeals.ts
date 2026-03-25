import type { AllExtras } from '@/app/api/pricing/calculateExtras';
import type { Extra } from '@prisma/client';
import { differenceInMinutes, isAfter, isBefore, max, min } from 'date-fns';

export function calculateDailyMeals(
  startDate: Date,
  totalTripMinutes: number,
  allExtras: AllExtras,
  applicableExtras: Extra[]
): void {
  let remainingMinutes = totalTripMinutes;
  let currentDate = new Date(startDate);

  while (remainingMinutes > 0) {
    const endOfDay = new Date(currentDate);
    endOfDay.setHours(23, 59, 59, 999);
    const minutesUntilEndOfDay = (endOfDay.getTime() - currentDate.getTime()) / 60000;

    const dailyDrivingMinutes = Math.min(remainingMinutes, minutesUntilEndOfDay);

    checkMealsForCurrentDay({ currentDate, drivingMinutes: dailyDrivingMinutes, allExtras, applicableExtras });

    remainingMinutes -= dailyDrivingMinutes;
    currentDate = new Date(endOfDay);
    currentDate.setHours(0, 0, 0, 0);
  }
}

function checkMealsForCurrentDay({
  currentDate,
  drivingMinutes,
  allExtras,
  applicableExtras
}: {
  currentDate: Date;
  drivingMinutes: number;
  allExtras: AllExtras;
  applicableExtras: Extra[];
}): void {
  const lunchExtra = getMealExtra({
    currentDate,
    drivingMinutes,
    mealOptions: allExtras.meals?.lunch,
    freeTimeRequired: 120
  });
  if (lunchExtra) {
    applicableExtras.push(lunchExtra);
  }

  const dinnerExtra = getMealExtra({
    currentDate,
    drivingMinutes,
    mealOptions: allExtras.meals?.dinner,
    freeTimeRequired: 60
  });
  if (dinnerExtra) {
    applicableExtras.push(dinnerExtra);
  }
}

function getMealExtra({
  currentDate,
  drivingMinutes,
  mealOptions,
  freeTimeRequired
}: {
  currentDate: Date;
  drivingMinutes: number;
  mealOptions?: Extra;
  freeTimeRequired: number;
}): Extra | null {
  if (!mealOptions) {
    return null;
  }

  const totalJobMinutes = drivingMinutes;

  if (mealOptions.startTime && mealOptions.endTime) {
    const [startHours, startMinutes] = mealOptions.startTime.split(':').map(Number);
    const [endHours, endMinutes] = mealOptions.endTime.split(':').map(Number);

    const mealStartHour = startHours + startMinutes / 60;
    const mealEndHour = endHours + endMinutes / 60;

    const hasFreeTimeForMeal = checkIfDriverHasFreeHour({
      startTime: currentDate,
      drivingDurationInMinutes: totalJobMinutes,
      startMealHour: mealStartHour,
      endMealHour: mealEndHour,
      freeTimeRequired
    });

    return hasFreeTimeForMeal ? null : mealOptions;
  }

  return null;
}

function checkIfDriverHasFreeHour({
  startTime,
  drivingDurationInMinutes,
  startMealHour,
  endMealHour,
  freeTimeRequired
}: {
  startTime: Date;
  drivingDurationInMinutes: number;
  startMealHour: number;
  endMealHour: number;
  freeTimeRequired: number;
}): boolean {
  const drivingEndTime = addMinutes(startTime, drivingDurationInMinutes);
  const mealStartTime = parseLocalTime(`${startMealHour}:00`, startTime);
  const mealEndTime = parseLocalTime(`${endMealHour}:00`, startTime);

  if (isBefore(drivingEndTime, mealStartTime) || isAfter(startTime, mealEndTime)) {
    return true;
  }

  const overlapStart = max([startTime, mealStartTime]);
  const overlapEnd = min([drivingEndTime, mealEndTime]);
  const overlappingMinutes = differenceInMinutes(overlapEnd, overlapStart);

  const mealWindowDuration = differenceInMinutes(mealEndTime, mealStartTime);
  const freeMinutes = mealWindowDuration - overlappingMinutes;

  return freeMinutes >= freeTimeRequired;
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60000);
}

export function parseLocalTime(time: string, date: Date): Date {
  const [hours, minutes] = time.split(':').map(Number);
  const now = new Date(date);
  const localDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
  const offsetInMs = now.getTimezoneOffset() * 60 * 1000;

  return new Date(localDate.getTime() - offsetInMs);
}
