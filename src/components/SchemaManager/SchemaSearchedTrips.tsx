'use client';

import { BookingsType, type Bookings, type BookingsSelectedBuses, type Service, type User } from '@prisma/client';
import { useEffect, useState } from 'react';

import { fetchAllBookings } from '@/app/api/admin/fetchAllBookings';
import { updateBookingType } from '@/app/api/admin/updateBooking';
import { fetchBookingForEmails } from '@/app/api/fetchBookingDetailsForEmail';
import type { DailyStopsState } from '@/contexts/DailyStopsContext';
import { useDebounce } from '@/hooks/useDebounce';
import { EmailType } from '@/types/Emails';
import type { FullBookingsType } from '@/types/searchedTrips';
import type { StopData } from '@/types/TravelCalculations';
import type { ReturnTrip } from '@/types/WeedingReturnTrips';
import { formatPrice } from '@/utils/formatPrice';
import { t } from '@/utils/i18n';
import { sendEmail } from '@/utils/sendEmail';
import ReactDOMServer from 'react-dom/server';
import type { FilterValues } from '../BookingsTable/BookingsTable';
import BookingsTable from '../BookingsTable/BookingsTable';
import TableEmailTemplate from '../EmailTemplate/EmailTemplate';

// const presuBody = {
//   id: 'SV0023',
//   porcentajeIva: 10,
//   cliente: {
//     nombre: 'INGENIERIA EDUCATIVA,S.L.',
//     documento: 'B90551840',
//     direccion: 'AVDA.DE EUROPA, 5 2D',
//     codigoPostal: '28943',
//     poblacion: 'FUENLABRADA',
//     provincia: 'MADRID',
//     pais: 'ESPANA',
//     telefono: '606179680',
//     contacto: 'ENRIQUE GARCIA (CAMPO Y VIDA)'
//   },
//   servicios: [
//     {
//       tipo: 'traslado',
//       trayectos: [
//         {
//           origen: {
//             fecha: '2025-03-20',
//             hora: '10:00',
//             localizacion: {
//               lugar: 'C. de Villafuerte, 41-37',
//               latitud: 40.35606,
//               longitud: -3.6893
//             }
//           },
//           intermedios: [
//             {
//               lugar: 'C. de Paterna, 41D, Villaverde',
//               latitud: 40.340914,
//               longitud: -3.68425
//             },
//             {
//               lugar: 'C. Santo Domingo de la Calzada',
//               latitud: 40.32271,
//               longitud: -3.7245
//             }
//           ],
//           destino: {
//             fecha: '2025-03-20',
//             hora: '10:40',
//             localizacion: {
//               lugar: 'C. de Sabatini',
//               latitud: 40.33195,
//               longitud: -3.76798
//             }
//           },
//           kilometros: 18,
//           duracion: 40
//         }
//       ],
//       categoria: '30',
//       vehiculos: 1,
//       plazas: 50,
//       baseImponible: 7031,
//       iva: 703,
//       total: 7734
//     },
//     {
//       tipo: 'traslado',
//       trayectos: [
//         {
//           origen: {
//             fecha: '2025-03-20',
//             hora: '10:00',
//             localizacion: {
//               lugar: 'C. de Villafuerte, 41-37',
//               latitud: 40.35606,
//               longitud: -3.6893
//             }
//           },
//           intermedios: [
//             {
//               lugar: 'C. de Paterna, 41D, Villaverde',
//               latitud: 40.340914,
//               longitud: -3.68425
//             },
//             {
//               lugar: 'C. Santo Domingo de la Calzada',
//               latitud: 40.32271,
//               longitud: -3.7245
//             }
//           ],
//           destino: {
//             fecha: '2025-03-20',
//             hora: '10:40',
//             localizacion: {
//               lugar: 'C. de Sabatini',
//               latitud: 40.33195,
//               longitud: -3.76798
//             }
//           },
//           kilometros: 18,
//           duracion: 40
//         }
//       ],
//       categoria: '20',
//       vehiculos: 1,
//       plazas: 30,
//       baseImponible: 6055,
//       iva: 605,
//       total: 6660
//     }
//   ]
// };

export type BookingsTableTypeProps = Bookings & {
  dailyStops: { dayIndex: number; pickup: StopData; dropoff: StopData; intermediates: StopData[] }[];
  buses: BookingsSelectedBuses[];
  user: User | null;
};

