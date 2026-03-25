import type { JsonValue } from '@prisma/client/runtime/library';

export interface ReturnTrip {
  address: string;
  stops: StopData[];
  time: string; // 'HH:mm' format
  buses: { busType: string; numberOfBuses: number }[];
}

export interface ReturnTripsPulledFromDB {
  address: string;
  stops: JsonValue;
  time: string;
  buses: unknown;
}
