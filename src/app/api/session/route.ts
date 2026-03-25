import prisma from '@/lib/prisma';
import { getSession } from '@auth0/nextjs-auth0';
import { NextResponse } from 'next/server';

export async function GET() {
  const session = await getSession();

  if (!session?.user?.email) {
    return NextResponse.json({ user: null });
  }

  let user = await prisma.user.findUnique({
    where: { email: session.user.email }
  });

  if (!user) {
    user = await prisma.user.create({
      data: { email: session.user.email }
    });
  }

  return NextResponse.json({ user });
}
