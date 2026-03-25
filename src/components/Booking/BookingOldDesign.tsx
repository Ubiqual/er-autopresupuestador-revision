/* eslint-disable max-lines */
'use client';

import { removeCustomExtra } from '@/app/api/removeExtra';
import Location from '@/assets/icons/location-outline.svg';
import { Button } from '@/components/ui/index';
import { useBusSelection } from '@/contexts/BusSelectionContext';
import { useDailyStops } from '@/contexts/DailyStopsContext';
import { useLocations } from '@/contexts/LocationsContext';
import useCalculateTravelTime from '@/hooks/useCalculateTravelTime';
import useTravelInfo from '@/hooks/useTravelInfo';
import type {
  FullBookingsType,
  FullPricingResult,
  ReturnTripStopData,
  SearchedApiResponse
} from '@/types/searchedTrips';
import type { MergedStop } from '@/types/stops';
import type { StopData } from '@/types/TravelCalculations';
import type { ReturnTrip, ReturnTripsPulledFromDB } from '@/types/WeedingReturnTrips';
import { formatPrice } from '@/utils/formatPrice';
import { t } from '@/utils/i18n';
import type {
  BusType,
  ConfigureTrips,
  ConfigureWeddings,
  CustomExtras,
  PricingDetails,
  RestHours,
  Service
} from '@prisma/client';
import { addHours, format, setMinutes, setSeconds, toDate } from 'date-fns';
import { es } from 'date-fns/locale';
import React, { useEffect, useRef, useState } from 'react';
import AddExtra from '../AddExtra/AddExtra';
import AdminBookingActionButtons from '../BookingActionButtons/AdminBookingActionButtons';
import { convertPricingDataToResults } from '../BookingDetails/utils/convertPricingDataToResults';
import DeleteCustomExtrasModal from '../DeleteCustomExtrasModal.tsx/DeleteCustomExtrasModal';
import GoogleMapComponent from '../GoogleMapComponent/GoogleMapComponent';
import LocationsInput from '../LocationsInput/LocationsInput';
import PickupDatePicker from '../PickupDatePicker/PickupDatePicker';
import PickupTimeInput from '../PickupTimeInput/PickupTimeInput';
import { default as ServiceSelectorOldDesign } from '../ServiceSelector/ServiceSelectorOldDesign';
import { LoadingContainer, LoadingContent } from '../ui/loading';
import AddressModal from './AddressModal/AddressModal';
import DaysSelectionModal from './AddressModal/DaysSelectionModal';
import BusSelection from './BusSelection';
import ExtrasList from './Pricing/ExtrasList';
import MinimumDistanceAdjustment from './Pricing/MinimumDistanceAdjustment';
import MinimumsPerDay from './Pricing/MinimumsPerDay';
import PickupToDropoffSegment from './Pricing/PickupToDropoffSegment';
import RestTimePrice from './Pricing/RestTimePrice';
import SegmentDetails from './Pricing/SegmentDetails';
import SelectedBusDetails from './Pricing/SelectedBusDetails';