const SchemaSearchedTrips = () => {
  const rowsPerPage = 10;
  const [filteredData, setFilteredData] = useState<BookingsTableTypeProps[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingAcceptAction, setLoadingAcceptAction] = useState<string | null>(null);
  const [loadingDeclineAction, setLoadingDeclineAction] = useState<string | null>(null);
  const [vat, setVat] = useState(0);

  const [filterValues, setFilterValues] = useState<FilterValues>({
    serviceTypes: [],
    bookingTypes: [],
    budgetStartDate: null,
    budgetEndDate: null,
    serviceStartDate: null,
    serviceEndDate: null
  });

  const debouncedFilters = useDebounce(filterValues, 1000);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const res = await fetch('/api/table-filters');
        if (!res.ok) {
          throw new Error('Failed to load table filters');
        }
        const { services, vat } = await res.json();
        setServices(services);
        setVat(vat);
      } catch (err) {
        throw new Error('Failed to load table filters');
      }
    };
    loadConfig();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedFilters]);

  useEffect(() => {
    const fetchData = async () => {
      if (
        (debouncedFilters.budgetStartDate && !debouncedFilters.budgetEndDate) ||
        (!debouncedFilters.budgetStartDate && debouncedFilters.budgetEndDate) ||
        (debouncedFilters.serviceStartDate && !debouncedFilters.serviceEndDate) ||
        (!debouncedFilters.serviceStartDate && debouncedFilters.serviceEndDate)
      ) {
        return;
      }

      try {
        setLoading(true);
        const response = await fetchAllBookings({
          page: currentPage,
          limit: rowsPerPage,
          serviceTypes: debouncedFilters.serviceTypes,
          bookingTypes: debouncedFilters.bookingTypes,
          budgetStartDate: debouncedFilters.budgetStartDate,
          budgetEndDate: debouncedFilters.budgetEndDate,
          serviceStartDate: debouncedFilters.serviceStartDate,
          serviceEndDate: debouncedFilters.serviceEndDate
        });
        setFilteredData(response.bookings);
        setTotalPages(response.totalPages);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [
    currentPage,
    debouncedFilters.serviceTypes,
    debouncedFilters.bookingTypes,
    debouncedFilters.budgetStartDate,
    debouncedFilters.budgetEndDate,
    debouncedFilters.serviceStartDate,
    debouncedFilters.serviceEndDate
  ]);

  const handleFilterChange = (newFilters: Partial<FilterValues>) => {
    setFilterValues((prev) => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleSendEmail = async ({
    booking,
    userEmail,
    emailType
  }: {
    booking: FullBookingsType;
    userEmail: string;
    emailType: EmailType;
  }) => {
    const stopsByDay = new Map<number, StopData[]>();

    booking.dailyStops.forEach((ds) => {
      const stopsSequence: StopData[] = [ds.pickup, ...ds.intermediates, ds.dropoff];
      const day = ds.dayIndex;
      if (!stopsByDay.has(day)) {
        stopsByDay.set(day, []);
      }
      stopsByDay.get(day)?.push(...stopsSequence);
    });

    const normalizeStop = (stop: StopData): StopData => ({
      ...stop,
      time: stop.time === null ? undefined : stop.time
    });
    const dailyStopsState: DailyStopsState = new Map();
    stopsByDay.forEach((stops, day) => {
      if (stops.length === 0) {
        return;
      }
      const normalizedStops = stops.map(normalizeStop);
      const pickup = normalizedStops[0];
      const dropoff = normalizedStops[normalizedStops.length - 1];
      const intermediates = normalizedStops.slice(1, normalizedStops.length - 1);
      dailyStopsState.set(day, { pickup, dropoff, intermediates });
    });

    const busSelection = booking.buses.reduce((acc, bus) => ({ ...acc, [bus.busTypeId]: bus.quantity }), {});

    if (!booking.totalPrice) {
      return;
    }

    const netPrice = booking.totalPrice / (1 + vat);
    const vatAmount = booking.totalPrice - netPrice;

    const html = ReactDOMServer.renderToStaticMarkup(
      <TableEmailTemplate
        dailyStops={dailyStopsState}
        totalPrice={booking.totalPrice || 0}
        returnTrips={booking.returnTrip as ReturnTrip[]}
        busSelection={busSelection}
        emailType={emailType}
        serviceType={booking.serviceType}
        vatAmount={formatPrice(vatAmount)}
      />
    );
    const emailSent = await sendEmail(userEmail, t(`admin.email.${emailType}`), html);
    if (!emailSent) {
      throw new Error(t('admin.errors.emailFailed'));
    }
  };

  const handleAccept = async ({ tripId, userEmail }: { tripId: string; userEmail?: string | null }) => {
    if (!userEmail) {
      return;
    }
    // const presuRes = await sinfePresupuesto(JSON.stringify(presuBody));
    // if (presuRes.error) {
    //   return showToast({
    //     message: 'Failed to save Booking to SINFE',
    //     toastType: ToastType.error
    //   });
    // }
    setLoadingAcceptAction(tripId);
    const updatedBooking = await updateBookingType({
      bookingId: tripId,
      bookingType: BookingsType.accepted
    });
    const booking = (await fetchBookingForEmails(tripId)) as unknown as FullBookingsType;
    if (!booking) {
      return;
    }
    handleSendEmail({ booking, userEmail, emailType: EmailType.ACCEPTED });
    setFilteredData((prev) =>
      prev.map((trip) => (trip.id === tripId ? { ...trip, bookingType: updatedBooking.bookingType } : trip))
    );
    setLoadingAcceptAction(null);
  };

  const handleDecline = async ({ tripId, userEmail }: { tripId: string; userEmail?: string | null }) => {
    if (!userEmail) {
      return;
    }

    setLoadingDeclineAction(tripId);
    const updatedBooking = await updateBookingType({
      bookingId: tripId,
      bookingType: BookingsType.declined
    });

    const booking = (await fetchBookingForEmails(tripId)) as unknown as FullBookingsType;

    if (!booking) {
      return;
    }
    handleSendEmail({ booking, userEmail, emailType: EmailType.DECLINED });
    setFilteredData((prev) =>
      prev.map((trip) => (trip.id === tripId ? { ...trip, bookingType: updatedBooking.bookingType } : trip))
    );
    setLoadingDeclineAction(null);
  };

  return (
    <div>
      <BookingsTable
        bookings={filteredData}
        currentPage={currentPage}
        totalPages={totalPages}
        filterValues={filterValues}
        services={services}
        loading={loading}
        loadingAcceptAction={loadingAcceptAction}
        loadingDeclineAction={loadingDeclineAction}
        onFilterChange={handleFilterChange}
        onPageChange={handlePageChange}
        onAccept={handleAccept}
        onDecline={handleDecline}
      />
    </div>
  );
};

export default SchemaSearchedTrips;
