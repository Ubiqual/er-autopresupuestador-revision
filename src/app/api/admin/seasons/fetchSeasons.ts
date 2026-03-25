'use server';

import prisma from '@/lib/prisma';

export const fetchSeasons = async () => {
  try {
    const seasons = await prisma.season.findMany();
    return { success: true, data: seasons };
  } catch (error) {
    return { success: false, error: error };
  }
};
