import { fetchSchemaData } from '@/app/api/admin/fetchSchemaData';
import SchemaManager from '@/components/SchemaManager/SchemaManager'; // Adjust the import path
import type { FullBookingsType } from '@/types/searchedTrips';
import { extractMetadata } from '@/utils/metadata';
import type { BaseAddress, BaseCost, BusCategory, BusType, Season, SeasonDay, Service } from '@prisma/client';
import { notFound } from 'next/navigation';

type ModelDataMap = {
  BaseAddress: BaseAddress[];
  BusType: BusType[];
  Service: Service[];
  BusCategory: BusCategory[];
  Season: Season[];
  SeasonDay: SeasonDay[];
  BaseCost: BaseCost[];
  Bookings: FullBookingsType[];
};

export type SchemaName = keyof ModelDataMap;

export default async function AdminSchemaPage({
  params,
  searchParams
}: {
  params: { schema: SchemaName };
  searchParams: { [key: string]: string };
}) {
  const schema = params.schema;
  const metadata = extractMetadata();
  const schemaMetadata = metadata[schema];

  if (!schemaMetadata) {
    notFound();
  }

  const data = await fetchSchemaData(schema);

  if (!data) {
    notFound();
  }
  const actions = ['create', 'edit', 'delete'].filter(
    (action) => searchParams[`can${action.charAt(0).toUpperCase() + action.slice(1)}`] === 'true'
  );

  return (
    <SchemaManager
      schemaType={schema}
      schemaTitle={schemaMetadata.title}
      data={data as ModelDataMap[typeof schema]}
      actions={actions}
    />
  );
}
