'use client';

import fetchVat from '@/app/api/fetchVat';
import { updateSavedBookingType } from '@/app/api/updateSavedBookingType';
import { Button, Checkbox, DatePicker } from '@/components/ui';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { LoadingContainer, LoadingContent } from '@/components/ui/loading';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useBusSelection } from '@/contexts/BusSelectionContext';
import { ToastType, useToastModal } from '@/contexts/ToastModalContext';
import { EmailType } from '@/types/Emails';
import type { StopData } from '@/types/TravelCalculations';
import { formatPrice } from '@/utils/formatPrice';
import { getUserEmailFromCookie } from '@/utils/getUserEmailFromCookie';
import { t } from '@/utils/i18n';
import { sendEmail } from '@/utils/sendEmail';
import { BookingsType, type Bookings, type BookingsSelectedBuses, type Service, type User } from '@prisma/client';
import { format } from 'date-fns';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import ReactDOMServer from 'react-dom/server';
import TableEmailTemplate from '../EmailTemplate/EmailTemplate';

export type BookingsTableTypeProps = Bookings & {
  dailyStops: { dayIndex: number; pickup: StopData; dropoff: StopData; intermediates: StopData[] }[];
  buses: BookingsSelectedBuses[];
  user: User | null;
};

export interface FilterValues {
  serviceTypes: string[];
  bookingTypes: string[];
  budgetStartDate: Date | null;
  budgetEndDate: Date | null;
  serviceStartDate: Date | null;
  serviceEndDate: Date | null;
}

interface BookingsTableProps {
  bookings: BookingsTableTypeProps[];
  currentPage: number;
  totalPages: number;
  filterValues: FilterValues;
  services: Service[];
  loading: boolean;
  hideActions?: boolean;
  showRequestActions?: boolean;
  loadingAcceptAction?: string | null;
  loadingDeclineAction?: string | null;
  onFilterChange: (newFilters: Partial<FilterValues>) => void;
  onPageChange: (page: number) => void;
  onAccept?: ({ tripId, userEmail }: { tripId: string; userEmail?: string | null }) => void;
  onDecline?: ({ tripId, userEmail }: { tripId: string; userEmail?: string | null }) => void;
  disableRowClick?: boolean; // New prop to disable row click
}

