import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  const googleIncrement = await prisma.googleIncrement.findFirst();

  if (!googleIncrement) {
    return NextResponse.json({ error: 'Google Increment not found' }, { status: 404 });
  }

  return NextResponse.json({ adjustmentPercentage: googleIncrement.adjustmentPercentage });
}
