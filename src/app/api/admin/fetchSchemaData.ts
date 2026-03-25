import type { SchemaName } from '@/app/(isolated)/admin/[schema]/page';
import prisma from '@/lib/prisma';
import { fetchAllBookings } from './fetchAllBookings';

export const fetchSchemaData = async (schema: SchemaName) => {
  // @ts-expect-error: I couldn't fix the type error since it is connected to prisma and the code it works
  const model = prisma[schema];

  if (!model || typeof model.findMany !== 'function') {
    throw new Error(`Model not found or does not support findMany for schema: ${schema}`);
  }

  if (schema === 'SeasonDay') {
    const data = await model.findMany({
      include: {
        season: true
      }
    });

    return data;
  }

  if (schema === 'Bookings') {
    const bookings = fetchAllBookings();

    return bookings;
  }

  return await model.findMany();
};
