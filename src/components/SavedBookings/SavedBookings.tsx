'use client';

import { type Bookings, type BookingsSelectedBuses, type Service, type User } from '@prisma/client';
import { useEffect, useRef, useState } from 'react';

import { fetchAllBookings } from '@/app/api/admin/fetchAllBookings';
import fetchServices from '@/app/api/fetchServices';
import type { FilterValues } from '@/components/BookingsTable/BookingsTable';
import BookingsTable from '@/components/BookingsTable/BookingsTable';
import { useDebounce } from '@/hooks/useDebounce';
import type { StopData } from '@/types/TravelCalculations';

export type BookingsTableTypeProps = Bookings & {
  dailyStops: { dayIndex: number; pickup: StopData; dropoff: StopData; intermediates: StopData[] }[];
  buses: BookingsSelectedBuses[];
  user: User | null;
};

interface SavedBookingsClientProps {
  email: string;
  initialBookings: BookingsTableTypeProps[];
  initialTotalPages: number;
  initialServices: Service[];
}

const SavedBookingsClient = ({
  email,
  initialBookings,
  initialTotalPages,
  initialServices
}: SavedBookingsClientProps) => {
  const rowsPerPage = 10;
  const [bookings, setBookings] = useState<BookingsTableTypeProps[]>(initialBookings);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [services, setServices] = useState<Service[]>(initialServices);
  const [loading, setLoading] = useState(false);

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
    setCurrentPage(1);
  }, [debouncedFilters]);

  const didMountRef = useRef(false);

  useEffect(() => {
    const fetchService = async () => {
      setLoading(true);
      try {
        const fetchedServices = await fetchServices();
        setServices(fetchedServices);
      } finally {
        setLoading(false);
      }
    };

    fetchService();
  }, []);

  useEffect(() => {
    const fetchService = async () => {
      setLoading(true);
      try {
        const fetchedServices = await fetchServices();
        setServices(fetchedServices);
      } finally {
        setLoading(false);
      }
    };

    fetchService();
  }, []);

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }

    if (
      (debouncedFilters.budgetStartDate && !debouncedFilters.budgetEndDate) ||
      (!debouncedFilters.budgetStartDate && debouncedFilters.budgetEndDate) ||
      (debouncedFilters.serviceStartDate && !debouncedFilters.serviceEndDate) ||
      (!debouncedFilters.serviceStartDate && debouncedFilters.serviceEndDate)
    ) {
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetchAllBookings({
          email,
          page: currentPage,
          limit: rowsPerPage,
          serviceTypes: debouncedFilters.serviceTypes,
          bookingTypes: debouncedFilters.bookingTypes,
          budgetStartDate: debouncedFilters.budgetStartDate,
          budgetEndDate: debouncedFilters.budgetEndDate,
          serviceStartDate: debouncedFilters.serviceStartDate,
          serviceEndDate: debouncedFilters.serviceEndDate
        });
        setBookings(response.bookings);
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

  return (
    <div className="mb-20">
      <BookingsTable
        bookings={bookings}
        currentPage={currentPage}
        totalPages={totalPages}
        filterValues={filterValues}
        services={services}
        loading={loading}
        onFilterChange={handleFilterChange}
        onPageChange={handlePageChange}
        hideActions={true}
        showRequestActions={true}
        disableRowClick={true}
      />
    </div>
  );
};

export default SavedBookingsClient;
