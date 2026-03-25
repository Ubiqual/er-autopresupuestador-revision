import type { Extra } from '@prisma/client';
import { PrismaClient } from '@prisma/client';
import { differenceInMinutes, isAfter, isBefore, max, min } from 'date-fns';

const prisma = new PrismaClient();

export async function checkWeddingNightExtra(
  serviceName: string,
  startTime: Date,
  totalMinutes: number,
  applicableExtras: Extra[]
): Promise<void> {
  if (serviceName.toLowerCase() !== 'bodas') {
    return; // Only applicable for weddings
  }
  const nocturnidadExtra = await prisma.extra.findFirst({
    where: {
      name: 'Nocturnidad Boda'
    }
  });
  // Check if wedding overlaps 22:00 (threshold 22:00-23:59)
  const overlapsNight = checkTimeOverlap(
    startTime,
    totalMinutes,
    nocturnidadExtra!.startTime ?? '',
    nocturnidadExtra!.endTime ?? ''
  );
  if (overlapsNight) {
    if (nocturnidadExtra) {
      applicableExtras.push(nocturnidadExtra);
    }
  }
}

// Utility function for time overlap
function checkTimeOverlap(
  startTime: Date,
  durationInMinutes: number,
  thresholdHourStart: string,
  thresholdHourEnd: string
): boolean {
  const eventEndTime = addMinutes(startTime, durationInMinutes);

  const thresholdStartTime = parseLocalTime(thresholdHourStart, startTime);
  const thresholdEndTime = parseLocalTime(thresholdHourEnd, startTime);
  // Check if the event overlaps with the threshold window
  if (isBefore(eventEndTime, thresholdStartTime) || isAfter(startTime, thresholdEndTime)) {
    return false;
  }

  const overlapStart = max([startTime, thresholdStartTime]);
  const overlapEnd = min([eventEndTime, thresholdEndTime]);

  const overlappingMinutes = differenceInMinutes(overlapEnd, overlapStart);

  return overlappingMinutes > 0; // True if there is an overlap
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60000);
}

function parseLocalTime(time: string, date: Date): Date {
  const [hours, minutes] = time.split(':').map(Number);
  const now = new Date(date);
  const localDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
  const offsetInMs = now.getTimezoneOffset() * 60 * 1000;

  return new Date(localDate.getTime() - offsetInMs);
}
