import type { StopData } from '@/types/TravelCalculations';
import type { ReturnTrip } from '@/types/WeedingReturnTrips';

export type MergedStop = StopData & {
  buses?: ReturnTrip['buses'];
};
