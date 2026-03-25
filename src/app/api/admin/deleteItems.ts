'use server';
import type { SchemaName } from '@/app/(isolated)/admin/[schema]/page';
import type { SchemaData } from '@/components/SchemaManager/SchemaPopover/SchemaPopover';
import { checkAdminPermission } from '@/lib/authUtils';
import prisma from '@/lib/prisma';

export const deleteSchemaItem = async ({ schema, data }: { schema: SchemaName; data: SchemaData }) => {
  try {
    await checkAdminPermission();

    // @ts-expect-error: I couldn't fix the type error since it is connected to prisma and the code it works
    const model = prisma[schema];
    if (!model || typeof model.delete !== 'function') {
      return { success: false, error: `Model not found or does not support delete for schema: ${schema}` };
    }

    await model.delete({
      where: { id: data.id }
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: error };
  }
};