const BookingOldDesign = ({
  baseAddress,
  services,
  busTypes,
  restHours,
  tripMinimums,
  weddingLimit,
  booking,
  userEmail,
  vat
}: {
  baseAddress: string;
  services: Service[];
  busTypes: BusType[];
  restHours?: RestHours;
  tripMinimums?: ConfigureTrips | null;
  weddingLimit?: ConfigureWeddings | null;
  booking?: FullBookingsType | null;
  userEmail: string;
  vat: number;
}) => {
  const [selectedService, setSelectedService] = useState(services[0]);
  const [date, setDate] = useState<Date>();
  const [isFormValid, setIsFormValid] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [selectedBusDetails, setSelectedBusDetails] = useState<PricingDetails[]>([]);
  const [pricingResults, setPricingResults] = useState<FullPricingResult[]>(
    booking?.pricingResults ? booking.pricingResults : []
  );
  const hasLoadedBookingStops = useRef(false);
  const [lastStopIndex, setLastStopIndex] = useState<number>();

  const [missingKmInfo, setMissingKmInfo] = useState<
    {
      missingKm: number;
      additionalPrice: number;
      effectiveDistance: number;
      adjustedDistance: number;
      differenceInTotalPrice: number; // Total price difference before and after adjustment
    }[]
  >([]);
  const [totalPriceForAllDays, setTotalPriceForAllDays] = useState<number>(0);
  const [customExtras, setCustomExtras] = useState<CustomExtras[]>([]);

  const { dailyStops, setDailyStops, numDays, setNumDays, disableSearch, clearDailyStops, setReturnTrips } =
    useDailyStops();
  const { busSelection, numberOfPeople, isDropdownOpen, updateBusSelection } = useBusSelection();

  const { isModalOpen } = useLocations();

  const isExcursion = selectedService.name === 'Excursiones';
  const isWedding = selectedService.name === 'Bodas';
  const isTrip = selectedService.name === 'Viajes';

  const isBusTypeEmpty = Object.keys(busSelection).length === 0;

  const { calculateTravelInfo, totalTravelInfo, loading, pricingData } = useTravelInfo({
    baseAddress,
    date,
    restHours,
    serviceName: selectedService.name,
    isTrip,
    weddingLimit,
    pricing: selectedBusDetails,
    bookingId: booking?.id,
    lastStopIndex: lastStopIndex || 0
  });

  const today = new Date();

  const currentTime = format(today, 'HH:mm');
  const { calculateDrivingTimes } = useCalculateTravelTime({
    stops: Array.from(dailyStops.values()).flatMap((dayStops) => [
      dayStops.pickup,
      ...dayStops.intermediates,
      dayStops.dropoff
    ]),
    initialDate: date || new Date(),
    pickupTime: dailyStops.get(0)?.pickup.time || currentTime,
    isExcursion,
    restHours,
    isWedding,
    baseAddress,
    isTrip,
    weddingLimit
  });

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
    if (isTrip && !loading && pricingData && dailyStops.size >= 1) {
      const totalPriceForMinKm = calculateMinimumDistancePrice();
      const totalPrice = calculateTotalPriceForMultipleDays();
      setTotalPriceForAllDays(totalPrice + (totalPriceForMinKm?.additionalPrice ?? 0));
    }
  }, [totalTravelInfo, pricingData, isTrip]);

  useEffect(() => {
    if (!booking) {
      return;
    }
    if (!hasLoadedBookingStops.current) {
      booking.buses.map((bus) => {
        const busId = busTypes.find((b) => b.numberOfPeople.toString() === bus.busTypeId)?.id || '';
        updateBusSelection({ ...busSelection, [busId]: bus.quantity }, busTypes);
      });

      setSelectedService(services.find((service) => service.name === booking?.serviceType) || services[0]);
      setNumDays(booking?.days);
      setDate(new Date(booking.date));
      setTotalPriceForAllDays(booking.totalPrice || 0);
      setCustomExtras(booking.customExtras);
    }
  }, [booking]);

  useEffect(() => {
    if (!booking || !date) {
      return;
    }
    if (!hasLoadedBookingStops.current) {
      (async () => {
        const returnTrips: ((typeof booking.dailyStops)[0]['intermediates'][0] & { time?: string })[] = [];
        const dailyStopsMap = new Map<
          number,
          {
            pickup: (typeof booking.dailyStops)[0]['pickup'] & { time?: string };
            dropoff: (typeof booking.dailyStops)[0]['dropoff'] & { time?: string };
            intermediates: ((typeof booking.dailyStops)[0]['intermediates'][0] & { time?: string })[];
          }
        >();
        let lastStopIndex = 0;
        booking.dailyStops.forEach((stop) => {
          const withBuses: ((typeof stop.intermediates)[0] & { time?: string })[] = [];
          const withoutBuses: ((typeof stop.intermediates)[0] & { time?: string })[] = [];

          ((stop.intermediates as ReturnTripStopData[]) || []).forEach((intermediate: ReturnTripStopData) => {
            const item = { ...intermediate, time: intermediate?.time };
            if (intermediate.buses && intermediate.buses.length > 0) {
              withBuses.push(item);
            } else {
              withoutBuses.push(item);
            }
          });

          if (withBuses.length > 0) {
            withoutBuses.push(withBuses[0]);
          }

          returnTrips.push(...withBuses);

          lastStopIndex = withoutBuses.length - 1;
          dailyStopsMap.set(stop.dayIndex, {
            pickup: { ...stop.pickup, time: stop.pickup?.time },
            dropoff: { ...stop.dropoff, time: stop.dropoff?.time },
            intermediates: withoutBuses
          });
        });

        await calculateDrivingTimes();
        setReturnTrips(booking.returnTrip as ReturnTrip[]);
        setLastStopIndex(lastStopIndex);

        setDailyStops(dailyStopsMap);
        hasLoadedBookingStops.current = true;
        setShowMap(true);
      })();
    }
  }, [booking, date, setDailyStops, setReturnTrips]);

  useEffect(() => {
    const BusDetails = (
      booking?.pricingResults?.flatMap((dayPricing) =>
        dayPricing?.details.filter((detail) => Object.keys(busSelection).includes(detail.numberOfPeople.toString()))
      ) || []
    ).filter(
      (detail, index, self) => index === self.findIndex((d) => d?.numberOfPeople === detail?.numberOfPeople)
    ) as PricingDetails[];
    setSelectedBusDetails(BusDetails);
  }, [busSelection]);

  useEffect(() => {
    if (pricingData === null) {
      return;
    }
    const convertedPricingData =
      pricingData &&
      pricingData.map((item, index) => ({
        result: {
          dayIndex: index, // Adding default dayIndex
          ...item.result
        }
      }));

    const convertedPricingResults = convertPricingDataToResults(
      convertedPricingData as unknown as SearchedApiResponse[]
    );
    if (convertedPricingResults) {
      const totalPriceSum = convertedPricingResults.reduce((acc, result) => acc + (result.totalPrice || 0), 0);
      setTotalPriceForAllDays(totalPriceSum);
    }

    if (pricingData) {
      setPricingResults(convertedPricingResults as FullPricingResult[]);
    }
    const BusDetails = (
      pricingData?.flatMap((dayPricing) =>
        dayPricing?.result?.details.filter((detail) =>
          Object.keys(busSelection).includes(detail.numberOfPeople.toString())
        )
      ) || []
    ).filter((detail, index, self) => index === self.findIndex((d) => d?.numberOfPeople === detail?.numberOfPeople));
    setSelectedBusDetails(BusDetails as unknown as PricingDetails[]);
  }, [pricingData]);

  const calculateTotalPriceForMultipleDays = () => {
    if (!pricingData || pricingData.length === 0) {
      return 0; // Return 0 if there is no pricing data
    }

    // Sum up the totalPrice for all days
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
      setShowMap(true);
    }
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

  // For pickup time, maxDateTime can be end of the day
  const maxDateTime = React.useMemo(() => {
    return addHours(minDateTime.setHours(0, 0, 0, 0), 23.5); // Adjust as needed
  }, [minDateTime]);

  const isLocationsSelected = isExcursion && !date;

  const calculateMinimumDistancePrice = () => {
    if (!totalTravelInfo || !pricingData) {
      return;
    }

    const totalDistance = totalTravelInfo
      .map((info) => parseFloat(info.totalDistance.split(' ')[0])) // Extract distance as number
      .reduce((acc, distance) => acc + distance, 0); // Sum up total distance in km
    const minimumKmPerDay = tripMinimums!.minimumKmPerDay;
    const adjustedDistance = Math.max(numDays * minimumKmPerDay, totalDistance); // Adjusted trip distance
    const totalDeficitKm = adjustedDistance - totalDistance; // Total deficit

    let additionalPrice = 0;
    let effectiveDistanceCost = 0;

    if (totalDeficitKm > 0) {
      for (const [busType, quantity] of Object.entries(busSelection)) {
        const busDetails = pricingData[0]?.result?.details.find(
          (detail) => detail.numberOfPeople === parseInt(busType)
        );

        if (busDetails) {
          const pricePerKm = busDetails.finalPricePerKm;
          effectiveDistanceCost += totalDistance * pricePerKm * quantity; // Cost of the actual kilometers driven
          additionalPrice += totalDeficitKm * pricePerKm * quantity; // Cost of the missing kilometers
        }
      }
    }

    const adjustedDistanceCost = effectiveDistanceCost + additionalPrice; // Total cost of adjusted distance
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

  const handlePriceChange = (index: number, field: 'finalPricePerKm' | 'finalPricePerMinute', value: number) => {
    setSelectedBusDetails((prev) => prev.map((bus, i) => (i === index ? { ...bus, [field]: value } : bus)));
  };

  const handleExtraAdded = (newExtra: CustomExtras) => {
    const finalPriceWithVat = newExtra.price * (1 + (vat ?? 0));
    setTotalPriceForAllDays((prevTotal) => prevTotal + finalPriceWithVat);
    setCustomExtras((prev) => [...prev, newExtra]);
  };

  const handleExtraRemove = ({ extra }: { extra: CustomExtras }) => {
    const finalPriceWithVat = extra.price * (1 + (vat ?? 0));
    setTotalPriceForAllDays((prevTotal) => prevTotal - finalPriceWithVat);
    setCustomExtras((prev) => prev.filter((item) => item.id !== extra.id));
    removeCustomExtra({ extraId: extra.id, bookingId: extra.bookingId, price: finalPriceWithVat });
  };
  const netPrice = totalPriceForAllDays / (1 + vat);
  const vatAmount = totalPriceForAllDays - netPrice;

  const allowEditing = booking && ['saved', 'requested', 'admin_saved'].includes(booking.bookingType);

  const allStops: MergedStop[] = Array.from(dailyStops.values()).flatMap((dayStops) => [
    dayStops.pickup,
    ...dayStops.intermediates,
    dayStops.dropoff
  ]);

  /* add each ReturnTrip (address + inner stops) */
  let extraReturnStops: MergedStop[] = [];
  if (booking?.returnTrip?.length) {
    extraReturnStops = booking.returnTrip.flatMap((rt: ReturnTripsPulledFromDB) => {
      const main: MergedStop = {
        address: rt.address,
        time: toDate(rt.time)?.toISOString(),
        buses: rt.buses as { busType: string; numberOfBuses: number }[] | undefined,
        day: 0
      };
      const inner: MergedStop[] = Array.isArray(rt.stops)
        ? (rt.stops as unknown as MergedStop[]).map((s: StopData) => ({
            ...s,
            time: toDate(s.time as string)?.toISOString(),
            buses: rt.buses as { busType: string; numberOfBuses: number }[] | undefined,
            day: 0
          }))
        : [];
      return [main, ...inner];
    });
  }

  /* remove duplicates (address + timestamp) that clash with forward stops */
  const forwardWithoutDupes = allStops.filter((f) => {
    const fTime = toDate(f.time as string)?.getTime();
    return !extraReturnStops.some((e) => e.address === f.address && toDate(e.time as string)?.getTime() === fTime);
  });

  /* build final list: everything except last forward stop → returns → last stop */
  let stopsToRender: MergedStop[] = forwardWithoutDupes;
  if (extraReturnStops.length) {
    stopsToRender = [...forwardWithoutDupes, ...extraReturnStops];
  }

  return (
    <div className="flex flex-col my-20 p-4 md:p-6 md:pb-20 w-full md:max-w-[72vw] mx-auto h-full justify-center items-center bg-[#f5f5f5] px-5 rounded-lg">
      {(!booking || allowEditing) && (
        <>
          <ServiceSelectorOldDesign
            services={services}
            selectedService={selectedService}
            loading={loading}
            onSelectService={(service) => {
              if (selectedService.name !== service.name) {
                setSelectedService(service);
                setShowMap(false);
                if (service.name === 'Viajes') {
                  setNumDays(2);
                } else {
                  setNumDays(1);
                }
                clearDailyStops();
              }
            }}
          />

          <div className="flex flex-col md:flex-col gap-4 md:flex-wrap md:gap-4 md:mb-4 md:max-w-[60vw]">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex gap-4">
                <PickupDatePicker
                  initialDate={date}
                  loading={loading}
                  onDateChange={(newDate) => {
                    setDate(newDate);
                    setShowMap(false); // Reset map visibility on date change
                  }}
                />
                <div className="md:flex-1 md:flex md:flex-col">
                  <PickupTimeInput
                    date={date}
                    loading={loading}
                    minTime={`${format(minDateTime, 'yyyy-MM-dd')} ${minTime}`}
                    maxTime={format(maxDateTime, 'yyyy-MM-dd HH:mm')}
                    setDate={(newDate) => {
                      setDate(newDate);
                      setShowMap(false); // Reset map visibility on time change
                    }}
                  />
                </div>
              </div>
              <div className="md:flex-1 md:flex md:flex-col md:justify-center">
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  {t('bookingPage.labels.selectBus')}
                </label>
                <BusSelection busTypes={busTypes} disabled={loading} />
              </div>
            </div>
            <div className="md:flex-1 md:flex md:flex-col md:justify-center">
              <LocationsInput
                selectedServiceName={selectedService.name}
                disabled={isLocationsSelected || loading || !date || isBusTypeEmpty}
                isTrip={isTrip}
              />
            </div>
          </div>

          <div className="md:flex-1 md:flex md:flex-col md:justify-end max-w-[full] order-last md:order-none mt-4 md:mt-0">
            <p className="text-sm text-gray-600 mb-2">{t('bookingPage.noTollsIncluded')}</p>
            <p className="text-sm text-gray-600 mb-2">*Tasa de entrada a ciudades no incluida</p>
            <div className="flex flex-row gap-2 mb-6">
              <Button
                variant="default"
                rounded={'full'}
                color="primary"
                size={'xl'}
                className="w-full lg:w-[212px]"
                onClick={handleSearch}
                disabled={!isFormValid || disableSearch}
                loading={loading}
              >
                {t('admin.buttons.search')}
              </Button>

              {pricingResults && !loading && (
                <div className="md:w-min-[120px]">
                  <AdminBookingActionButtons
                    baseAddress={baseAddress}
                    serviceType={selectedService.name}
                    selectedDate={date}
                    isTrip={isTrip}
                    totalPriceForAllDays={totalPriceForAllDays}
                    pricingData={pricingData}
                    initalPricingData={pricingResults}
                    totalTravelInfo={totalTravelInfo}
                    missingKmInfo={missingKmInfo}
                    vatAmount={formatPrice(vatAmount)}
                    userEmail={userEmail}
                    bookingId={booking?.id}
                    customExtras={customExtras}
                    showSendEmailButton={pricingResults.length > 0}
                    actionBookingType={booking?.bookingType}
                  />
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {loading && (
        <LoadingContainer>
          <LoadingContent></LoadingContent>
        </LoadingContainer>
      )}

      {pricingResults.length > 0 && !loading && (
        <div className="p-6 bg-white rounded-lg shadow-md">
          <h1 className="text-xl font-bold mb-6">{t('admin.pages.bookingDetails')}</h1>

          {/* Render Selected Bus Details */}
          {selectedBusDetails && (
            <div className="mt-8 mb-4">
              <SelectedBusDetails
                selectedBusDetails={selectedBusDetails}
                setPricePerKmAndMinute={handlePriceChange}
                allowEditing={allowEditing}
              />
            </div>
          )}

          {/* Add Extra Component */}
          {booking?.id && ['saved', 'requested', 'admin_saved'].includes(booking.bookingType) && (
            <div className="mb-6 mt-2">
              <AddExtra onExtraAdded={handleExtraAdded} bookingId={booking.id} vat={vat} />
            </div>
          )}
          {/* Render Total Price for All Days */}

          {/* Render Pricing Details Per Day */}
          {pricingResults.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold mb-6">
                Pricing Information (in Euros)/ Información de precios (en Euros)
              </h3>
              {pricingResults.map((dayPricing, dayIndex) => {
                const dayStops = booking?.dailyStops.find((stop) => stop.dayIndex === dayIndex + 1);
                return (
                  <div key={dayIndex} className="mb-8">
                    <h4 className="text-lg font-medium mb-4">
                      Day {dayIndex + 1}/ Día {dayIndex + 1}
                    </h4>
                    <div className="mb-4 border-b pb-4">
                      <p className="text-lg font-medium">Total Price: €/ Precio total: €{totalPriceForAllDays}</p>
                    </div>

                    {/* Base to Pickup Segment */}
                    {(dayPricing.dayIndex === 0 ||
                      (pricingResults.length > 1 && dayPricing?.segments[0]?.segmentStartTime !== '')) && (
                      <div className="mb-6">
                        <SegmentDetails
                          title="1. Base to Pickup/ 1. Toma y deje"
                          segment={dayPricing?.segments[0]}
                          baseAddress={baseAddress}
                          date={date}
                        />
                      </div>
                    )}

                    {/* Pickup to Dropoff Segment */}
                    <div className="mb-6">
                      <PickupToDropoffSegment
                        dayPricing={{
                          result: dayPricing
                        }}
                        dayIndex={dayIndex}
                        totalTravelInfo={[
                          {
                            totalDistance: dayPricing.segments[1]?.distance?.toString() ?? '',
                            totalDuration: dayPricing.segments[1]?.duration?.toString() ?? '',
                            baseToPickupDistance: pricingResults[dayIndex].segments[0].distance?.toString() ?? '',
                            pickupToDropoffDistance: pricingResults[dayIndex].segments[1].distance?.toString() ?? '',
                            dropoffToBaseDistance: pricingResults[dayIndex].segments[2].distance?.toString() ?? ''
                          }
                        ]}
                        isExcursion={selectedService.name === 'Excursiones'}
                        isWedding={selectedService.name === 'Bodas'}
                        isTrip={selectedService.name === 'Viajes'}
                      />
                    </div>

                    {/* Dropoff to Base Segment */}
                    {(dayPricing.dayIndex === pricingResults.length - 1 ||
                      (pricingResults.length > 1 && dayPricing?.segments[2]?.segmentStartTime !== '')) && (
                      <div className="mb-6">
                        <SegmentDetails
                          title="3. Dropoff to Base/ 3. Toma y deje"
                          segment={dayPricing?.segments[2]}
                          dropoffAddress={
                            pricingData ? dailyStops.get(dayIndex)?.dropoff.address : dayStops?.dropoff?.address || ''
                          }
                        />
                      </div>
                    )}

                    {/* Minimum Time Price Per Day */}
                    {selectedService.name === 'Viajes' && (
                      <div className="mb-6">
                        <MinimumsPerDay
                          totalDuration={dayPricing?.totalDuration ?? 0}
                          minimumPerDayDuration={dayPricing?.minimumPerDayDuration ?? 0}
                          minimumTimePerDayDuration={dayPricing?.minimumTimePerDayDuration ?? 0}
                          minimumPricePerDayDuration={dayPricing?.minimumPricePerDayDuration ?? 0}
                        />
                      </div>
                    )}

                    {/* Rest Time Price */}
                    {(dayPricing?.restTimePrice ?? 0) > 0 && (
                      <div className="mb-6">
                        <RestTimePrice restTimePrice={dayPricing?.restTimePrice ?? 0} />
                      </div>
                    )}

                    {/* Extras */}
                    {dayPricing?.extras?.length > 0 && (
                      <div className="mb-6">
                        <ExtrasList extras={dayPricing?.extras.map((item) => ('extra' in item ? item.extra : item))} />
                      </div>
                    )}
                    {customExtras.length > 0 && (
                      <div>
                        <h4 className="text-lg font-medium mt-4">
                          Additional Custom Extras/ Custom Extras adicionales
                        </h4>
                        {customExtras.map((extra, index) => (
                          <div key={index} className="ml-4 flex items-center ">
                            <p>
                              {extra.name}: €{extra.price}
                            </p>
                            <DeleteCustomExtrasModal extra={extra} handleExtraRemove={handleExtraRemove} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Render Missing KM Info */}
          {pricingResults && selectedService.name === 'Viajes' && missingKmInfo && (
            <div className="mt-8">
              <MinimumDistanceAdjustment missingKmInfo={missingKmInfo} />
            </div>
          )}
        </div>
      )}

      <AddressModal
        isOpen={isModalOpen}
        selectedService={selectedService}
        isExcursion={isExcursion}
        isWedding={isWedding}
        isTrip={isTrip}
        initialDate={date}
        restHours={restHours}
        baseAddress={baseAddress}
        tripMinimums={tripMinimums}
        weddingLimit={weddingLimit}
        editMode={true}
        initialLastStopIndex={lastStopIndex}
      />

      <DaysSelectionModal />

      <div className="relative mt-8 pl-6 w-full flex flex-col items-center">
        <div>
          {stopsToRender.map((stop, index) => (
            <div key={`${stop.address}-${index}`} className="relative pb-8">
              <div className="absolute -left-[32.148px] top-1 flex items-center justify-center">
                <Location width={24} height={24} style={{ color: 'black' }} />
              </div>
              {index !== stopsToRender.length - 1 && (
                <div className="absolute left-[-20.5px] top-[32px] h-[calc(100%-30px)] w-[1px] bg-gray-400" />
              )}
              <div className="text-gray-900">
                <p className="text-xl font-bold text-[#4554a1]">{stop.address}</p>
                {stop.time && (
                  <>
                    <p className="text-sm text-gray-700">{format(stop.time, "dd 'de' MMMM yyyy", { locale: es })}</p>
                    <p className="text-sm text-gray-700">{format(stop.time, 'HH:mm', { locale: es })}</p>
                  </>
                )}
                {stop.buses
                  ? stop.buses.map((bus, idx) => (
                      <p key={idx} className="text-sm text-gray-700">
                        {t(bus.numberOfBuses === 1 ? 'busSelection.singleBus' : 'busSelection.multipleBuses', {
                          count: bus.numberOfBuses,
                          seats: bus.busType
                        })}
                      </p>
                    ))
                  : Object.entries(busSelection).map(([seats, count]) => (
                      <p key={seats} className="text-sm text-gray-700">
                        {t(count === 1 ? 'busSelection.singleBus' : 'busSelection.multipleBuses', { count, seats })}
                      </p>
                    ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Render the GoogleMapComponent when showMap is true */}
      {showMap && (
        <div className="w-[100%] h-[366px] mb-8 lg:mb-0 mt-6">
          <GoogleMapComponent
            apiKey={process.env.NEXT_PUBLIC_GOOGLE_API_KEY!}
            baseAddress={baseAddress}
            showBaseAddress={false}
            width="100%"
            height="100%"
          />
        </div>
      )}
    </div>
  );
};

export default BookingOldDesign;
