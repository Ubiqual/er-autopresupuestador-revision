export const getUserEmailFromCookie = (): string | null => {
  if (typeof document === 'undefined') {
    return null;
  }

  const userEmailEncoded = document.cookie
    .split('; ')
    .find((row) => row.startsWith('userEmail='))
    ?.split('=')[1];

  if (!userEmailEncoded) {
    return null;
  }

  return decodeURIComponent(userEmailEncoded);
};
