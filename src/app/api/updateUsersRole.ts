'use server';

import prisma from '@/lib/prisma';
import type { UserRole } from '@prisma/client';

export const getUsers = async (page: number, limit: number, searchQuery: string, roleFilter: string) => {
  return await prisma.user.findMany({
    skip: (page - 1) * limit,
    take: limit,
    where: {
      email: { contains: searchQuery, mode: 'insensitive' },
      role: roleFilter ? (roleFilter as UserRole) : undefined
    }
  });
};

export const getUsersCount = async (searchQuery: string, roleFilter: string) => {
  return await prisma.user.count({
    where: {
      email: { contains: searchQuery, mode: 'insensitive' },
      role: roleFilter ? (roleFilter as UserRole) : undefined
    }
  });
};

export const updateUserRole = async (email: string, newRole: UserRole) => {
  return await prisma.user.update({
    where: { email },
    data: { role: newRole }
  });
};

export const deleteUserRole = async (email: string) => {
  return await prisma.user.update({
    where: { email },
    data: { role: 'USER' }
  });
};

export const getUserByEmail = async (email: string) => {
  return await prisma.user.findUnique({
    where: { email }
  });
};
