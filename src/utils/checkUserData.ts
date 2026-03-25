import { UserType, type User } from '@prisma/client';

export function checkUserData(user: User | null): boolean {
  if (!user) {
    return false;
  }

  const hasBaseData =
    Boolean(user.fullName) &&
    Boolean(user.address) &&
    Boolean(user.postalCode) &&
    Boolean(user.city) &&
    Boolean(user.province) &&
    Boolean(user.country) &&
    Boolean(user.docId) &&
    Boolean(user.phone);

  if (user.userType === UserType.COMPANY) {
    return hasBaseData && Boolean(user.contacto);
  }

  return hasBaseData;
}
