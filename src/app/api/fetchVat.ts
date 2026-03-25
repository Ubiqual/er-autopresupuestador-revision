'server-only';
'use server';

import prisma from '@/lib/prisma';

const fetchVat = async () => {
  const vat = await prisma.vAT.findFirst();
  if (!vat) {
    throw new Error('No vat found');
  }
  return vat;
};

export default fetchVat;
