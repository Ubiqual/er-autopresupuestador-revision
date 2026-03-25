import { PrismaClient } from '@prisma/client';
import { readReplicas } from '@prisma/extension-read-replicas';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const prisma = new PrismaClient({ log: ['info'] }).$extends(
  readReplicas({
    url: [process.env.POSTGRES_PRISMA_URL_REPLICA!]
  })
);

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma as unknown as PrismaClient;
}

export default prisma;
