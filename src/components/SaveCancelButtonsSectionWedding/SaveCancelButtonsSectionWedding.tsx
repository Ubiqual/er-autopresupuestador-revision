import ArrowLeft from '@/assets/icons/left-arrow.svg';
import ArrowRight from '@/assets/icons/right-arrow.svg';
import { Button } from '@/components/ui';
import { useDailyStops } from '@/contexts/DailyStopsContext';
import { ToastType, useToastModal } from '@/contexts/ToastModalContext';
import type { StopData } from '@/types/TravelCalculations';
import { t } from '@/utils/i18n';
import type { RestHours, Service } from '@prisma/client';
import { differenceInHours } from 'date-fns';
import type { Dispatch, SetStateAction } from 'react';

interface SaveCancelButtonsSectionWeddingProps {
  closeModal: () => void;
  currentDay: number;
  pickupLocation: StopData;
  dropoffLocation: StopData;
  intermediateStops: StopData[];
  isTrip: boolean;
  isSaveDisabled: boolean;
  isExcursion: boolean;
  isWedding: boolean;
  restHours?: RestHours;
  allStops: StopData[];
  updateDropoffTime: (params: {
    intermediateStops: StopData[];
    dropoffLocation: StopData;
    dayKey: number;
    currentDay: number;
    pickupLocationRef: React.MutableRefObject<StopData>;
    drivingTimes: { [key: string]: number };
    dailyStops: Map<number, { pickup: StopData; dropoff: StopData; intermediates: StopData[] }>;
    isTrip: boolean;
    selectedService?: Service;
    returnTrips: { time: string }[];
    updateDailyStops: (day: number, data: { pickup: StopData; dropoff: StopData; intermediates: StopData[] }) => void;
    setDropoffLocation: Dispatch<SetStateAction<StopData>>;
  }) => StopData[];
  pickupLocationRef: React.MutableRefObject<StopData>;
  drivingTimes: { [key: string]: number };
  selectedService?: Service;
  setDropoffLocation: Dispatch<SetStateAction<StopData>>;
  parseTime: (timeStr: string) => Date;
  setSteps: (value: SetStateAction<number>) => void;
  validateReturnTrips: () => boolean;
  disableSwitchSteps: boolean;
  step: number;
}

const SaveCancelButtonsSectionWedding = ({
  closeModal,
  currentDay,
  pickupLocation,
  dropoffLocation,
  intermediateStops,
  isTrip,
  isSaveDisabled,
  isExcursion,
  isWedding,
  restHours,
  allStops,
  updateDropoffTime,
  pickupLocationRef,
  drivingTimes,
  selectedService,
  setDropoffLocation,
  parseTime,
  step,
  setSteps,
  validateReturnTrips,
  disableSwitchSteps
}: SaveCancelButtonsSectionWeddingProps) => {
  const { dailyStops, setDailyStops, updateDailyStops, returnTrips, numDays, setDisableSearch } = useDailyStops();
  const { showToast } = useToastModal();
  const handleSave = () => {
    const isValid = validateReturnTrips();
    if (!isValid) {
      return;
    }
    setDailyStops((prevDailyStops) => {
      const updatedDailyStops = new Map(prevDailyStops);
      updatedDailyStops.set(currentDay, {
        pickup: pickupLocation,
        dropoff: dropoffLocation,
        intermediates: intermediateStops
      });
      return updatedDailyStops;
    });

    if ((isWedding || isExcursion || isTrip) && pickupLocation.time && dropoffLocation.time) {
      const updatedStops = updateDropoffTime({
        intermediateStops,
        dropoffLocation,
        dayKey: currentDay,
        currentDay,
        pickupLocationRef,
        drivingTimes,
        dailyStops,
        isTrip,
        selectedService,
        returnTrips,
        updateDailyStops,
        setDropoffLocation
      });

      const firstTime = parseTime(pickupLocation.time!);
      const lastTime = parseTime(dropoffLocation.time!);
      const durationInHours = differenceInHours(lastTime, firstTime);

      if (!isTrip && durationInHours > (restHours?.excursionsLimit ?? 0)) {
        showToast({
          message: t('bookingPage.errors.longerThan14H', { hours: restHours!.excursionsLimit }),
          toastType: ToastType.error
        });
        return;
      }

      if (isTrip) {
        const startDate = dailyStops.get(0)?.pickup.time;
        const endDate = updatedStops[updatedStops.length - 1].time;
        const durationInHours = differenceInHours(new Date(endDate as string), new Date(startDate as string));

        if (durationInHours > numDays * 24) {
          showToast({
            message: t('bookingPage.errors.longerDriveThanDaysDefined', { days: numDays }),
            toastType: ToastType.error
          });
          setDisableSearch(true);
          return;
        }
      }

      allStops.splice(0, allStops.length, ...updatedStops);
    }

    setDisableSearch(false);
    const updatedDailyStops = new Map(dailyStops);
    updatedDailyStops.set(currentDay, {
      pickup: allStops[0],
      dropoff: allStops[allStops.length - 1],
      intermediates: allStops.slice(1, allStops.length - 1)
    });

    setDailyStops(updatedDailyStops);
    closeModal();
  };

  return (
    <div className="w-full flex flex-col lg:flex-row justify-center items-center space-x-0 space-y-2 lg:space-y-0 lg:space-x-4 mt-6">
      <Button
        variant="outline"
        rounded={'full'}
        prefixIcon={<ArrowLeft className="mr-20" height={17.5} width={21} style={{ currentColor: '#3B4DA0' }} />}
        size={'xl'}
        onClick={() => {
          closeModal();
          setDailyStops((prevDailyStops) => {
            const newDailyStops = new Map(prevDailyStops);
            newDailyStops.set(currentDay, {
              pickup: pickupLocation,
              dropoff: dropoffLocation,
              intermediates: intermediateStops
            });
            return newDailyStops;
          });
        }}
        className="w-full md:w-auto"
      >
        {t('admin.buttons.cancel')}
      </Button>
      {step === 0 ? (
        <Button
          variant="default"
          rounded={'full'}
          color="primary"
          suffixIcon={<ArrowRight className="ml-20" height={28} width={28} />}
          size={'xl'}
          onClick={() => setSteps(1)}
          disabled={disableSwitchSteps}
          className="w-full md:w-auto"
        >
          {t('admin.buttons.save')}
        </Button>
      ) : (
        <Button
          variant="default"
          rounded={'full'}
          color="primary"
          suffixIcon={<ArrowRight className="ml-20" height={28} width={28} />}
          size={'xl'}
          onClick={handleSave}
          disabled={isSaveDisabled}
          className="w-full md:w-auto"
        >
          {t('admin.buttons.save')}
        </Button>
      )}
    </div>
  );
};

export default SaveCancelButtonsSectionWedding;
