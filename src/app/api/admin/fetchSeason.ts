import prisma from '@/lib/prisma';

export function fetchSeason(travelDateUTC: Date) {
  return prisma.season.findFirst({
    where: {
      seasonDays: {
        some: {
          day: travelDateUTC
        }
      }
    }
  });
}
