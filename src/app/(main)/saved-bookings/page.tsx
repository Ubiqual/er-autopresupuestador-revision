// app/saved-bookings/page.tsx
import { fetchAllBookings } from '@/app/api/admin/fetchAllBookings';
import fetchServices from '@/app/api/fetchServices';
import SavedBookingsClient from '@/components/SavedBookings/SavedBookings';
import { getSession } from '@auth0/nextjs-auth0';

export default async function SavedBookings() {
  const session = await getSession();
  const bookingsData = await fetchAllBookings({
    email: session?.user.email || '',
    page: 1,
    limit: 10,
    serviceTypes: [],
    bookingTypes: [],
    budgetStartDate: null,
    budgetEndDate: null,
    serviceStartDate: null,
    serviceEndDate: null
  });
  const servicesData = await fetchServices();

  return (
    <SavedBookingsClient
      email={session?.user.email || ''}
      initialBookings={bookingsData.bookings}
      initialTotalPages={bookingsData.totalPages}
      initialServices={servicesData}
    />
  );
}
