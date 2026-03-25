import type { AllExtras } from '@/app/api/pricing/calculateExtras';
import type { Extra } from '@prisma/client';
import { addHours, addMinutes } from 'date-fns';

export async function calculateDrivingSessionsHotelStay({
  currentDate,
  remainingDrivingMinutes,
  drivingTimeLimitInMinutes,
  restDurationInHours,
  allExtras,
  applicableExtras
}: {
  currentDate: Date;
  remainingDrivingMinutes: number;
  drivingTimeLimitInMinutes: number;
  restDurationInHours: number;
  allExtras: AllExtras;
  applicableExtras: Extra[];
}): Promise<void> {
  if (remainingDrivingMinutes <= 0) {
    return;
  }

  // Calculate how much the driver will drive in this cycle (limited by the driving limit)
  const currentDrivingMinutes = Math.min(remainingDrivingMinutes, drivingTimeLimitInMinutes);

  const updatedRemainingDrivingMinutes = remainingDrivingMinutes - currentDrivingMinutes;

  const newCurrentDate = addMinutes(currentDate, currentDrivingMinutes);

  // If there are still minutes left to drive, add hotel stay and diet extras, and proceed to the next session
  if (updatedRemainingDrivingMinutes > 0) {
    // Add hotel stay extra
    if (allExtras.hotelStay) {
      applicableExtras.push(allExtras.hotelStay);
    }

    // Add diet extra if not in Madrid
    if (allExtras.diet) {
      applicableExtras.push(allExtras.diet);
    }

    const restPeriodDate = addHours(newCurrentDate, restDurationInHours);

    // Recursively calculate the next driving session
    await calculateDrivingSessionsHotelStay({
      currentDate: restPeriodDate,
      remainingDrivingMinutes: updatedRemainingDrivingMinutes,
      drivingTimeLimitInMinutes,
      restDurationInHours,
      allExtras,
      applicableExtras
    });
  }
}
