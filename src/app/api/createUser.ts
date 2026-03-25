'use server';

import prisma from '@/lib/prisma';
import { getSession } from '@auth0/nextjs-auth0';
import type { User } from '@prisma/client';

export const findOrCreateUser = async (): Promise<User | null> => {
  const session = await getSession();

  if (!session?.user?.email) {
    return null;
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: session.user.email }
  });

  if (!existingUser) {
    return await prisma.user.create({
      data: {
        email: session.user.email
      }
    });
  }

  return existingUser;
};
