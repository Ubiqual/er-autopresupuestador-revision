'use client';
import type { SearchedApiResponse } from '@/types/searchedTrips';
import type { ApiResponse, TravelDayInfo } from '@/types/TravelCalculations';
import React from 'react';

interface PickupToDropoffProps {
  dayPricing: ApiResponse | SearchedApiResponse;
  dayIndex: number;
  totalTravelInfo: TravelDayInfo[];
  isExcursion: boolean;
  isWedding: boolean;
  isTrip: boolean;
}

const PickupToDropoffSegment = ({
  dayPricing,
  dayIndex,
  totalTravelInfo,
  isExcursion,
  isWedding,
  isTrip
}: PickupToDropoffProps) => {
  return (
    <>
      {/* Pickup to Dropoff Segment */}
      <div className="mb-4">
        <h4 className="font-semibold text-md">2. Pickup to Dropoff/ Viaje efectivo (recogida a devolución)</h4>
        <p>Distance/ Distancia: {totalTravelInfo[dayIndex]?.pickupToDropoffDistance}</p>
        <p>
          Segment Price/ Precio total viaje efectivo: €
          {dayPricing.result?.middleSegmentsWithPrices?.reduce((acc, segment) => {
            return acc + (segment.totalPrice || 0);
          }, 0) || 0}
        </p>
      </div>

      {/* Individual Stops in Middle Segment */}
      {dayPricing.result?.middleSegmentsWithPrices?.map((segment, index: number) => (
        <div key={index} className="mb-4 pl-4 border-l-2 border-gray-300">
          <h4 className="font-semibold text-md">
            Stop {index + 1}: {segment.origin} to {segment.destination}
          </h4>
          <ul className="ml-4 list-disc list-inside">
            <li>Pickup time/Hora recogida: {segment.pickupTime}</li>
            <li>Distance/Distancia: {segment.distance} km</li>
            <li>Km Price/Coste kilómetros: €{segment.kmPrice}</li>
            <li>Driving Time to Stop/Tiempo conducción: {segment.duration} min.</li>
            {(isExcursion || isWedding || isTrip) && (
              <>
                <li>
                  Waiting Time/Tiempo de disposición: {segment.waitingTime ? `${segment.waitingTime} min.` : 'N/A'}
                </li>
                <li>Total Duration/ Duración total (incluyendo disposición): {segment.totalDuration} min.</li>
              </>
            )}
            <li>Time Price/Coste tiempo sin descanso 45 minutos: €{segment.timePrice}</li>
            <li>Price Without Rest/Coste total sin descanso: €{segment.priceWithoutRest}</li>
            <li>Rest Price (if applicable)/Coste descanso 45 minutos (si procede): €{segment.restPrice}</li>
            <li>Total Price (including rest)/Coste total (incluyendo descanso): €{segment.totalPrice}</li>
          </ul>
        </div>
      ))}
    </>
  );
};

export default PickupToDropoffSegment;
