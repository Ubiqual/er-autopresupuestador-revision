'use client';

import type { SearchSegmentPricing } from '@/types/searchedTrips';
import type { SegmentPricing } from '@/types/TravelCalculations';
import React from 'react';

interface SegmentDetailsProps {
  title: string;
  segment: SegmentPricing | SearchSegmentPricing;
  baseAddress?: string;
  dropoffAddress?: string;
  date?: Date;
}

const SegmentDetails = ({ title, segment, date }: SegmentDetailsProps) => {
  return (
    <div className="mb-4">
      <h4 className="font-semibold text-md">{title}</h4>
      <p>
        Distance/ Distancia: {segment.distance} km (Adjusted/Ajustada con toma y deje: {segment.adjustedDistance} km)
      </p>
      <p>
        Duration/ Duración: {segment.duration} min (Adjusted/Ajustada con toma y deje: {segment.adjustedDuration} min)
      </p>
      <p>Km Price (Without Minimum)/ Coste kilómetros (sin toma y deje): €{segment.kmPriceWithoutMinimum}</p>
      <p>Km Price (With Minimum)/ Coste kilómetros (con toma y deje): €{segment.kmPriceWithMinimum}</p>
      <p>Time Price (Without Minimum)/ Coste tiempo (sin toma y deje): €{segment.timePriceWithoutMinimum}</p>
      <p>Time Price (With Minimum)/ Coste tiempo (con toma y deje): €{segment.timePriceWithMinimum}</p>
      <p>Total Price Without Minimums/ Coste total (sin toma y deje): €{segment.priceWithoutMinimums}</p>
      <p>Total Price With Minimums/ Coste total (con toma y deje): €{segment.price}</p>
      <p>Rest Price (if applicable)/ Coste descanso 45 minutos (si procede): €{segment.restPrice}</p>
      <p>
        Total Price Without Rest/ Coste total sin descanso de 45 minutos: €{segment.totalPriceWithMinimumWithoutRest}
      </p>
      <p>
        Total Price With Minimums and With Rest/ Coste total con toma y deje + descanso de 45 minutos: €
        {segment.totalPrice}
      </p>
      {date && (
        <p>
          Arrival at pickup/ Llegada a recogida:{' '}
          {new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' }).format(date)}
        </p>
      )}
    </div>
  );
};

export default SegmentDetails;
