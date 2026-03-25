'use client';

import fetchUserData from '@/app/api/fetchUser';
import { saveBooking } from '@/app/api/save-bookings/saveBooking';
import { updateBooking } from '@/app/api/update-booking/updateBooking';
import Document from '@/assets/icons/document.svg';
import { Button } from '@/components/ui';
import { useBusSelection } from '@/contexts/BusSelectionContext';
import { useDailyStops } from '@/contexts/DailyStopsContext';
import { ToastType, useToastModal } from '@/contexts/ToastModalContext';
import { EmailType } from '@/types/Emails';
import type { FullPricingResult } from '@/types/searchedTrips';
import type { ApiResponse } from '@/types/TravelCalculations';
import { t } from '@/utils/i18n';
import { sendEmail } from '@/utils/sendEmail';
import type { User } from '@prisma/client';
import { BookingsType } from '@prisma/client';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import ReactDOMServer from 'react-dom/server';
import TableEmailTemplate from '../EmailTemplate/EmailTemplate';
import { RegistrationModal } from '../RegistrationModal/RegistrationModal';

interface AdminBookingActionButtonsProps {
  baseAddress: string;
  serviceType: string;
  selectedDate: Date | undefined;
  isTrip: boolean;
  totalPriceForAllDays: number;
  pricingData: ApiResponse[] | null;
  initalPricingData: FullPricingResult[];
  totalTravelInfo: { totalDistance: string; totalDuration: string }[];
  missingKmInfo: {
    missingKm: number;
    additionalPrice: number;
    effectiveDistance: number;
    adjustedDistance: number;
    differenceInTotalPrice: number;
  }[];
  vatAmount?: string;
  userEmail: string;
  bookingId?: string;
  customExtras: { name: string; price: number }[];
  actionBookingType?: BookingsType;
  showSendEmailButton?: boolean;
}

