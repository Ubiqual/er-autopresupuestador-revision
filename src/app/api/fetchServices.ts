'server-only';
'use server';

import prisma from '@/lib/prisma';

const fetchServices = async () => {
  const services = await prisma.service.findMany({
    orderBy: {
      order: 'asc'
    }
  });
  if (!services) {
    throw new Error('No services found');
  }
  return services;
};

export default fetchServices;
