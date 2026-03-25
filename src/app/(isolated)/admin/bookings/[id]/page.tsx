import { fetchBookingDetails } from '@/app/api/admin/fetchBookingDetails';
import { fetchConfigureWeddings } from '@/app/api/admin/fetchConfigureWeddings';
import { fetchRestHours } from '@/app/api/admin/fetchRestHours';
import { fetchSchemaData } from '@/app/api/admin/fetchSchemaData';
import { BookingDetailsPage } from '@/components/BookingDetails/BookingDetails';
import { notFound } from 'next/navigation';

export default async function Page({ params: { id } }: { params: { id: string } }) {
  const booking = await fetchBookingDetails(id);

  const [restHours, weddingLimit, busTypes] = await Promise.all([
    fetchRestHours(),
    fetchConfigureWeddings(),
    fetchSchemaData('BusType')
  ]);

  if (!booking) {
    return notFound();
  }

  return <BookingDetailsPage booking={booking} restHours={restHours} weddingLimit={weddingLimit} busTypes={busTypes} />;
}
