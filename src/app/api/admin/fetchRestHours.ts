import prisma from '@/lib/prisma';

export const fetchRestHours = async () => {
  const data = await prisma.restHours.findFirst();
  return data;
};
