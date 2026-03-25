'use client';

import MinimumDistanceAdjustment from '@/components/Booking/Pricing/MinimumDistanceAdjustment';
import MinimumsPerDay from '@/components/Booking/Pricing/MinimumsPerDay';
import PickupToDropoffSegment from '@/components/Booking/Pricing/PickupToDropoffSegment';
import RestTimePrice from '@/components/Booking/Pricing/RestTimePrice';
import SegmentDetails from '@/components/Booking/Pricing/SegmentDetails';
import SelectedBusDetails from '@/components/Booking/Pricing/SelectedBusDetails';
import TotalPriceForAllDays from '@/components/Booking/Pricing/TotalPriceForAllDays';
import { useBusSelection } from '@/contexts/BusSelectionContext';
import { useDailyStops } from '@/contexts/DailyStopsContext';
import useTravelInfo from '@/hooks/useTravelInfo';
import type { FullBookingsType, FullPricingResult, SearchedApiResponse } from '@/types/searchedTrips';
import { t } from '@/utils/i18n';
import loadGoogleMapsScript from '@/utils/loadGoogleMapsScript';
import type { BusType, ConfigureWeddings, CustomExtras, RestHours } from '@prisma/client';
import { useEffect, useMemo, useState } from 'react';
import AddExtra from '../AddExtra/AddExtra';
import ExtrasList from '../Booking/Pricing/ExtrasList';
import { Button } from '../ui';
import { convertPricingDataToResults } from './utils/convertPricingDataToResults';

const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;

