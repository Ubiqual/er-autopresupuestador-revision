import prisma from '@/lib/prisma';
import { parseLocalTime } from '@/utils/calculateMeals';
import { addMinutes, isAfter, isBefore } from 'date-fns';

export async function fetchAllExtras(
  isInMadrid: boolean,
  isWithinSpainPortugalAndorra: boolean,
  transferTime: Date, // New argument to determine if it's day or night transfer
  serviceName: string, // New argument to check the service name
  totalDrivingMinutes: number
) {
  // Create an array to hold the relevant meal, hotel, and transfer options based on location
  const mealNames: string[] = [];
  const hotelNames: string[] = [];
  const transferNames: string[] = [];

  // Add meal and hotel options based on the conditions
  if (isInMadrid) {
    mealNames.push('Comida en Comunidad de Madrid', 'Cena en Comunidad de Madrid');
    hotelNames.push('Alojamiento y desayuno España');
  } else if (isWithinSpainPortugalAndorra) {
    mealNames.push('Comida en España, Portugal y Andorra', 'Cena en España, Portugal y Andorra');
    hotelNames.push('Alojamiento y desayuno España');
  } else {
    mealNames.push('Comida Internacional', 'Cena Internacional');
    hotelNames.push('Alojamiento Internacional');
  }

  const dietOption = isInMadrid ? null : 'Dieta Complementaria Viaje';

  // Check if the service is Transfer aeropuerto or Transfer tren
  if (serviceName === 'Transfer aeropuerto' || serviceName === 'Transfer tren') {
    const drivingEndTime = addMinutes(transferTime, totalDrivingMinutes);
    const transferExtras = await prisma.extra.findMany({
      where: {
        name: { in: ['Transfer Diurno', 'Transfer Nocturno'] }
      }
    });
    const dayStartTime = parseLocalTime(transferExtras[0].startTime || '', transferTime);
    const nightStartTime = parseLocalTime(transferExtras[1].startTime || '', transferTime);
    const isDayTransfer = isAfter(transferTime, dayStartTime) && isBefore(drivingEndTime, nightStartTime);

    if (isDayTransfer) {
      transferNames.push('Transfer Diurno');
    } else {
      transferNames.push('Transfer Nocturno');
    }
  }

  const extras = await prisma.extra.findMany({
    where: {
      OR: [
        { name: { in: hotelNames } },
        { name: dietOption ? dietOption : undefined },
        { name: { in: mealNames } },
        { name: { in: transferNames } } // Include transfer extras only if applicable
      ]
    }
  });

  return {
    hotelStay: extras.find((extra) => hotelNames.includes(extra.name)) || undefined,
    diet: dietOption ? extras.find((extra) => extra.name === dietOption) || undefined : undefined,
    meals: {
      lunch: extras.find((extra) => extra.name === mealNames.find((name) => name.includes('Comida'))) || undefined,
      dinner: extras.find((extra) => extra.name === mealNames.find((name) => name.includes('Cena'))) || undefined
    },
    transfer: extras.filter((extra) => transferNames.includes(extra.name)) || [] // Return an // Add transfer extra if applicable
  };
}
