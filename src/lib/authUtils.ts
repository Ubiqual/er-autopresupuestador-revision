import prisma from '@/lib/prisma';
import { getSession } from '@auth0/nextjs-auth0';
import { UserRole } from '@prisma/client';

export const checkAdminPermission = async () => {
  const session = await getSession();
  if (!session || !session.user) {
    throw new Error('Not authenticated');
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  });

  if (!user || user.role !== UserRole.ADMIN) {
    throw new Error('Forbidden: You do not have the necessary permissions');
  }

  return user;
};
