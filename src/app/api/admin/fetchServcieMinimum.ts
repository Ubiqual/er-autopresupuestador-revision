import prisma from '@/lib/prisma';
export function fetchServiceMinimums(serviceName: string) {
  return prisma.serviceMinimumPricing.findFirst({
    where: { serviceName }
  });
}
