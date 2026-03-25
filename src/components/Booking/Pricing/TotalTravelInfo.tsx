'use client';

import React from 'react';

const TotalTravelInfo = ({
  totalTravelInfo,
  loading
}: {
  totalTravelInfo: {
    totalDistance: string;
    totalDuration: string;
    baseToPickupDistance: string;
    pickupToDropoffDistance: string;
    dropoffToBaseDistance: string;
  }[];
  loading: boolean;
}) => {
  return (
    <>
      {process.env.NODE_ENV === 'development' &&
        totalTravelInfo &&
        !loading &&
        totalTravelInfo[0]?.totalDuration &&
        totalTravelInfo[0]?.totalDuration !== '' && (
          <div className="mt-4">
            <h3 className="text-lg font-medium">Total Travel Information/Información de viaje</h3>
            {/* Combine Total Distance */}
            <p>
              Total Distance/Distancia total:{' '}
              {totalTravelInfo
                .map((info) => parseFloat(info.totalDistance.split(' ')[0])) // Extract distance as number
                .reduce((acc, distance) => acc + distance, 0)}{' '}
              km
            </p>
            <p>Total Duration/Duración total: {totalTravelInfo[0]?.totalDuration}</p>
          </div>
        )}
    </>
  );
};

export default TotalTravelInfo;
