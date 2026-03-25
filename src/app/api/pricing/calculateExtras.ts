import prisma from '@/lib/prisma';
import type { DailyStops } from '@/types/searchedTrips';
import type { SegmentPricing } from '@/types/TravelCalculations';
import { calculateDrivingSessionsHotelStay } from '@/utils/calculateHotelStay';
import { calculateDailyMeals, parseLocalTime } from '@/utils/calculateMeals';
import { calculateRestPeriods } from '@/utils/calculateRestPeriods';
import { convertDurationToMinutes } from '@/utils/convertDrivingToMinutes';
import { convertToUTC } from '@/utils/convertStringToUTC';
import { t } from '@/utils/i18n';
import type { Extra } from '@prisma/client';
import { add, differenceInMinutes, sub } from 'date-fns';
import { fetchAllExtras } from '../admin/fetchAllExtras';
import { fetchRestHours } from '../admin/fetchRestHours';
import { checkWeddingNightExtra } from './utils/checkWeedingNIghtExtra';

export type AllExtras = {
  hotelStay?: Extra | null;
  diet?: Extra | null;
  meals: {
    lunch?: Extra;
    dinner?: Extra;
  };
  transfer?: Extra[] | null;
};
export async function calculateExtras({
  time,
  totalDuration,
  totalDrivingDuration,
  date,
  serviceName,
  isInMadrid,
  isWithinSpainPortugalAndorra,
  dayCount,
  currentDayIndex,
  dailyStopsOfPreviousDay,
  segments
}: {
  time: string;
  startLocation: string;
  dropOffLocation: string;
  totalDuration: { hours: number; minutes: number; seconds: number };
  totalDrivingDuration: { hours: number; minutes: number; seconds: number };
  date: Date;
  serviceName: string;
  isInMadrid: boolean;
  isWithinSpainPortugalAndorra: boolean;
  dayCount: number;
  currentDayIndex: number;
  dailyStopsOfPreviousDay: DailyStops;
  segments: SegmentPricing[];
}) {
  const parsedTime = parseLocalTime(time, date);

  const applicableExtras: Extra[] = [];

  const totalDrivingMinutes = convertDurationToMinutes(totalDuration);
  const restHours = await fetchRestHours();
  const allExtras = await fetchAllExtras(
    isInMadrid,
    isWithinSpainPortugalAndorra,
    parsedTime,
    serviceName,
    totalDrivingMinutes
  );
  const drivingTimeLimitInMinutes = restHours && restHours.fullDayDriving * 60;
  const restDurationInHours = restHours && restHours.fullDayRest;

  if (!drivingTimeLimitInMinutes || !restDurationInHours) {
    return new Error(t('errors.restHoursFetchError'));
  }
  if (serviceName.toLowerCase() === 'viajes') {
    const mealNames: string[] = [];
    const hotelNames: string[] = [];
    let dietOption;

    const applyableExtras = [];

    if (dayCount > 1 && (currentDayIndex === 0 || currentDayIndex === dayCount - 1)) {
      const restPeriods = calculateRestPeriods(
        convertDurationToMinutes(totalDrivingDuration),
        drivingTimeLimitInMinutes,
        restDurationInHours
      );
      const adjustedTime = sub(parsedTime, { hours: restPeriods });
      if (currentDayIndex === 0) {
        if (convertDurationToMinutes(totalDrivingDuration) > drivingTimeLimitInMinutes) {
          await calculateDrivingSessionsHotelStay({
            currentDate: adjustedTime,
            remainingDrivingMinutes: convertDurationToMinutes(totalDrivingDuration),
            drivingTimeLimitInMinutes,
            restDurationInHours,
            allExtras,
            applicableExtras
          });
          calculateDailyMeals(adjustedTime, segments[0].duration / 60 + restPeriods * 60, allExtras, applicableExtras);
        } else if (convertDurationToMinutes(totalDuration) > restHours!.excursionsLimit * 60) {
          const restPeriods = calculateRestPeriods(
            convertDurationToMinutes(totalDuration),
            restHours!.excursionsLimit * 60,
            restDurationInHours
          );
          const adjustedTime = sub(parsedTime, { hours: restPeriods });

          await calculateDrivingSessionsHotelStay({
            currentDate: adjustedTime,
            remainingDrivingMinutes: convertDurationToMinutes(totalDuration),
            drivingTimeLimitInMinutes: restHours!.excursionsLimit * 60,
            restDurationInHours,
            allExtras,
            applicableExtras
          });

          calculateDailyMeals(adjustedTime, segments[0].duration / 60 + restPeriods * 60, allExtras, applicableExtras);
        } else {
          calculateDailyMeals(parsedTime, segments[0].duration / 60 + restPeriods * 60, allExtras, applicableExtras);
        }
      } else if (currentDayIndex === dayCount - 1) {
        if (convertDurationToMinutes(totalDrivingDuration) > drivingTimeLimitInMinutes) {
          await calculateDrivingSessionsHotelStay({
            currentDate: parsedTime,
            remainingDrivingMinutes: convertDurationToMinutes(totalDrivingDuration),
            drivingTimeLimitInMinutes,
            restDurationInHours,
            allExtras,
            applicableExtras
          });
          calculateDailyMeals(
            add(convertToUTC(dailyStopsOfPreviousDay.pickup.time ?? ''), { hours: 24 }),
            differenceInMinutes(
              add(parsedTime, { minutes: convertDurationToMinutes(totalDuration) + restPeriods * 60 }),
              add(convertToUTC(dailyStopsOfPreviousDay.pickup.time ?? ''), { hours: 24 })
            ),
            allExtras,
            applicableExtras
          );
        } else if (convertDurationToMinutes(totalDuration) > restHours!.excursionsLimit * 60) {
          const restPeriods = calculateRestPeriods(
            convertDurationToMinutes(totalDuration),
            restHours!.excursionsLimit * 60,
            restDurationInHours
          );

          await calculateDrivingSessionsHotelStay({
            currentDate: parsedTime,
            remainingDrivingMinutes: convertDurationToMinutes(totalDuration),
            drivingTimeLimitInMinutes: restHours!.excursionsLimit * 60,
            restDurationInHours,
            allExtras,
            applicableExtras
          });
          calculateDailyMeals(
            add(convertToUTC(dailyStopsOfPreviousDay.pickup.time ?? ''), { hours: 24 }),
            differenceInMinutes(
              add(parsedTime, { minutes: convertDurationToMinutes(totalDuration) + restPeriods * 60 }),
              add(convertToUTC(dailyStopsOfPreviousDay.pickup.time ?? ''), { hours: 24 })
            ),
            allExtras,
            applicableExtras
          );
        } else {
          calculateDailyMeals(
            add(convertToUTC(dailyStopsOfPreviousDay.pickup.time ?? ''), { hours: 24 }),
            differenceInMinutes(
              add(parsedTime, { minutes: convertDurationToMinutes(totalDuration) + restPeriods * 60 }),
              add(convertToUTC(dailyStopsOfPreviousDay.pickup.time ?? ''), { hours: 24 })
            ),
            allExtras,
            applicableExtras
          );
        }
      } else {
        calculateDailyMeals(
          add(convertToUTC(dailyStopsOfPreviousDay.pickup.time ?? ''), { hours: 24 }),
          differenceInMinutes(
            add(parsedTime, { minutes: convertDurationToMinutes(totalDuration) + restPeriods * 60 }),
            add(convertToUTC(dailyStopsOfPreviousDay.pickup.time ?? ''), { hours: 24 })
          ),
          allExtras,
          applicableExtras
        );
        await calculateDrivingSessionsHotelStay({
          currentDate: parsedTime,
          remainingDrivingMinutes: convertDurationToMinutes(totalDrivingDuration),
          drivingTimeLimitInMinutes,
          restDurationInHours,
          allExtras,
          applicableExtras
        });
      }

      applyableExtras.push({ name: 'Equipaje' });
    } else if (dayCount === 1 && currentDayIndex === 0) {
      const restPeriods = calculateRestPeriods(
        convertDurationToMinutes(totalDrivingDuration),
        drivingTimeLimitInMinutes,
        restDurationInHours
      );
      await calculateDrivingSessionsHotelStay({
        currentDate: parsedTime,
        remainingDrivingMinutes: convertDurationToMinutes(totalDrivingDuration),
        drivingTimeLimitInMinutes,
        restDurationInHours,
        allExtras,
        applicableExtras
      });

      const featureAdjustedTime = add(parsedTime, {
        minutes: convertDurationToMinutes(totalDrivingDuration)
      });
      calculateDailyMeals(featureAdjustedTime, restPeriods * 60, allExtras, applicableExtras);
      applyableExtras.push({ name: 'Equipaje' });
    }

    if (isInMadrid) {
      if ((currentDayIndex > 0 && currentDayIndex < dayCount - 1) || currentDayIndex === 0) {
        mealNames.push('Comida en Comunidad de Madrid', 'Cena en Comunidad de Madrid');
      }
      if (currentDayIndex < dayCount - 1) {
        dietOption = 'Dieta Complementaria Viaje';
        hotelNames.push('Alojamiento y desayuno España');
      }
    } else if (isWithinSpainPortugalAndorra) {
      if ((currentDayIndex > 0 && currentDayIndex < dayCount - 1) || currentDayIndex === 0) {
        mealNames.push('Comida en España, Portugal y Andorra', 'Cena en España, Portugal y Andorra');
      }
      if (currentDayIndex < dayCount - 1) {
        dietOption = 'Dieta Complementaria Viaje';
        hotelNames.push('Alojamiento y desayuno España');
      }
    } else {
      if ((currentDayIndex > 0 && currentDayIndex < dayCount - 1) || currentDayIndex === 0) {
        mealNames.push('Comida Internacional', 'Cena Internacional');
      }
      if (currentDayIndex < dayCount - 1) {
        dietOption = 'Dieta Complementaria Viaje';
        hotelNames.push('Alojamiento Internacional');
      }
    }

    applyableExtras.push({ name: { in: hotelNames } }, { name: dietOption }, { name: { in: mealNames } });

    const extras = await prisma.extra.findMany({
      where: {
        OR: applyableExtras
      }
    });

    if (dayCount === 1 && currentDayIndex === 0) {
      const equipajeExtra = extras.find((extra) => extra.name === 'Equipaje');
      if (equipajeExtra) {
        extras.push({ ...equipajeExtra }); // Duplicate "Equipaje"
      }
    }
    // Add one hotel stay and diet per day for trips
    applicableExtras.push(...extras); // Add all extras;
  } else {
    const restPeriods = calculateRestPeriods(
      convertDurationToMinutes(totalDrivingDuration),
      drivingTimeLimitInMinutes,
      restDurationInHours
    );

    if (convertDurationToMinutes(totalDrivingDuration) > drivingTimeLimitInMinutes) {
      await calculateDrivingSessionsHotelStay({
        currentDate: parsedTime,
        remainingDrivingMinutes: convertDurationToMinutes(totalDrivingDuration),
        drivingTimeLimitInMinutes,
        restDurationInHours,
        allExtras,
        applicableExtras
      });
      calculateDailyMeals(parsedTime, totalDrivingMinutes + restPeriods * 60, allExtras, applicableExtras);
    } else if (
      convertDurationToMinutes(totalDuration) > restHours!.excursionsLimit * 60 &&
      serviceName.toLowerCase() === 'excursiones'
    ) {
      const restPeriods = calculateRestPeriods(
        convertDurationToMinutes(totalDuration),
        restHours!.excursionsLimit * 60,
        restDurationInHours
      );
      await calculateDrivingSessionsHotelStay({
        currentDate: parsedTime,
        remainingDrivingMinutes: convertDurationToMinutes(totalDuration),
        drivingTimeLimitInMinutes: restHours!.excursionsLimit * 60,
        restDurationInHours,
        allExtras,
        applicableExtras
      });

      calculateDailyMeals(parsedTime, totalDrivingMinutes + restPeriods * 60, allExtras, applicableExtras);
    } else {
      calculateDailyMeals(parsedTime, totalDrivingMinutes + restPeriods * 60, allExtras, applicableExtras);
    }

    checkIfIsTransfer(allExtras, applicableExtras);
    // Perform "Nocturnidad Boda" check if applicable
    await checkWeddingNightExtra(serviceName, parsedTime, totalDrivingMinutes + restPeriods * 60, applicableExtras);
  }

  return applicableExtras;
}

function checkIfIsTransfer(allExtras: AllExtras, applicableExtras: Extra[]) {
  if (!allExtras?.transfer) {
    return;
  }
  allExtras.transfer.map((extra) => {
    applicableExtras.push(extra);
  });
}
