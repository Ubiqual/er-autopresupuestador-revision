import type { Bookings, BookingsSelectedBuses, CustomExtras, Extra, MissingKmInfo, Prisma } from '@prisma/client';
import type { StopData } from './TravelCalculations';
import type { ReturnTripsPulledFromDB } from './WeedingReturnTrips';

export type ReturnTripStopData = StopData & {
  buses: {
    busType: string;
    numberOfBuses: number;
  }[];
};
export type DailyStops = {
  id: string;
  tripId: string;
  dayIndex: number;
  pickup: StopData;
  dropoff: StopData;
  intermediates: StopData[] | ReturnTripStopData[];
};

export type FullPricingResult = Prisma.PricingResultGetPayload<{
  include: {
    segments: true;
    details: true;
    extras: { include: { extra: true } };
    middleSegmentsWithPrices: true;
  };
}>;

export interface SearchSegmentPricing {
  segment: number;
  distance: number | null;
  duration: number | null;
  adjustedDistance: number | null;
  adjustedDuration: number | null;
  kmPrice: number | null;
  timePrice: number | null;
  price: number | null;
  priceWithoutMinimums: number | null;
  kmPriceWithMinimum: number | null;
  timePriceWithMinimum: number | null;
  kmPriceWithoutMinimum: number | null;
  timePriceWithoutMinimum: number | null;
  totalPriceWithMinimumWithoutRest: number | null;
  restPrice: number | null;
  totalPrice: number | null;
  segmentStartTime: string | null;
}

export interface SearchedMiddleSegmentPricing {
  origin: string | null;
  destination: string | null;
  distance: number | null;
  kmPrice: number | null;
  timePrice: number | null;
  priceWithoutRest: number | null;
  duration: number | null;
  restPrice: number | null;
  totalPrice: number | null;
  waitingTime: number | null;
  totalDuration: number | null;
  pickupTime: string | null;
  arrivalTime: string | null;
}

export interface SearchedPricingDetails {
  id: string;
  pricingResultId: string;
  numberOfPeople: number;
  finalPricePerKm: number | null;
  finalPricePerMinute: number | null;
  seasonAdjustment: number | null;
  busTypeAdjustment: number | null;
  busyTimeAdjustment: number | null;
  nightTimeAdjustment: number | null;
}

export interface SearchedPricingResult {
  dayIndex: number;
  details: SearchedPricingDetails[];
  segments: SearchSegmentPricing[];
  restTimePrice: number | null;
  totalPrice: number | null;
  middleSegmentsWithPrices: SearchedMiddleSegmentPricing[];
  extras: { extra: Extra }[];
  minimumPerDayDuration: number | null;
  minimumPricePerDayDuration: number | null;
  totalDuration: number | null;
  minimumTimePerDayDuration: number | null;
}

export interface SearchedApiResponse {
  result: SearchedPricingResult;
}

export type FullBookingsType = Bookings & {
  dailyStops: DailyStops[];
  pricingResults: FullPricingResult[];
  missingKmInfo: MissingKmInfo | null;
  buses: BookingsSelectedBuses[];
  customExtras: CustomExtras[];
  returnTrip: ReturnTripsPulledFromDB[];
};