const BookingsTable = ({
  bookings,
  currentPage,
  totalPages,
  filterValues,
  services,
  loading,
  hideActions,
  loadingAcceptAction,
  loadingDeclineAction,
  showRequestActions,
  onFilterChange,
  onPageChange,
  onAccept,
  onDecline,
  disableRowClick = false // Default to false
}: BookingsTableProps) => {
  const [showBudgetDropdown, setShowBudgetDropdown] = useState(false);
  const [showServiceDropdown, setShowServiceDropdown] = useState(false);
  const [showServiceFilterDropdown, setShowServiceFilterDropdown] = useState(false);
  const [showBookingTypeFilterDropdown, setShowBookingTypeFilterDropdown] = useState(false);
  const [requestBookingAction, setRequestBookingAction] = useState<string | null>(null);
  const router = useRouter();
  const userEmail = getUserEmailFromCookie();
  const [localBookings, setLocalBookings] = useState(bookings);
  const { showToast } = useToastModal();
  const { clearBusSelection } = useBusSelection();

  useEffect(() => {
    setLocalBookings(bookings);
  }, [bookings]);

  useEffect(() => {
    if (loading) {
      setShowBudgetDropdown(false);
      setShowServiceDropdown(false);
      setShowServiceFilterDropdown(false);
      setShowBookingTypeFilterDropdown(false);
    }
  }, [loading]);
  const handleRowClick = (tripId: string, userEmail: string) => {
    clearBusSelection();
    if (!disableRowClick) {
      router.push(`/admin/booking/${tripId}?userEmail=${userEmail}`);
    }
  };

  const requestBooking = async (booking: BookingsTableTypeProps) => {
    setRequestBookingAction(booking.id);
    const vat = await fetchVat();

    if (!booking && vat?.rate) {
      return null;
    }

    const bookingUpdate = await updateSavedBookingType(booking.id, BookingsType.requested);

    if (!bookingUpdate.ok) {
      return null;
    }
    showToast({
      message: t('admin.success.bookingRequested'),
      toastType: ToastType.success
    });

    setLocalBookings((prevBookings) =>
      prevBookings.map((b) => (b.id === booking.id ? { ...b, bookingType: BookingsType.requested } : b))
    );

    const netPrice = booking.totalPrice && booking.totalPrice / (1 + vat.rate);
    const vatAmount = booking.totalPrice && netPrice && booking.totalPrice - netPrice;

    const html = ReactDOMServer.renderToStaticMarkup(
      <TableEmailTemplate
        dailyStops={
          new Map(
            booking.dailyStops.map((stop) => [
              stop.dayIndex,
              { pickup: stop.pickup, dropoff: stop.dropoff, intermediates: stop.intermediates }
            ])
          )
        }
        totalPrice={booking.totalPrice ?? 0}
        busSelection={booking.buses.reduce((acc, bus) => ({ ...acc, [bus.busTypeId]: bus.quantity }), {})}
        emailType={EmailType.REQUESTED}
        vatAmount={vatAmount ? formatPrice(vatAmount) : '0'}
        serviceType={booking.serviceType}
      />
    );

    if (!userEmail) {
      return null;
    }
    const emailSent = await sendEmail(userEmail, t('admin.email.subject'), html);
    if (!emailSent) {
      throw new Error(t('admin.errors.emailFailed'));
    }

    const adminEmail = 'presupuestos@estebanrivas.info';

    const adminEmailText = `You have a new booking request.
        From: ${userEmail}
        Date: ${booking.date}
        Service Type: ${booking.serviceType}
        `;
    const adminEmailSent = await sendEmail(adminEmail, t('admin.email.adminRequestSubject'), adminEmailText);
    if (!adminEmailSent) {
      throw new Error(t('admin.errors.adminEmailFailed'));
    }
    setRequestBookingAction(null);
  };

  const getTotalBuses = (buses: BookingsSelectedBuses[]) => buses.reduce((total, bus) => total + bus.quantity, 0);

  const renderLoadingState = () => (
    <TableRow>
      <TableCell colSpan={10} className="text-center pl-10">
        <LoadingContainer>
          <LoadingContent />
        </LoadingContainer>
      </TableCell>
    </TableRow>
  );

  const renderDataRows = () =>
    localBookings.map((trip) => (
      <TableRow
        key={trip.id}
        className={disableRowClick ? '' : 'cursor-pointer'} // Remove pointer cursor if disabled
        onClick={() => !disableRowClick && handleRowClick(trip.id, trip.user?.email || '')} // Only handle click if not disabled
        style={{ color: '#3b4da0' }}
      >
        <TableCell className="text-center text-[#3b4da0] px-2">
          {format(new Date(trip.createdAt), 'dd/MM/yyyy')}
        </TableCell>
        <TableCell className="text-center text-[#3b4da0] px-2">{trip.serviceType}</TableCell>
        <TableCell className="text-center text-[#3b4da0] px-2">{trip.days}</TableCell>
        <TableCell className="text-center text-[#3b4da0] px-2">{formatPrice(trip.totalPrice || 0)}</TableCell>
        <TableCell className="text-center text-[#3b4da0] px-2">{getTotalBuses(trip.buses)}</TableCell>
        <TableCell className="text-center text-[#3b4da0] px-2 min-w-[200px]">
          {trip.dailyStops[0]?.pickup?.address}
        </TableCell>
        <TableCell className="text-center text-[#3b4da0] px-2">{format(new Date(trip.date), 'dd/MM/yyyy')}</TableCell>
        <TableCell className="text-center text-[#3b4da0] px-2">{t(`admin.columns.${trip.bookingType}`)}</TableCell>
        <TableCell className="text-center text-[#3b4da0] px-2">{trip.user?.email || '-'}</TableCell>
        {!hideActions && (
          <TableCell className=" text-[#3b4da0] items-center  px-2">
            <div className="flex gap-2 justify-center">
              {trip.bookingType === 'requested' ? (
                <>
                  <Button
                    variant={'default'}
                    color="primary"
                    rounded={'full'}
                    onClick={(e) => {
                      e.stopPropagation();
                      onAccept && onAccept({ tripId: trip.id, userEmail: trip.user?.email });
                    }}
                    loading={loadingAcceptAction === trip.id}
                  >
                    Aceptar
                  </Button>
                  <Button
                    variant={'default'}
                    color="primary"
                    rounded={'full'}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDecline && onDecline({ tripId: trip.id, userEmail: trip.user?.email });
                    }}
                    loading={loadingDeclineAction === trip.id}
                  >
                    Declinar
                  </Button>
                </>
              ) : (
                '-'
              )}
            </div>
          </TableCell>
        )}
        {showRequestActions && (
          <TableCell className="flex gap-2 justify-center text-[#3b4da0]">
            {trip.bookingType === 'saved' ? (
              <>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    requestBooking(trip);
                  }}
                  loading={requestBookingAction === trip.id}
                  variant={'default'}
                  color="primary"
                  rounded={'full'}
                  className="w-[88.5px]"
                >
                  Solicitar
                </Button>
              </>
            ) : (
              '-'
            )}
          </TableCell>
        )}
      </TableRow>
    ));

  const handleServiceSelection = (service: string) => {
    const current = filterValues.serviceTypes;
    const newServices = current.includes(service) ? current.filter((s) => s !== service) : [...current, service];
    onFilterChange({ serviceTypes: newServices });
  };

  const handleBookingTypeSelection = (type: string) => {
    const current = filterValues.bookingTypes;
    const newTypes = current.includes(type) ? current.filter((t) => t !== type) : [...current, type];
    onFilterChange({ bookingTypes: newTypes });
  };

  const bookingTypes = hideActions
    ? Object.values(BookingsType).filter((type) => type !== BookingsType.admin_saved)
    : Object.values(BookingsType);

  return (
    <div className="p-6 bg-white rounded-lg shadow-md relative ">
      <Table>
        <TableHeader>
          <TableRow className="bg-[#3b4da0] text-white h-[62.5px] hover:bg-[#3b4da0]">
            {/* Budget Date Filter */}
            <TableHead className="text-white px-2">
              <DropdownMenu modal={false} open={showBudgetDropdown} onOpenChange={setShowBudgetDropdown}>
                <DropdownMenuTrigger asChild disabled={loading}>
                  <Button
                    variant="ghost"
                    className="flex items-center justify-between p-0 bg-transparent"
                    disabled={loading}
                  >
                    {t('admin.columns.budgetDate')}
                    {showBudgetDropdown ? <ChevronUp /> : <ChevronDown />}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="z-50 p-4 rounded-md shadow-md bg-white items-center">
                  <div className="flex flex-col lg:flex-row gap-2 items-center">
                    <div className="w-full max-w-[250px]">
                      <DatePicker
                        date={filterValues.budgetStartDate || undefined}
                        placeholder={t('admin.placeholders.startDate')}
                        onDateChange={(date) => onFilterChange({ budgetStartDate: date })}
                        allowPastDates={true}
                        disabled={loading}
                      />
                    </div>
                    -
                    <div className="w-full max-w-[250px]">
                      <DatePicker
                        date={filterValues.budgetEndDate || undefined}
                        placeholder={t('admin.placeholders.endDate')}
                        onDateChange={(date) => onFilterChange({ budgetEndDate: date })}
                        allowPastDates={true}
                        disabled={loading}
                      />
                    </div>
                    <Button
                      variant="link"
                      className="p-0 text-blue-500 text-sm"
                      onClick={() => onFilterChange({ budgetStartDate: null, budgetEndDate: null })}
                      disabled={loading}
                    >
                      {t('admin.buttons.clear')}
                    </Button>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableHead>
            {/* Service Filter */}
            <TableHead className="text-white px-2">
              <DropdownMenu modal={false} open={showServiceFilterDropdown} onOpenChange={setShowServiceFilterDropdown}>
                <DropdownMenuTrigger asChild disabled={loading}>
                  <Button
                    variant="ghost"
                    className="flex items-center justify-between p-0 bg-transparent"
                    disabled={loading}
                  >
                    {t('admin.columns.service')}
                    {showServiceFilterDropdown ? <ChevronUp /> : <ChevronDown />}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="z-50 p-4 rounded-md shadow-md bg-white">
                  <div className="items-center flex flex-col">
                    <div className="flex flex-col gap-2">
                      {services.map((service) => (
                        <DropdownMenuItem
                          key={service.id}
                          className="flex items-center gap-2"
                          onSelect={(e) => e.preventDefault()}
                          disabled={loading}
                        >
                          <Checkbox
                            id={`service-${service.id}`}
                            checked={filterValues.serviceTypes.includes(service.name)}
                            onCheckedChange={() => handleServiceSelection(service.name)}
                            disabled={loading}
                          />
                          <label htmlFor={`service-${service.id}`} className="cursor-pointer">
                            {service.name}
                          </label>
                        </DropdownMenuItem>
                      ))}
                    </div>
                    <Button
                      variant="link"
                      className="mt-2 p-0 text-blue-500 text-sm"
                      onClick={() => onFilterChange({ serviceTypes: [] })}
                      disabled={loading}
                    >
                      {t('admin.buttons.clear')}
                    </Button>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableHead>
            <TableHead className="text-center text-white px-2">{t('admin.columns.days')}</TableHead>
            <TableHead className="text-center text-white px-2">{t('admin.columns.totalPrice')}</TableHead>
            <TableHead className="text-center text-white px-2">{t('admin.columns.numberOfBuses')}</TableHead>
            <TableHead className="text-center px-2" style={{ color: 'white' }}>
              {t('admin.columns.startAddress')}
            </TableHead>
            {/* Service Date Filter */}
            <TableHead className="text-center text-white px-2">
              <div className="flex justify-center">
                <DropdownMenu modal={false} open={showServiceDropdown} onOpenChange={setShowServiceDropdown}>
                  <DropdownMenuTrigger asChild disabled={loading}>
                    <Button
                      variant="ghost"
                      className="flex items-center justify-between p-0 bg-transparent"
                      disabled={loading}
                    >
                      {t('admin.columns.serviceDate')}
                      {showServiceDropdown ? <ChevronUp /> : <ChevronDown />}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="z-50 p-4 rounded-md shadow-md bg-white">
                    <div className="flex flex-col lg:flex-row gap-2 items-center">
                      <div className="w-full max-w-[250px]">
                        <DatePicker
                          date={filterValues.serviceStartDate || undefined}
                          placeholder={t('admin.placeholders.startDate')}
                          onDateChange={(date) => onFilterChange({ serviceStartDate: date })}
                          allowPastDates={true}
                          disabled={loading}
                        />
                      </div>

                      {/* Dash separator */}
                      <span className="text-xl">-</span>

                      <div className="w-full max-w-[250px]">
                        <DatePicker
                          date={filterValues.serviceEndDate || undefined}
                          placeholder={t('admin.placeholders.endDate')}
                          onDateChange={(date) => onFilterChange({ serviceEndDate: date })}
                          allowPastDates={true}
                          disabled={loading}
                        />
                      </div>

                      {/* Clear button on its own row on mobile/tablet, but inline on desktop if needed */}
                      <Button
                        variant="link"
                        className="p-0 text-blue-500 text-sm"
                        onClick={() => onFilterChange({ serviceStartDate: null, serviceEndDate: null })}
                        disabled={loading}
                      >
                        {t('admin.buttons.clear')}
                      </Button>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </TableHead>
            {/* Booking Type Filter */}
            <TableHead className="text-center text-white px-2">
              <div className="flex justify-center">
                <DropdownMenu
                  modal={false}
                  open={showBookingTypeFilterDropdown}
                  onOpenChange={setShowBookingTypeFilterDropdown}
                >
                  <DropdownMenuTrigger asChild disabled={loading}>
                    <Button
                      variant="ghost"
                      className="flex items-center justify-between p-0 bg-transparent"
                      disabled={loading}
                    >
                      {t('admin.columns.bookingType')}
                      {showBookingTypeFilterDropdown ? <ChevronUp /> : <ChevronDown />}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="z-50 p-4 rounded-md shadow-md bg-white">
                    <div className="items-center flex flex-col">
                      <div className="flex flex-col gap-2">
                        {bookingTypes.map((type) => (
                          <DropdownMenuItem
                            key={type}
                            className="flex items-center gap-2"
                            onSelect={(e) => e.preventDefault()}
                            disabled={loading}
                          >
                            <Checkbox
                              id={`bookingType-${type}`}
                              checked={filterValues.bookingTypes.includes(type)}
                              onCheckedChange={() => handleBookingTypeSelection(type)}
                              disabled={loading}
                            />
                            <label htmlFor={`bookingType-${type}`} className="cursor-pointer">
                              {t(`admin.columns.${type}`)}
                            </label>
                          </DropdownMenuItem>
                        ))}
                      </div>
                      <Button
                        variant="link"
                        className="mt-2 p-0 text-blue-500 text-sm"
                        onClick={() => onFilterChange({ bookingTypes: [] })}
                        disabled={loading}
                      >
                        {t('admin.buttons.clear')}
                      </Button>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </TableHead>

            <TableHead className="text-center px-2" style={{ color: 'white' }}>
              {t('admin.columns.userEmail')}
            </TableHead>

            {(!hideActions || showRequestActions) && (
              <TableHead className="text-center px-2" style={{ color: 'white' }}>
                {t('admin.columns.actions')}
              </TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>{loading ? renderLoadingState() : renderDataRows()}</TableBody>
      </Table>
      <div className="flex justify-between items-center mt-4">
        {totalPages === 0 || bookings.length === 0 ? (
          <div className="text-center w-full text-gray-500">{t('admin.pagination.noPages')}</div>
        ) : (
          <>
            <Button
              variant={'default'}
              color="primary"
              rounded={'full'}
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft />
              <span className="hidden lg:inline ml-1">{t('admin.pagination.previous')}</span>
            </Button>
            <span>
              {t('admin.pagination.page')} {currentPage} {t('admin.pagination.of')} {totalPages}
            </span>
            <Button
              variant={'default'}
              color="primary"
              rounded={'full'}
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <span className="hidden lg:inline mr-1">{t('admin.pagination.next')}</span>
              <ChevronRight />
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default BookingsTable;
