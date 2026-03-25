export interface StopData {
  address: string;
  time?: string;
  day: number;
}

export interface TransferCalculateRestParams {
  totalDrivingTime: number;
  dailyDrivingTime: number;
  accumulatedDrivingTime: number;
  currentDateTime: Date;
  totalRestTime: number;
  restTimestamps: Date[];
  drivingTimeLimitShortRestSeconds: number;
  MAX_DRIVING_TIME_SECONDS: number;
  shortRestDurationSeconds: number;
  restHours: RestHours;
}

export interface TransferCalculateRestReturn {
  totalRestTime: number;
  restTimestamps: Date[];
}

export interface CalculateRestAndWaitingTimeParams {
  serviceName: string;
  stops: StopData[];
  date: Date;
  MAX_EXCURSION_DURATION_SECONDS: number;
  MAX_DRIVING_TIME_SECONDS: number;
  restHours: RestHours;
  i: number;
  results: {
    distances: { origin: string; destination: string; value: number }[];
    durations: { origin: string; destination: string; value: number }[];
  };
  pickup: StopData;
  intermediates: StopData[];
  dropoff: StopData;
  returnTrips: ReturnTrip[];
  dailyStops: Map<number, { pickup: StopData; dropoff: StopData; intermediates: StopData[] }>;

  setLoading: (value: boolean) => void;
  setTotalTravelInfo: (
    value: SetStateAction<
      {
        totalDistance: string;
        totalDuration: string;
        baseToPickupDistance: string;
        pickupToDropoffDistance: string;
        dropoffToBaseDistance: string;
      }[]
    >
  ) => void;
  setPricingData: (value: SetStateAction<ApiResponse[] | null>) => void;
  totalRestTime: number;
  restTimestamps: Date[];
  totalWaitingTime: number;
  departureDateTime: Date;
  showToast: ({ message, toastType }: { message: string; toastType: ToastType }) => void;
}

export interface CalculateRestAndWaitingTimeReturn {
  error: boolean;
  totalRestTime: number;
  restTimestamps: Date[];
  totalWaitingTime: number;
}

export interface DistanceResults {
  distances: { origin: string; destination: string; value: number }[];
  durations: { origin: string; destination: string; value: number }[];
}

export interface FetchDistancesParams {
  service: google.maps.DistanceMatrixService;
  baseAddress: string;
  dailyStops: Map<number, { pickup: StopData; dropoff: StopData; intermediates: StopData[] }>;
  pickup: StopData;
  dropoff: StopData;
  stopPairs: StopData[][];
  date: Date;
  adjustmentPercentage: number;
  i: number;
  departureDateTime: Date;
  showToast: ({ message, toastType }: { message: string; toastType: ToastType }) => void;
}

export interface CheckForTimeErrorsParams {
  serviceName: string;
  lastStopToDropoffTime: number;
  weddingLimit?: ConfigureWeddings | null;
  setLoading: (value: boolean) => void;
  setTotalTravelInfo: (value: TravelDayInfo[]) => void;
  setPricingData: (value: ApiResponse[] | null) => void;
  totalDrivingDurationSeconds: number;
  MAX_DRIVING_TIME_SECONDS: number;
  baseToPickupDistance: number;
  dropoffToBaseDuration: number;
  pickupToDropoffDurationSeconds: number;
  restHours?: RestHours;
  showToast: ({ message, toastType }: { message: string; toastType: ToastType }) => void;
}

export interface AdjustTotalDistanceAndDurationForTripParams {
  isTrip: boolean;
  dailyStopsSize: number;
  dayIndex: number;
  distances: { origin: string; destination: string; value: number }[];
  durations: { origin: string; destination: string; value: number }[];
  serviceName: string;
  results: {
    distances: { origin: string; destination: string; value: number }[];
    durations: { origin: string; destination: string; value: number }[];
  };
  stops: StopData[];
  returnTrips: ReturnTrip[];
}

export type TravelSegment = {
  segmentStartTime: string;
  segmentEndTime: string;
  distance: number;
  duration: number;
  remainingCumulativeDrivingTime: number;
};

export type IndividualStopsDistanceAndDuration = {
  originIndex: number;
  destinationIndex: number;
  origin: string;
  destination: string;
  value: number;
};

export interface PricingDetails {
  numberOfPeople: number;
  finalPricePerKm: number;
  finalPricePerMinute: number;
  seasonAdjustment: string;
  busTypeAdjustment: number;
  busyTimeAdjustment: number | null;
  nightTimeAdjustment: number | null;
}
export interface MiddleSegmentPricing {
  origin: string;
  destination: string;
  distance: number;
  kmPrice: number;
  timePrice: number;
  priceWithoutRest: number;
  duration: number;
  restPrice: number;
  totalPrice: number;
  waitingTime: number;
  totalDuration: number;
  pickupTime: string;
  arrivalTime: string;
}

export interface SegmentPricing {
  segment: number;
  distance: number;
  duration: number;
  adjustedDistance: number;
  adjustedDuration: number;
  kmPrice: number;
  timePrice: number;
  price: number;
  priceWithoutMinimums: number;
  kmPriceWithMinimum: number;
  timePriceWithMinimum: number;
  kmPriceWithoutMinimum: number;
  timePriceWithoutMinimum: number;
  totalPriceWithMinimumWithoutRest: number;
  restPrice: number;
  totalPrice: number;
  segmentStartTime: string;
}

export interface PricingResult {
  details: PricingDetails[];
  segments: SegmentPricing[];
  restTimePrice: number;
  totalPrice: number;
  middleSegmentsWithPrices: MiddleSegmentPricing[];
  extras: Extra[];
  minimumPerDayDuration: number;
  minimumPricePerDayDuration: number;
  totalDuration: number;
  minimumTimePerDayDuration: number;
}

export interface ApiResponse {
  result: PricingResult;
}

export interface TravelDayInfo {
  totalDistance: string;
  totalDuration: string;
  baseToPickupDistance: string;
  pickupToDropoffDistance: string;
  dropoffToBaseDistance: string;
}

export type MinTimeResult = {
  time?: string;
  address?: string;
  error?: 'invalidDate' | 'drivingTimeExceeded' | 'drivingTimeExceeded2H';
};