export const BookingDetailsPage = ({
  booking,
  restHours,
  weddingLimit,
  busTypes
}: {
  booking: FullBookingsType;
  restHours?: RestHours | null;
  weddingLimit?: ConfigureWeddings | null;
  busTypes: BusType[];
}) => {
  const { dailyStops, buses } = booking;
  const [pricingResults, setPricingResults] = useState<FullPricingResult[]>(booking.pricingResults);

  const [busDetails, setBusDetails] = useState(pricingResults[0].details);
  const [totalPriceForAllDays, setTotalPriceForAllDays] = useState<number>(booking.totalPrice as number);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [customExtras, setCustomExtras] = useState<CustomExtras[]>([]);
  const { updateBusSelection } = useBusSelection();

  const { setDailyStops } = useDailyStops();
  const date = useMemo(() => new Date(booking.date), [booking.date]);
  const { calculateTravelInfo, pricingData } = useTravelInfo({
    baseAddress: booking.baseAddress,
    date,
    restHours: restHours as RestHours,
    serviceName: booking.serviceType,
    isTrip: booking.serviceType.toLowerCase() === 'viajes',
    weddingLimit,
    pricing: busDetails,
    lastStopIndex: dailyStops[dailyStops.length - 1]?.dayIndex
  });

  useEffect(() => {
    const dailyStopsMap = new Map(
      dailyStops.map((stop) => [
        stop.dayIndex,
        {
          pickup: {
            ...stop.pickup,
            time: stop.pickup?.time
          },
          dropoff: {
            ...stop.dropoff,
            time: stop.dropoff?.time
          },
          intermediates:
            stop.intermediates &&
            stop.intermediates.map((intermediate) => ({
              ...intermediate,
              time: intermediate?.time
            }))
        }
      ])
    );

    const initializeMap = async () => {
      await loadGoogleMapsScript(apiKey as string);
    };
    initializeMap();

    setDailyStops(dailyStopsMap);
  }, [dailyStops, setDailyStops]);

  useEffect(() => {
    if (busDetails.length > 0 && busTypes.length > 0) {
      const newBusSelection = buses.reduce(
        (acc, bus) => {
          const busType = busTypes.find((b) => b.numberOfPeople === parseFloat(bus.busTypeId));
          acc[busType!.id] = bus.quantity;
          return acc;
        },
        {} as { [key: string]: number }
      );
      updateBusSelection(newBusSelection, busTypes);
    }
  }, [busTypes]);

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
  }, [pricingData]);

  const handlePriceChange = (index: number, field: 'finalPricePerKm' | 'finalPricePerMinute', value: number) => {
    setBusDetails((prev) => prev.map((bus, i) => (i === index ? { ...bus, [field]: value } : bus)));
  };

  // Handle adding an extra and updating the UI total price

  const handleExtraAdded = (newExtra: CustomExtras) => {
    const finalPriceWithVat = newExtra.price;
    setTotalPriceForAllDays((prevTotal) => prevTotal + finalPriceWithVat);
    setCustomExtras((prev) => [...prev, newExtra]);
  };

  const busSummary = buses.map((bus) => ({
    busTypeId: bus.busTypeId,
    quantity: bus.quantity
  }));

  const handleRecalculate = async () => {
    setIsRecalculating(true);
    await calculateTravelInfo();
    setIsRecalculating(false);
  };

  const filteredBusDetails = busDetails.filter((busDetail) =>
    busSummary.some((bus) => bus.busTypeId === busDetail.numberOfPeople.toString())
  );

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-xl font-bold mb-6">{t('admin.pages.bookingDetails')}</h1>

      {/* Render Selected Bus Details */}
      {pricingResults[0].details?.length > 0 && (
        <div className="mt-8 mb-4">
          <SelectedBusDetails selectedBusDetails={filteredBusDetails} setPricePerKmAndMinute={handlePriceChange} />
        </div>
      )}

      <Button onClick={handleRecalculate} loading={isRecalculating}>
        {t('admin.buttons.recalculate')}
      </Button>

      {/* Add Extra Component */}
      <div className="mb-6 mt-2">
        <AddExtra onExtraAdded={handleExtraAdded} bookingId={booking.id} vat={0} />
      </div>

      {/* Render Bus Summary */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">{t('admin.bookings.bookedBusesTitle')}</h2>
        <ul className="list-disc list-inside space-y-2">
          {busSummary.map((bus, index) => (
            <li key={index}>{t('admin.bookings.busSummary', { busTypeId: bus.busTypeId, quantity: bus.quantity })}</li>
          ))}
        </ul>
      </div>

      {/* Render Total Price for All Days */}
      <div className="mb-8">
        <TotalPriceForAllDays
          pricingData={pricingResults.map((result) => ({ result }))}
          isTrip={dailyStops.length > 1}
          totalPriceForAllDays={totalPriceForAllDays}
          loading={false}
        />
      </div>

      {/* Render Pricing Details Per Day */}
      {pricingResults && (
        <div className="mt-6 bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-6">
            Pricing Information (in Euros)/ Información de precios (en Euros)
          </h3>
          {pricingResults.map((dayPricing, dayIndex) => {
            const dayStops = dailyStops.find((stop) => stop.dayIndex === dayIndex + 1);
            return (
              <div key={dayIndex} className="mb-8">
                <h4 className="text-lg font-medium mb-4">
                  Day {dayIndex + 1}/ Día {dayIndex + 1}
                </h4>
                <div className="mb-4 border-b pb-4">
                  <p className="text-lg font-medium">Total Price: €/ Precio total: €{dayPricing?.totalPrice}</p>
                </div>

                {/* Base to Pickup Segment */}
                {(dayPricing.dayIndex === 0 ||
                  (pricingResults.length > 1 && dayPricing?.segments[0]?.segmentStartTime !== '')) && (
                  <div className="mb-6">
                    <SegmentDetails
                      title="1. Base to Pickup/ 1. Toma y deje"
                      segment={dayPricing?.segments[0]}
                      baseAddress={booking.baseAddress}
                      date={new Date(booking.date)}
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
                    isExcursion={booking.serviceType === 'Excursiones'}
                    isWedding={booking.serviceType === 'Bodas'}
                    isTrip={booking.serviceType === 'Viajes'}
                  />
                </div>

                {/* Dropoff to Base Segment */}
                {(dayPricing.dayIndex === pricingResults.length - 1 ||
                  (pricingResults.length > 1 && dayPricing?.segments[2]?.segmentStartTime !== '')) && (
                  <div className="mb-6">
                    <SegmentDetails
                      title="3. Dropoff to Base/ 3. Toma y deje"
                      segment={dayPricing?.segments[2]}
                      dropoffAddress={dayStops?.dropoff?.address || ''}
                    />
                  </div>
                )}

                {/* Minimum Time Price Per Day */}
                {booking.serviceType === 'Viajes' && (
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
                    <ExtrasList extras={dayPricing?.extras.map((extra) => extra.extra)} />
                  </div>
                )}
                {customExtras.map((extra, index) => (
                  <div key={index} className="ml-4 flex items-center ">
                    <p>
                      {extra.name}: €{extra.price}
                    </p>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* Render Missing KM Info */}
      {pricingResults && booking.serviceType === 'Viajes' && booking.missingKmInfo && (
        <div className="mt-8">
          <MinimumDistanceAdjustment missingKmInfo={[booking.missingKmInfo]} />
        </div>
      )}
    </div>
  );
};
