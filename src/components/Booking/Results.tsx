import Location from '@/assets/icons/location-outline.svg';
import { useBusSelection } from '@/contexts/BusSelectionContext';
import { useDailyStops } from '@/contexts/DailyStopsContext';
import type { MergedStop } from '@/types/stops';
import type { ApiResponse, StopData } from '@/types/TravelCalculations';
import type { ReturnTrip } from '@/types/WeedingReturnTrips';
import { formatPrice } from '@/utils/formatPrice';
import { t } from '@/utils/i18n';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import React from 'react';
import BookingActionButtons from '../BookingActionButtons/BookingActionButtons';
import GoogleMapComponent from '../GoogleMapComponent/GoogleMapComponent';

interface ResultsProps {
  totalPrice: number;
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
  vat: number;
  onCancel: () => void;
  clearStates: () => void;
}

/* ───────── helper: force a value into a real Date ───────── */
const toDate = (value: Date | string | undefined, selectedDate?: Date): Date | undefined => {
  if (!value) {
    return undefined;
  }
  if (value instanceof Date) {
    return value;
  }

  // 'HH:mm' → merge with selectedDate (or today)
  if (/^\d{2}:\d{2}$/.test(value)) {
    const base = selectedDate ? new Date(selectedDate) : new Date();
    const [h, m] = value.split(':').map(Number);
    base.setHours(h);
    base.setMinutes(m);
    base.setSeconds(0);
    base.setMilliseconds(0);
    return base;
  }

  // ISO string or any other parseable format
  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? undefined : parsed;
};

const Results = ({
  totalPrice,
  baseAddress,
  serviceType,
  selectedDate,
  isTrip,
  totalPriceForAllDays,
  pricingData,
  totalTravelInfo,
  missingKmInfo,
  vat,
  onCancel,
  clearStates
}: ResultsProps) => {
  const { dailyStops, returnTrips } = useDailyStops();
  const { busSelection } = useBusSelection();

  /* forward stops */
  const allStops: MergedStop[] = Array.from(dailyStops.values()).flatMap((dayStops) => [
    dayStops.pickup,
    ...dayStops.intermediates,
    dayStops.dropoff
  ]);

  /* add each ReturnTrip (address + inner stops) */
  let extraReturnStops: MergedStop[] = [];
  if (returnTrips?.length) {
    extraReturnStops = returnTrips.flatMap((rt: ReturnTrip) => {
      const main: MergedStop = {
        address: rt.address,
        time: toDate(rt.time, selectedDate)?.toISOString(),
        buses: rt.buses,
        day: 0
      };
      const inner: MergedStop[] = rt.stops.map((s: StopData) => ({
        ...s,
        time: toDate(s.time, selectedDate)?.toISOString(),
        buses: rt.buses,
        day: 0
      }));
      return [main, ...inner];
    });
  }

  /* remove duplicates (address + timestamp) that clash with forward stops */
  const forwardWithoutDupes = allStops.filter((f) => {
    const fTime = toDate(f.time, selectedDate)?.getTime();
    return !extraReturnStops.some((e) => e.address === f.address && toDate(e.time, selectedDate)?.getTime() === fTime);
  });

  /* build final list: everything except last forward stop → returns → last stop */
  let stopsToRender: MergedStop[] = forwardWithoutDupes;
  if (extraReturnStops.length) {
    stopsToRender = [...forwardWithoutDupes, ...extraReturnStops];
  }

  const netPrice = totalPrice / (1 + vat);
  const vatAmount = totalPrice - netPrice;
  const luxPrice = formatPrice(totalPrice * 0.2);

  return (
    <div className="flex flex-col items-center w-full lg:w-[70%]">
      <h1 className="text-[#3b4da0] text-[48px] mt-5 text-center">{t('results.summary')}</h1>
      {/* <h3 className="text-[#3b4da0] text-[20px] mt-5 text-center">{t('results.information')}</h3> */}
      <p
        className="text-[#000000CC] text-[15px] mb-8 lg:mb-20 mt-5 max-w-[566px] text-center"
        // GTM id
        id="presupuestador_autocares_busqueda"
      >
        {t('results.reminder')}
      </p>

      {/* Map + Timeline */}
      <div className="flex flex-col lg:flex-row w-full justify-between items-center">
        <div className="order-first lg:order-last w-full lg:w-[1024px] h-[366px] mb-8 lg:mb-0">
          <GoogleMapComponent
            apiKey={process.env.NEXT_PUBLIC_GOOGLE_API_KEY!}
            showBaseAddress={false}
            width="100%"
            height="100%"
          />
        </div>

        <div className="relative pl-6 order-last lg:order-first w-full flex flex-col items-center">
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
      </div>

      {/* totals */}
      <h1 className="text-[#4554A1] text-[1.875rem] font-bold mt-8 lg:mt-24">
        {t('results.totalPrice', { price: formatPrice(totalPrice) })}
        <sup>*</sup>
      </h1>
      <p className="text-md text-gray-600 mt-1 mb-10">{t('bookingPage.vat', { vat: formatPrice(vatAmount) })}</p>

      {serviceType.toLowerCase() !== 'bodas' && (
        <p className="text-md text-gray-600 mt-1 mb-10">
          {t('bookingPage.luxPromo', { price: luxPrice })} <b>Esteban Rivas Gran Lujo</b>
        </p>
      )}
      <p className="text-md text-gray-600 mt-0 lg:mt-10">{t('bookingPage.noTollsIncluded')}</p>
      <p className="text-md text-gray-600 mt-0 mb-10">*Tasa de entrada a ciudades no incluida</p>

      <BookingActionButtons
        baseAddress={baseAddress}
        serviceType={serviceType}
        selectedDate={selectedDate}
        isTrip={isTrip}
        totalPriceForAllDays={totalPriceForAllDays}
        pricingData={pricingData}
        totalTravelInfo={totalTravelInfo}
        missingKmInfo={missingKmInfo}
        vatAmount={formatPrice(vatAmount)}
        onCancel={onCancel}
        clearStates={clearStates}
      />
    </div>
  );
};

export default Results;
