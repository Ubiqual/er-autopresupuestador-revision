'server-only';
'use server';
import type { BookingsTableTypeProps } from '@/components/BookingsTable/BookingsTable';
import prisma from '@/lib/prisma';

interface FetchBookingsParams {
  page?: number;
  limit?: number;
  serviceTypes?: string[];
  bookingTypes?: string[];
  budgetStartDate?: Date | null;
  budgetEndDate?: Date | null;
  serviceStartDate?: Date | null;
  serviceEndDate?: Date | null;
  email?: string;
}

type CountResult = { total: number }[];

export async function fetchAllBookings({
  page = 1,
  limit = 10,
  serviceTypes = [],
  bookingTypes = [],
  budgetStartDate = null,
  budgetEndDate = null,
  serviceStartDate = null,
  serviceEndDate = null,
  email
}: FetchBookingsParams = {}) {
  const skip = (page - 1) * limit;

  const conditions: string[] = [];
  const params: (string | number | Date)[] = [];

  if (email) {
    conditions.push(`u."email" = $${params.length + 1}`);
    params.push(email);
    conditions.push(`b."bookingType"::text != $${params.length + 1}`);
    params.push('admin_saved');
  }
  if (bookingTypes.length > 0) {
    const bookingTypeParams = bookingTypes.map((bt) => {
      params.push(bt);
      return `$${params.length}`;
    });
    conditions.push(`b."bookingType"::text IN (${bookingTypeParams.join(', ')})`);
  }

  if (serviceTypes.length > 0) {
    const serviceTypeParams = serviceTypes.map((st) => {
      params.push(st);
      return `$${params.length}`;
    });
    conditions.push(`b."serviceType" IN (${serviceTypeParams.join(', ')})`);
  }

  if (budgetStartDate && budgetEndDate) {
    const startOfDay = new Date(budgetStartDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(budgetEndDate);
    endOfDay.setHours(23, 59, 59, 999);

    conditions.push(`b."createdAt" BETWEEN $${params.length + 1} AND $${params.length + 2}`);
    params.push(startOfDay, endOfDay);
  }
  if (serviceStartDate && serviceEndDate) {
    const formatDate = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} 00:00:00`;
    const formatDateEnd = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} 23:59:59`;
    conditions.push(`b."date" BETWEEN $${params.length + 1} AND $${params.length + 2}`);
    params.push(formatDate(serviceStartDate), formatDateEnd(serviceEndDate));
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countQuery = `
    SELECT count(*) AS total
    FROM "Bookings" b
    LEFT JOIN "user" u ON b."userId" = u."id"
    ${whereClause};
  `;

  const dataQuery = `
    SELECT 
      to_jsonb(b) ||
      jsonb_build_object(
        'user', to_jsonb(u),
        'dailyStops', COALESCE(ds.dailyStops::jsonb, '[]'::jsonb),
        'buses', COALESCE(bs.buses::jsonb, '[]'::jsonb)
      ) AS booking
    FROM "Bookings" b
    LEFT JOIN "user" u ON b."userId" = u."id"
    LEFT JOIN (
      SELECT ds."tripId", json_agg(
        json_build_object(
          'id', ds."id",
          'dayIndex', ds."dayIndex",
          'pickup', ds."pickup",
          'dropoff', ds."dropoff",
          'intermediates', COALESCE(ds."intermediates"::jsonb, '[]'::jsonb)
        )
      ) AS dailyStops
      FROM "DailyStop" ds
      GROUP BY ds."tripId"
    ) ds ON b."id" = ds."tripId"
    LEFT JOIN (
      SELECT bs."tripId", json_agg(to_jsonb(bs)) AS buses
      FROM "BookingsSelectedBuses" bs
      GROUP BY bs."tripId"
    ) bs ON b."id" = bs."tripId"
    ${whereClause}
    ORDER BY b."createdAt" DESC
    LIMIT $${params.length + 1} OFFSET $${params.length + 2};
  `;

  params.push(limit, skip);

  const [countResult, dataResult] = await Promise.all([
    prisma.$queryRawUnsafe<CountResult>(countQuery, ...params.slice(0, params.length - 2)),
    prisma.$queryRawUnsafe<{ booking: BookingsTableTypeProps }[]>(dataQuery, ...params)
  ]);

  const totalBookings = countResult.length > 0 ? Number(countResult[0].total) : 0;
  const bookings = dataResult.map((row) => row.booking);

  return {
    bookings,
    total: totalBookings,
    totalPages: Math.ceil(totalBookings / limit),
    currentPage: page
  };
}
