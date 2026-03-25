import prisma from '@/lib/prisma';

export const fetchConfigureWeddings = async () => {
  const data = await prisma.configureWeddings.findFirst();
  return data;
};
