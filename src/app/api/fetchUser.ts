'use server';

import prisma from '@/lib/prisma';

const fetchUserData = async (email: string) => {
  const user = await prisma.user.findUnique({
    where: {
      email: email
    }
  });
  if (!user) {
    throw new Error('No user found');
  }
  return user;
};

export default fetchUserData;
