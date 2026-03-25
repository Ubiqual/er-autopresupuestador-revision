'use client';

import fetchUserData from '@/app/api/fetchUser';
import { saveBooking } from '@/app/api/save-bookings/saveBooking';
import Document from '@/assets/icons/document.svg';
import ArrowLeft from '@/assets/icons/left-arrow.svg';
import ArrowRight from '@/assets/icons/right-arrow.svg';
import { Button } from '@/components/ui';
import { useBusSelection } from '@/contexts/BusSelectionContext';
import { useDailyStops } from '@/contexts/DailyStopsContext';
import { ToastType, useToastModal } from '@/contexts/ToastModalContext';
import { EmailType } from '@/types/Emails';
import type { ApiResponse } from '@/types/TravelCalculations';
import { checkUserData } from '@/utils/checkUserData';
import { getUserEmailFromCookie } from '@/utils/getUserEmailFromCookie';
import { t } from '@/utils/i18n';
import { sendEmail } from '@/utils/sendEmail';
import type { User } from '@prisma/client';
import { BookingsType } from '@prisma/client';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useState } from 'react';
import ReactDOMServer from 'react-dom/server';
import TableEmailTemplate from '../EmailTemplate/EmailTemplate';
import { RegistrationModal } from '../RegistrationModal/RegistrationModal';

interface BookingActionButtonsProps {
  baseAddress: string;
  serviceType: string;
  selectedDate: Date | undefined;
  isTrip: boolean;
  totalPriceForAllDays: number;
  pricingData: ApiResponse[];
  totalTravelInfo: { totalDistance: string; totalDuration: string }[];
  missingKmInfo: {
    missingKm: number;
    additionalPrice: number;
    effectiveDistance: number;
    adjustedDistance: number;
    differenceInTotalPrice: number;
  }[];
  onCancel: () => void;
  hideCancel?: boolean;
  vatAmount?: string;
  clearStates: () => void;
}

