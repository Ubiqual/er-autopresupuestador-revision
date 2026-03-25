import prisma from '@/lib/prisma';

export const fetchConfigureTrip = async () => {
  const data = await prisma.configureTrips.findFirst();
  return data;
};