const AdminBookingActionButtons = ({
  baseAddress,
  serviceType,
  selectedDate,
  totalPriceForAllDays,
  pricingData,
  totalTravelInfo,
  missingKmInfo,
  vatAmount,
  userEmail,
  bookingId,
  customExtras,
  actionBookingType,
  showSendEmailButton
}: AdminBookingActionButtonsProps) => {
  const { dailyStops, returnTrips } = useDailyStops();
  const { busSelection } = useBusSelection();
  const { showToast } = useToastModal();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingButton, setLoadingButton] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchedUser = async () => {
      if (userEmail) {
        const fetchedUser = await fetchUserData(userEmail);

        setUser(fetchedUser);
      }
    };

    fetchedUser();
  }, []);

  const createPayload = (bookingType: BookingsType) => {
    if (!pricingData || !selectedDate) {
      return null;
    }
    const dailyStopsData = Array.from(dailyStops.entries()).map(([dayIndex, stops]) => ({
      dayIndex,
      pickup: stops.pickup,
      dropoff: stops.dropoff,
      intermediates: stops.intermediates
    }));

    const tripBusesData = Object.entries(busSelection).map(([busType, quantity]) => ({
      busTypeId: busType,
      quantity
    }));

    const pricingResultsData = pricingData.map(({ result }, index: number) => ({
      dayIndex: index + 1,
      totalPrice: result.totalPrice,
      totalDuration: result.totalDuration,
      restTimePrice: result.restTimePrice,
      minimumPerDayDuration: result.minimumPerDayDuration,
      minimumPricePerDayDuration: result.minimumPricePerDayDuration,
      minimumTimePerDayDuration: result.minimumTimePerDayDuration,
      segments: result.segments,
      details: result.details,
      extras: result.extras,
      middleSegmentsWithPrices: result.middleSegmentsWithPrices
    }));

    return {
      baseAddress,
      serviceType,
      date: format(selectedDate, 'yyyy-MM-dd HH:mm:ss'),
      totalDuration: totalTravelInfo.reduce((acc, info) => acc + parseFloat(info.totalDuration), 0),
      totalDistance: totalTravelInfo.reduce((acc, info) => acc + parseFloat(info.totalDistance.split(' ')[0]), 0),
      totalPrice: totalPriceForAllDays,
      days: dailyStops.size,
      dailyStops: dailyStopsData,
      pricingResults: pricingResultsData,
      buses: tripBusesData,
      missingKmInfo,
      bookingType,
      returnTrips,
      overrideUserAdminBooking: user,
      customExtras
    };
  };

  const handleSaveBooking = async () => {
    const action = 'save';
    setLoadingButton(action);
    setIsLoading(true);
    try {
      const bookingType = actionBookingType || BookingsType.admin_saved;
      const payload = createPayload(bookingType);
      if (!payload) {
        return;
      }

      let bookingSaved;
      if (bookingId) {
        bookingSaved = await updateBooking({ ...payload, id: bookingId });
      } else {
        bookingSaved = await saveBooking(payload);
      }
      if (!bookingSaved) {
        throw new Error(t('admin.errors.bookingSaveFailed'));
      }

      const successMessage = t('admin.success.bookingSaved');
      showToast({
        message: successMessage,
        toastType: ToastType.success,
        onClose: () => router.push('/admin/Bookings?canCreate=false&canEdit=false&canDelete=false')
      });
    } catch (error) {
      const err = error as Error;
      showToast({ message: err.message || t('admin.errors.unexpectedError'), toastType: ToastType.error });
    } finally {
      setIsLoading(false);
      setLoadingButton(null);
    }
  };

  const handleSendEmail = async (userEmail: string) => {
    const action = 'sendEmail';
    setLoadingButton(action);
    setIsLoading(true);
    try {
      const bookingType = actionBookingType || BookingsType.admin_saved;

      let emailType = EmailType.SAVED;
      let emailSubject = t('admin.email.bookingSaved');

      if (bookingType === BookingsType.requested) {
        emailSubject = t('admin.email.subject');
        emailType = EmailType.REQUESTED;
      }

      const html = ReactDOMServer.renderToStaticMarkup(
        <TableEmailTemplate
          dailyStops={dailyStops}
          totalPrice={totalPriceForAllDays}
          busSelection={busSelection}
          emailType={emailType}
          returnTrips={returnTrips}
          vatAmount={vatAmount}
          serviceType={serviceType}
        />
      );
      const emailSent = await sendEmail(userEmail, emailSubject, html);
      if (!emailSent) {
        throw new Error(t('admin.errors.emailFailed'));
      }

      const successMessage = t('admin.success.emailSent');
      showToast({ message: successMessage, toastType: ToastType.success });
    } catch (error) {
      const err = error as Error;
      showToast({ message: err.message || t('admin.errors.unexpectedError'), toastType: ToastType.error });
    } finally {
      setIsLoading(false);
      setLoadingButton(null);
    }
  };

  return (
    <>
      <div className="w-full flex gap-6 flex-col lg:flex-row justify-center">
        {pricingData && (
          <Button
            variant="default"
            rounded={'full'}
            color="primary"
            suffixIcon={<Document height={28} width={28} />}
            size={'xl'}
            onClick={() => handleSaveBooking()}
            disabled={isLoading && loadingButton !== 'save'}
            loading={loadingButton === 'save'}
            className="w-full lg:w-[212px]"
          >
            {t('admin.buttons.saveBooking')}
          </Button>
        )}

        {showSendEmailButton && (
          <Button
            variant="default"
            rounded={'full'}
            color="primary"
            size={'xl'}
            onClick={() => handleSendEmail(userEmail)}
            disabled={isLoading && loadingButton !== 'sendEmail'}
            loading={loadingButton === 'sendEmail'}
            className="w-full lg:w-[212px]"
          >
            {t('admin.buttons.sendEmail')}
          </Button>
        )}
      </div>

      {/* Registration Modal receives current user data to pre-populate the form */}
      <RegistrationModal open={showRegistrationModal} onOpenChange={setShowRegistrationModal} defaultUserData={user} />
    </>
  );
};

export default AdminBookingActionButtons;
