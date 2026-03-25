'use client';

import type { StopData } from '@/types/TravelCalculations';
import type { ReturnTrip } from '@/types/WeedingReturnTrips';
import { debounce } from 'lodash';
import { createContext, useCallback, useContext, useState } from 'react';

// Define the shape of the state
export type DailyStopsState = Map<number, { pickup: StopData; dropoff: StopData; intermediates: StopData[] }>;

interface DailyStopsContextType {
  dailyStops: DailyStopsState;
  setDailyStops: React.Dispatch<React.SetStateAction<DailyStopsState>>;
  updateDailyStops: (day: number, stops: { pickup: StopData; dropoff: StopData; intermediates: StopData[] }) => void;
  clearDailyStops: () => void;

  returnTrips: ReturnTrip[];
  setReturnTrips: React.Dispatch<React.SetStateAction<ReturnTrip[]>>;

  numDays: number;
  setNumDays: React.Dispatch<React.SetStateAction<number>>;

  disableSearch: boolean;
  setDisableSearch: React.Dispatch<React.SetStateAction<boolean>>;
}

// Create a context
const DailyStopsContext = createContext<DailyStopsContextType | null>(null);

// Provider Component
export const DailyStopsProvider = ({ children }: { children: React.ReactNode }) => {
  const [dailyStops, setDailyStops] = useState<DailyStopsState>(new Map());
  const [returnTrips, setReturnTrips] = useState<ReturnTrip[]>([]);
  const [numDays, setNumDays] = useState(1);
  const [disableSearch, setDisableSearch] = useState(false);

  const updateDailyStops = useCallback(
    debounce((day: number, stops: { pickup: StopData; dropoff: StopData; intermediates: StopData[] }) => {
      setDailyStops((prev) => {
        const newStops = new Map(prev); // Clone the previous map
        if (stops.pickup.address !== '') {
          newStops.set(day, stops); // Update stops for the specified day
        }
        return newStops;
      });
    }, 300),
    []
  );

  const clearDailyStops = () => {
    setDailyStops(new Map());
    setReturnTrips([]); // Clear return trips too
  };

  return (
    <DailyStopsContext.Provider
      value={{
        dailyStops,
        setDailyStops,
        updateDailyStops,
        clearDailyStops,
        returnTrips,
        setReturnTrips,
        numDays,
        setNumDays,
        disableSearch,
        setDisableSearch
      }}
    >
      {children}
    </DailyStopsContext.Provider>
  );
};

// Custom Hook for Consuming Context
export const useDailyStops = () => {
  const context = useContext(DailyStopsContext);
  if (!context) {
    throw new Error('useDailyStops must be used within DailyStopsProvider');
  }
  return context;
};
