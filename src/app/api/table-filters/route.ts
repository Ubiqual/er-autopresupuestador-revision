import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

type ConfigResponse = {
  services: Array<{
    id: string;
    name: string;
  }>;
  vat: number;
};

export async function GET(): Promise<NextResponse<ConfigResponse>> {
  const services = await prisma.service.findMany();

  const vatRow = await prisma.vAT.findFirst();
  const vat = vatRow?.rate ?? 0;

  return NextResponse.json({ services, vat });
}
