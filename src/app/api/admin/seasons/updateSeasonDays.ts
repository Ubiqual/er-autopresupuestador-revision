'use server';

import prisma from '@/lib/prisma';

export const updateSeasonDays = async (seasonId: string, addedDates: Date[], removedDates: Date[]) => {
  try {
    if (removedDates.length > 0) {
      await prisma.seasonDay.deleteMany({
        where: {
          day: {
            in: removedDates
          }
        }
      });
    }

    if (addedDates.length > 0) {
      const upsertOperations = addedDates.map((date) => {
        return prisma.seasonDay.upsert({
          where: {
            day: date
          },
          update: {
            seasonId: seasonId
          },
          create: {
            day: date,
            seasonId: seasonId
          }
        });
      });

      await prisma.$transaction(upsertOperations);
    }

    const updatedSeasonDays = await prisma.seasonDay.findMany();

    return { success: true, data: updatedSeasonDays };
  } catch (error) {
    return { success: false, error: error };
  }
};
