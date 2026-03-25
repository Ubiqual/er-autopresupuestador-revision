'use server';

import prisma from '@/lib/prisma';
import { UserType } from '@prisma/client';

export async function updateUserData(data: {
  email: string;
  fullName: string;
  address: string;
  postalCode: string;
  city: string;
  province: string;
  country: string;
  phone: string;
  docId: string;
  contacto?: string;
}) {
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email }
  });

  if (existingUser) {
    const updatedUser = await prisma.user.update({
      where: { email: data.email },
      data: {
        fullName: data.fullName,
        address: data.address,
        postalCode: data.postalCode,
        city: data.city,
        province: data.province,
        country: data.country,
        phone: data.phone,
        docId: data.docId,
        userType: data.contacto ? UserType.COMPANY : UserType.PERSONAL,
        ...(data.contacto ? { contacto: data.contacto } : {})
      }
    });
    return updatedUser;
  } else {
    const newUser = await prisma.user.create({
      data: {
        email: data.email,
        fullName: data.fullName,
        address: data.address,
        postalCode: data.postalCode,
        city: data.city,
        province: data.province,
        country: data.country,
        phone: data.phone,
        docId: data.docId,
        userType: data.contacto ? UserType.COMPANY : UserType.PERSONAL,
        ...(data.contacto ? { contacto: data.contacto } : {})
      }
    });

    return newUser;
  }
}

export default updateUserData;
