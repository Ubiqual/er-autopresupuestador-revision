import { fetchBookingDetails } from '@/app/api/admin/fetchBookingDetails';
import { fetchConfigureTrip } from '@/app/api/admin/fetchConfigureTrip';
import { fetchConfigureWeddings } from '@/app/api/admin/fetchConfigureWeddings';
import { fetchRestHours } from '@/app/api/admin/fetchRestHours';
import { fetchSchemaData } from '@/app/api/admin/fetchSchemaData';
import fetchServices from '@/app/api/fetchServices';
import fetchVat from '@/app/api/fetchVat';
import BookingOldDesign from '@/components/Booking/BookingOldDesign';
import { t } from '@/utils/i18n';

export default async function BookingPage({
  params,
  searchParams
}: {
  params: { id: string };
  searchParams: { userEmail: string };
}) {
  const { id } = params; // 'new' or an actual booking id
  const userEmail = searchParams.userEmail;

  // Fetch all the configuration data concurrently
  const [baseAddress, services, restHours, busTypes, tripMinimums, weddingLimit, vat] = await Promise.all([
    fetchSchemaData('BaseAddress'),
    fetchServices(),
    fetchRestHours(),
    fetchSchemaData('BusType'),
    fetchConfigureTrip(),
    fetchConfigureWeddings(),
    fetchVat()
  ]);

  // Validate configuration data
  if (
    !baseAddress ||
    !baseAddress[0]?.address ||
    !services ||
    !restHours ||
    !busTypes ||
    !tripMinimums ||
    !weddingLimit
  ) {
    return (
      <div>
        <h1>{t('bookingPage.errors.title')}</h1>
        <p>{t('bookingPage.errors.configurationLoadError')}</p>
      </div>
    );
  }

  // If editing an existing booking, fetch its details. Otherwise, booking remains null.
  let booking = null;
  if (id !== 'new') {
    booking = await fetchBookingDetails(id);
    if (!booking) {
      return <div>Booking not found.</div>;
    }
  }

  // Render the BookingOldDesign once, passing all needed props.
  return (
    <div>
      <BookingOldDesign
        baseAddress={baseAddress[0].address}
        services={services}
        busTypes={busTypes}
        restHours={restHours}
        tripMinimums={tripMinimums}
        weddingLimit={weddingLimit}
        booking={booking}
        userEmail={userEmail}
        vat={vat.rate}
      />
    </div>
  );
}
