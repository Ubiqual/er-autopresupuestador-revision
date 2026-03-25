import prisma from '@/lib/prisma';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: { schemaType: string } }) {
  const modelToTableMap: Record<string, string> = {
    BaseAddress: 'base_address',
    BusType: 'bus_type',
    Service: 'service',
    BusCategory: 'bus_category',
    VAT: 'vat',
    RestHours: 'rest_hours',
    GoogleIncrement: 'google_increment',
    BaseCost: 'base_cost',
    Season: 'season',
    SeasonDay: 'season_day',
    BusyHours: 'busy_hours',
    NightHours: 'night_hours',
    ServiceMinimumPricing: 'service_minimum_pricing',
    Extra: 'extra',
    ConfigureTrips: 'configure_trips',
    ConfigureWeddings: 'configure_weddings',
    Bookings: 'Bookings'
  };

  const { schemaType } = params;

  if (!schemaType || typeof schemaType !== 'string') {
    return NextResponse.json({ error: 'Invalid schema type' }, { status: 400 });
  }

  const tableName = modelToTableMap[schemaType];

  if (!tableName) {
    return NextResponse.json({ error: `No table mapping found for model: ${schemaType}` }, { status: 400 });
  }

  try {
    const metadata = await prisma.$queryRaw<{ column_name: string; is_nullable: string }[]>`
      SELECT column_name, is_nullable
      FROM information_schema.columns
      WHERE table_name = ${tableName}
      AND column_name NOT IN ('id', 'createdAt', 'updatedAt')
      ORDER BY ordinal_position;
    `;
    if (schemaType === 'Extra') {
      const desiredOrder = ['name', 'price', 'startTime', 'endTime'];
      metadata.sort((a, b) => desiredOrder.indexOf(a.column_name) - desiredOrder.indexOf(b.column_name));
    }
    return NextResponse.json(metadata);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch metadata' }, { status: 500 });
  }
}
