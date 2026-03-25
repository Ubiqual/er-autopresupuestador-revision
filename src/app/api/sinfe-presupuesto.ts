'use server';

import { SINFE_URL } from '@/utils/constants';

export async function sinfePresupuesto(presuBody: string) {
  const SINFE_AUTH = process.env.SINFE_AUTH!;

  const res = await fetch(SINFE_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SINFE_AUTH}`,
      'Content-Type': 'application/json'
    },
    body: presuBody
  });

  if (!res.ok) {
    return { success: false, error: res.statusText };
  }
  return { success: true };
}