const BookingActionButtons = ({
  baseAddress,
  serviceType,
  selectedDate,
  isTrip,
  totalPriceForAllDays,
  pricingData,
  totalTravelInfo,
  missingKmInfo,
  onCancel,
  hideCancel,
  vatAmount,
  clearStates
}: BookingActionButtonsProps) => {
  const { dailyStops, returnTrips, setDailyStops, setReturnTrips } = useDailyStops();
  const { busSelection } = useBusSelection();
  const { showToast } = useToastModal();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingButton, setLoadingButton] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<'save' | 'request' | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const userEmail = getUserEmailFromCookie();
    if (userEmail) {
      fetchUserData(userEmail).then((userData) => setUser(userData));
    }
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
      totalPrice: isTrip ? totalPriceForAllDays : pricingData[0].result.totalPrice,
      days: dailyStops.size,
      dailyStops: dailyStopsData,
      pricingResults: pricingResultsData,
      buses: tripBusesData,
      missingKmInfo,
      bookingType,
      returnTrips
    };
  };

  const handleMessage = useCallback(
    (event: MessageEvent) => {
      if (event.origin !== window.location.origin) {
        return;
      }
      if (event.data?.type === 'AUTH_SUCCESS') {
        setTimeout(() => {
          const userEmail = getUserEmailFromCookie();
          if (userEmail && pendingAction) {
            const actionToRetry = pendingAction;
            setPendingAction(null);
            handleBookingAction(actionToRetry);
          }
        }, 1000);
      }
    },
    [pendingAction]
  );

  useEffect(() => {
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleMessage]);

  const openAuthPopup = () => {
    const loginUrl = '/api/auth/login?returnTo=/auth/popup-callback';
    const width = 500;
    const height = 700;
    const dualScreenLeft = window.screenLeft ?? window.screenX;
    const dualScreenTop = window.screenTop ?? window.screenY;
    const left = (window.innerWidth - width) / 2 + dualScreenLeft;
    const top = (window.innerHeight - height) / 2 + dualScreenTop;
    const popup = window.open(
      loginUrl,
      'Auth0Login',
      `scrollbars=yes, width=${width}, height=${height}, top=${top}, left=${left}`
    );
    if (popup) {
      popup.focus();
    }
  };

  const handleUnifiedLogin = async () => {
    if (!getUserEmailFromCookie()) {
      await openAuthPopup();
    }
  };

  const handleBookingAction = async (action: 'save' | 'request', overrideUser?: User | null) => {
    setLoadingButton(action);
    setIsLoading(true);
    try {
      const userEmail = getUserEmailFromCookie();
      if (!userEmail) {
        setPendingAction(action);
        await handleUnifiedLogin();
        return;
      }

      const currentUser = overrideUser || (await fetchUserData(userEmail));

      if (action === 'request' && !checkUserData(currentUser)) {
        setPendingAction(action);
        setShowRegistrationModal(true);
        return;
      }

      const bookingType = action === 'request' ? BookingsType.requested : BookingsType.saved;
      const payload = createPayload(bookingType);
      if (!payload) {
        return;
      }

      const bookingSaved = await saveBooking(payload);
      if (!bookingSaved) {
        throw new Error(t('admin.errors.bookingSaveFailed'));
      }

      let emailSubject;
      let emailType = EmailType.SAVED;
      if (action === 'request') {
        emailSubject = t('admin.email.subject');
        emailType = EmailType.REQUESTED;
      } else {
        emailSubject = t('admin.email.bookingSaved');
      }
      const html = ReactDOMServer.renderToStaticMarkup(
        <TableEmailTemplate
          dailyStops={dailyStops}
          totalPrice={isTrip ? totalPriceForAllDays : pricingData[0].result.totalPrice}
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

      let successMessage = t('admin.success.bookingSaved');
      if (action === 'request') {
        const adminEmail = 'presupuestos@estebanrivas.info';
        const adminEmailText = `You have a new booking request.
        From: ${userEmail}
        Date: ${payload.date}
        Service Type: ${payload.serviceType}
        `;
        const adminEmailSent = await sendEmail(adminEmail, t('admin.email.adminRequestSubject'), adminEmailText);
        if (!adminEmailSent) {
          throw new Error(t('admin.errors.adminEmailFailed'));
        }
        successMessage = t('admin.success.bookingRequested');
      }
      showToast({
        message: successMessage,
        toastType: ToastType.success,
        onClose: () => router.push('/saved-bookings')
      });
      setDailyStops(new Map());
      setReturnTrips([]);
    } catch (error) {
      const err = error as Error;
      showToast({ message: err.message || t('admin.errors.unexpectedError'), toastType: ToastType.error });
    } finally {
      setIsLoading(false);
      setLoadingButton(null);
    }
  };

  const handleUserInfoSaved = async () => {
    const userEmail = getUserEmailFromCookie();
    if (!userEmail) {
      return;
    }
    const user = await fetchUserData(userEmail);
    setUser(user);

    setShowRegistrationModal(false);
    if (pendingAction) {
      const actionToRetry = pendingAction;
      setPendingAction(null);

      handleBookingAction(actionToRetry, user);
    }
  };

  return (
    <>
      <div className="w-full flex gap-6 flex-col lg:flex-row justify-center">
        {!hideCancel && (
          <Button
            variant="default"
            rounded={'full'}
            color="primary"
            prefixIcon={<ArrowLeft height={17.5} width={21} style={{ currentColor: '#fffff' }} />}
            size={'xl'}
            onClick={() => {
              window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
              onCancel();
            }}
            className="text-[#ffff] w-full lg:w-[212px]"
          >
            {t('admin.buttons.edit')}
          </Button>
        )}

        <div className="flex flex-col gap-3">
          <Button
            variant="default"
            rounded={'full'}
            color="primary"
            suffixIcon={<Document height={28} width={28} />}
            size={'xl'}
            onClick={() => handleBookingAction('save')}
            disabled={isLoading && loadingButton !== 'save'}
            loading={loadingButton === 'save'}
            className="w-full lg:w-[212px]"
          >
            {t('admin.buttons.saveBooking')}
          </Button>
          <Button
            variant="default"
            rounded={'full'}
            color="white"
            size={'xl'}
            onClick={() => {
              clearStates();
              //onCancel();
              window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
            }}
            className="text-[#3B4DA0] w-full lg:w-[212px]"
          >
            {t('admin.buttons.newBudget')}
          </Button>
        </div>

        <Button
          variant="default"
          rounded={'full'}
          color="primary"
          suffixIcon={<ArrowRight height={28} width={28} />}
          size={'xl'}
          onClick={() => handleBookingAction('request')}
          disabled={isLoading && loadingButton !== 'request'}
          loading={loadingButton === 'request'}
          className="w-full lg:w-[212px]"
        >
          {t('admin.buttons.requestBooking')}
        </Button>
      </div>

      {/* Registration Modal receives current user data to pre-populate the form */}
      <RegistrationModal
        open={showRegistrationModal}
        onOpenChange={setShowRegistrationModal}
        onUserInfoSaved={handleUserInfoSaved}
        defaultUserData={user}
      />
    </>
  );
};

export default BookingActionButtons;
