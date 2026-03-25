'use client';

import ArrowRight from '@/assets/icons/right-arrow.svg';
import { Button } from '@/components/ui/index';
import { useBusSelection } from '@/contexts/BusSelectionContext';
import { useDailyStops } from '@/contexts/DailyStopsContext';
import { useLocations } from '@/contexts/LocationsContext';
import useTravelInfo from '@/hooks/useTravelInfo';
import { scrollToElement } from '@/lib/html';
import { t } from '@/utils/i18n';
import type { BusType, ConfigureTrips, ConfigureWeddings, RestHours, Service } from '@prisma/client';
import { addHours, format, setMinutes, setSeconds } from 'date-fns';
import React, { useEffect, useRef, useState } from 'react';
import LocationsInput from '../LocationsInput/LocationsInput';
import PickupDatePicker from '../PickupDatePicker/PickupDatePicker';
import PickupTimeInput from '../PickupTimeInput/PickupTimeInput';
import ServiceSelector from '../ServiceSelector/ServiceSelector';
import AddressModal from './AddressModal/AddressModal';
import AddressModalWedding from './AddressModal/AddressModalWedding';
import DaysSelectionModal from './AddressModal/DaysSelectionModal';
import BusSelection from './BusSelection';
import Results from './Results';

const Booking = ({
  baseAddress,
  services,
  busTypes,
  restHours,
  tripMinimums,
  weddingLimit,
  vat
}: {
  baseAddress: string;
  services: Service[];
  busTypes: BusType[];
  restHours?: RestHours;
  tripMinimums?: ConfigureTrips | null;
  weddingLimit?: ConfigureWeddings | null;
  vat: number;
}) => {
  const pickUpDateRef = useRef(null);
  const searchButtonRef = useRef<HTMLDivElement>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [date, setDate] = useState<Date>();
  const [isFormValid, setIsFormValid] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [lastStopIndex, setLastStopIndex] = useState<number | null>(null);

  const [missingKmInfo, setMissingKmInfo] = useState<
    {
      missingKm: number;
      additionalPrice: number;
      effectiveDistance: number;
      adjustedDistance: number;
      differenceInTotalPrice: number;
    }[]
  >([]);
  const [totalPriceForAllDays, setTotalPriceForAllDays] = useState<number>(0);

  const { dailyStops, setDailyStops, numDays, setNumDays, disableSearch, setReturnTrips } = useDailyStops();
  const { busSelection, numberOfPeople, isDropdownOpen, clearBusSelection } = useBusSelection();

  const { isModalOpen } = useLocations();

  const isExcursion = selectedService?.name === 'Excursiones';
  const isWedding = selectedService?.name === 'Bodas';
  const isTrip = selectedService?.name === 'Viajes';

  const isBusTypeEmpty = Object.keys(busSelection).length === 0;

  const { calculateTravelInfo, totalTravelInfo, loading, pricingData } = useTravelInfo({
    baseAddress,
    date,
    restHours,
    serviceName: selectedService?.name ?? '',
    isTrip,
    weddingLimit,
    lastStopIndex
  });

  const today = new Date();

  const currentTime = format(today, 'HH:mm');
  useEffect(() => {
    const allStops = Array.from(dailyStops.values()).flatMap((dayStops) => [
      dayStops.pickup,
      ...dayStops.intermediates,
      dayStops.dropoff
    ]);

    const isValid =
      allStops.length > 1 &&
      !!date &&
      !!numberOfPeople &&
      parseInt(numberOfPeople) > 0 &&
      allStops.every((stop) => stop.address);

    setIsFormValid(isValid);
  }, [dailyStops, date, numberOfPeople, busSelection, isExcursion]);

  useEffect(() => {
    if (pricingData && !loading) {
      setShowResults(true);
    }
  }, [pricingData, loading]);

  useEffect(() => {
    if (isTrip && !loading && pricingData && dailyStops.size >= 1) {
      const totalPriceForMinKm = calculateMinimumDistancePrice();
      const totalPrice = calculateTotalPriceForMultipleDays();
      setTotalPriceForAllDays(totalPrice + (totalPriceForMinKm?.additionalPrice ?? 0));
    }
  }, [totalTravelInfo, pricingData, isTrip]);

  const calculateTotalPriceForMultipleDays = () => {
    if (!pricingData || pricingData.length === 0) {
      return 0;
    }

    const totalPrice = pricingData.reduce((acc, dayPricing) => {
      if (dayPricing.result?.totalPrice) {
        return acc + dayPricing.result.totalPrice;
      }
      return acc;
    }, 0);

    return totalPrice;
  };

  const handleSearch = () => {
    if (!isDropdownOpen) {
      calculateTravelInfo();
    }
  };

  const handleCancel = () => {
    setShowResults(false);
  };

  const isTodaySelected = date && format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
  const minTime = isTodaySelected ? currentTime : '00:00';

  const minDateTime = React.useMemo(() => {
    let now = new Date();

    if (date) {
      now = date;
    }
    return setSeconds(setMinutes(now, (Math.ceil(now?.getMinutes() / 30) * 30) % 60), 0);
  }, [isTodaySelected, date]);

  const maxDateTime = React.useMemo(() => {
    return addHours(minDateTime.setHours(0, 0, 0, 0), 23.5);
  }, [minDateTime]);

  const isLocationsSelected = isExcursion && !date;

  const calculateMinimumDistancePrice = () => {
    if (!totalTravelInfo || !pricingData) {
      return;
    }

    const totalDistance = totalTravelInfo
      .map((info) => parseFloat(info.totalDistance.split(' ')[0]))
      .reduce((acc, distance) => acc + distance, 0);
    const minimumKmPerDay = tripMinimums!.minimumKmPerDay;
    const adjustedDistance = Math.max(numDays * minimumKmPerDay, totalDistance);
    const totalDeficitKm = adjustedDistance - totalDistance;

    let additionalPrice = 0;
    let effectiveDistanceCost = 0;

    if (totalDeficitKm > 0) {
      for (const [busType, quantity] of Object.entries(busSelection)) {
        const busDetails = pricingData[0]?.result?.details.find(
          (detail) => detail.numberOfPeople === parseInt(busType)
        );

        if (busDetails) {
          const pricePerKm = busDetails.finalPricePerKm;
          effectiveDistanceCost += totalDistance * pricePerKm * quantity;
          additionalPrice += totalDeficitKm * pricePerKm * quantity;
        }
      }
    }

    const adjustedDistanceCost = effectiveDistanceCost + additionalPrice;
    const differenceInTotalPrice = adjustedDistanceCost - effectiveDistanceCost;

    const missingKmData = {
      missingKm: totalDeficitKm,
      effectiveDistance: totalDistance,
      adjustedDistance,
      additionalPrice,
      differenceInTotalPrice // Total price difference
    };

    setMissingKmInfo([missingKmData]);

    return missingKmData;
  };

  const clearStates = () => {
    setDailyStops(new Map());
    setReturnTrips([]);
    clearBusSelection();
    setNumDays(1);
    setSelectedService(null);
    setDate(undefined);
    setShowResults(false);
    setMissingKmInfo([]);
    setTotalPriceForAllDays(0);
  };

  const onSelectService = (service: Service) => {
    if (selectedService?.name !== service.name) {
      setSelectedService(service);
      setNumDays(service.name === 'Viajes' ? 2 : 1);
      setDailyStops(new Map());
      setReturnTrips([]);
      scrollToElement({ ref: pickUpDateRef, maxWidth: 1280 });
    }
  };

  return (
    <div className="flex flex-col my-6 mb-20 xl:my-20 p-6 md:p-10 xl:p-20 w-full xl:w-[90%] xl:max-w-[1132px] mx-auto min-h-[600px] xl:min-h-[700px] justify-center items-center bg-[#f5f5f5] rounded-lg">
      {((showResults && (pricingData === null ? true : !!pricingData && !pricingData[0]?.result)) || !showResults) && (
        <div className="w-full overflow-x-auto">
          <div className="max-w-[1117px] mx-auto flex flex-col justify-center items-center">
            <h1 className="text-[#3b4da0] text-[30px] xl:text-[48px]  mb-10 mt-5">{t('bookingPage.title')}</h1>

            {/* ServiceSelector */}
            <div className="w-full">
              <ServiceSelector
                services={services}
                selectedService={selectedService}
                loading={loading}
                onSelectService={onSelectService}
              />
            </div>

            {/* Main form block — only shown after selecting a service */}
            {selectedService && (
              <>
                <div className="w-full mt-10 flex flex-col items-center xl:items-start">
                  <div className="flex flex-col gap-9 xl:gap-6 xl:flex-wrap  xl:mb-4 w-full max-w-full xl:max-w-[95%] items-center xl:items-start">
                    <div className="w-full grid grid-cols-1 xl:grid-cols-3 gap-9 flex flex-col">
                      <div className="max-w-full xl:w-full xl:max-w-[23.875rem]" ref={pickUpDateRef}>
                        <PickupDatePicker
                          initialDate={date}
                          loading={loading}
                          onDateChange={(newDate) => setDate(newDate)}
                        />
                      </div>

                      <div className="max-w-full xl:w-full xl:max-w-[23.875rem]">
                        <PickupTimeInput
                          date={date}
                          loading={loading}
                          minTime={`${format(minDateTime, 'yyyy-MM-dd')} ${minTime}`}
                          maxTime={format(maxDateTime, 'yyyy-MM-dd HH:mm')}
                          setDate={(newDate) => setDate(newDate)}
                        />
                      </div>

                      <div className="max-w-full xl:w-full xl:max-w-[23.875rem]">
                        <label className="block text-md font-medium text-[#313131] mb-4">
                          {t('bookingPage.labels.selectBus')}
                        </label>
                        <BusSelection busTypes={busTypes} disabled={loading} />
                      </div>
                    </div>

                    <div className="max-w-full w-full xl:max-w-full md:flex-1 md:flex md:flex-col md:justify-center mb-10">
                      <LocationsInput
                        selectedServiceName={selectedService.name}
                        disabled={isLocationsSelected || loading || !date || isBusTypeEmpty}
                        isTrip={isTrip}
                      />
                    </div>
                  </div>
                </div>

                {/* Search button */}
                <div ref={searchButtonRef} className="w-full flex justify-center items-center mt-4 xl:mt-0">
                  <Button
                    variant="default"
                    rounded="full"
                    color="primary"
                    suffixIcon={<ArrowRight className="ml-20" height={28} width={28} />}
                    size="xl"
                    onClick={handleSearch}
                    disabled={!isFormValid || disableSearch}
                    loading={loading}
                    className="w-full xl:w-[212px]"
                  >
                    {t('admin.buttons.search')}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {showResults && pricingData && pricingData[0]?.result && !loading && selectedService && (
        <Results
          totalPrice={totalPriceForAllDays || pricingData[0]?.result?.totalPrice}
          baseAddress={baseAddress}
          serviceType={selectedService.name}
          selectedDate={date}
          isTrip={isTrip}
          totalPriceForAllDays={totalPriceForAllDays}
          pricingData={pricingData}
          totalTravelInfo={totalTravelInfo}
          missingKmInfo={missingKmInfo}
          onCancel={handleCancel}
          vat={vat}
          clearStates={clearStates}
        />
      )}

      {selectedService && (
        <>
          <AddressModal
            isOpen={isModalOpen && selectedService.name !== 'Bodas'}
            selectedService={selectedService}
            isExcursion={isExcursion}
            isWedding={isWedding}
            isTrip={isTrip}
            initialDate={date}
            restHours={restHours}
            baseAddress={baseAddress}
            tripMinimums={tripMinimums}
            weddingLimit={weddingLimit}
            searchButtonRef={searchButtonRef}
          />

          <AddressModalWedding
            isOpen={isModalOpen && selectedService.name === 'Bodas'}
            selectedService={selectedService}
            isExcursion={isExcursion}
            isWedding={isWedding}
            isTrip={isTrip}
            initialDate={date}
            restHours={restHours}
            baseAddress={baseAddress}
            weddingLimit={weddingLimit}
            lastStopIndex={lastStopIndex}
            setLastStopIndex={setLastStopIndex}
          />
        </>
      )}

      <DaysSelectionModal />
    </div>
  );
};

export default Booking;
