'use client';
import type { SearchedApiResponse } from '@/types/searchedTrips';
import type { ApiResponse } from '@/types/TravelCalculations';
import React from 'react';

const TotalPriceForAllDays = ({
  pricingData,
  isTrip,
  totalPriceForAllDays,
  loading
}: {
  pricingData: ApiResponse[] | SearchedApiResponse[] | null;
  isTrip: boolean;
  totalPriceForAllDays: number;
  loading: boolean;
}) => {
  return (
    <>
      {pricingData && isTrip && totalPriceForAllDays > 0 && !loading && (
        <div className="mt-4">
          <h3 className="text-xl font-medium">Total Price for All Days / Precio total viaje</h3>
          <p className="text-base">€{totalPriceForAllDays}</p>
        </div>
      )}
    </>
  );
};

export default TotalPriceForAllDays;
