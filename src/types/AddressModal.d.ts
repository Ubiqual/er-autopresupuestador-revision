import type { StopData } from '@/components/Booking/AddressModal/AddressModal';
import type { ConfigureTrips, RestHours, Service } from '@prisma/client';
import type { Dispatch, SetStateAction } from 'react';
import type { ReturnTrip } from './WeedingReturnTrips';

export interface DailyStops {
  pickup: StopData;
  dropoff: StopData;
  intermediates: StopData[];
}

export interface UseDailyStopsManagerArgs {
  dailyStops: Map<number, DailyStops>;
  setDailyStops: Dispatch<SetStateAction<Map<number, DailyStops>>>;
  restHours?: RestHours; // Replace with your RestHours type if available
  tripMinimums?: ConfigureTrips | null; // Replace with ConfigureTrips type if available
  drivingTimes: Record<string, number>;
  isTrip: boolean;
  currentDay: number;
  selectedService: Service; // Replace with Service type if available
  returnTrips: ReturnTrip[]; // Replace with the appropriate type for return trips
  updateDailyStops: (day: number, stops: { pickup: StopData; dropoff: StopData; intermediates: StopData[] }) => void;
  setDropoffLocation: Dispatch<SetStateAction<StopData>>;
  initialDateAndTime: string;
}

export interface HandleMoreThan9HDriveParams {
  index: number;
  is2hourLimitExceeded: boolean;
  intermediateStops: StopData[];
  setIntermediateStops: Dispatch<SetStateAction<StopData[]>>;
  verifiedAddresses: boolean[];
  setVerifiedAddresses: Dispatch<SetStateAction<boolean[]>>;
  setisAddStopDisabled: Dispatch<SetStateAction<boolean>>;
  restHours?: RestHours;
  calculateDrivingTimes: (stops: StopData[]) => void;
  pickupLocationRef: MutableRefObject<StopData>;
  lastStopIndex: number | null;
  setDropoffLocation: Dispatch<SetStateAction<StopData>>;
  dropoffLocationRef: MutableRefObject<StopData>;
  showToastModal: ({ message, toastType }: { message: string; toastType: ToastType }) => void;
}

export interface ResetAllStatesParams {
  setDailyStops: Dispatch<
    SetStateAction<Map<number, { pickup: StopData; dropoff: StopData; intermediates: StopData[] }>>
  >;
  setCurrentDay: Dispatch<SetStateAction<number>>;
  setPickupLocation: Dispatch<SetStateAction<StopData>>;
  setDropoffLocation: Dispatch<SetStateAction<StopData>>;
  setIntermediateStops: Dispatch<SetStateAction<StopData[]>>;
  setVerifiedAddresses: Dispatch<SetStateAction<boolean[]>>;
  setIsAddStopDisabled: Dispatch<SetStateAction<boolean>>;
  pickupLocationRef: MutableRefObject<StopData>;
  dropoffLocationRef: MutableRefObject<StopData>;
  intermediateStopsRef: MutableRefObject<StopData[]>;
  initialDateAndTime: string;
  isExcursion: boolean;
  currentDay: number;
}

export interface CheckIntermediateStopTimeChangeParams {
  newTime: string;
  maxTime?: string;
  restHours?: RestHours;
}

export interface CheckIntermediateStopTimeChangeResult {
  shouldDisableAddStop: boolean;
  toastMessage?: string;
}

export interface ComputeIsSaveDisabledParams {
  pickupLocation: StopData;
  dropoffLocation: StopData;
  isExcursion: boolean;
  isTrip: boolean;
  isWedding: boolean;
  intermediateStops: StopData[];
  dailyStops: Map<number, { pickup: StopData; dropoff: StopData; intermediates: StopData[] }>;
  currentDay: number;
  returnTrips: ReturnTrip[];
}

export interface DailyStops {
  pickup: StopData;
  dropoff: StopData;
  intermediates: StopData[];
}

export interface UpdateDropoffTimeParams {
  intermediateStops: StopData[];
  dropoffLocation: StopData;
  dayKey: number;
  currentDay: number;
  pickupLocationRef: { current: StopData };
  drivingTimes: { [key: string]: number };
  dailyStops: Map<number, DailyStops>;
  isTrip: boolean;
  selectedService?: Service;
  returnTrips: { time: string; stops?: StopData[] }[];
  updateDailyStops: (day: number, data: { pickup: StopData; dropoff: StopData; intermediates: StopData[] }) => void;
  setDropoffLocation: Dispatch<SetStateAction<StopData>>;
}
