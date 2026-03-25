'use server';

import type { SchemaName } from '@/app/(isolated)/admin/[schema]/page';
import type { SchemaData } from '@/components/SchemaManager/SchemaPopover/SchemaPopover';
import { checkAdminPermission } from '@/lib/authUtils';
import prisma from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

export const createOrUpdateItem = async ({ schema, data }: { schema: SchemaName; data: SchemaData }) => {
  try {
    await checkAdminPermission();
    // @ts-expect-error: I couldn't fix the type error since it is connected to prisma and the code it works
    const model = prisma[schema];

    if (schema === 'BusType') {
      const busTypeData = data as Prisma.BusTypeCreateInput;

      if (busTypeData.isDefault) {
        await model.updateMany({
          where: { isDefault: true },
          data: { isDefault: false }
        });
      }
    }

    await model.upsert({
      where: { id: data?.id || '' },
      create: { ...data },
      update: { ...data }
    });

    const allItems = await model.findMany();

    return { success: true, result: allItems };
  } catch (error) {
    return { success: false, error: error };
  }
};
