'use client';

import { useDailyStops } from '@/contexts/DailyStopsContext';
import type { StopData } from '@/types/TravelCalculations';
import loadGoogleMapsScript from '@/utils/loadGoogleMapsScript';
import React, { useEffect, useRef } from 'react';
import { areStopsEqual, buildAddressList, geocodeAddresses, renderRoute, setupMap } from './helper';

interface GoogleMapComponentProps {
  apiKey: string;
  baseAddress?: string;
  showBaseAddress?: boolean;
  width?: string;
  height?: string;
}

const GoogleMapComponent: React.FC<GoogleMapComponentProps> = ({
  apiKey,
  baseAddress,
  showBaseAddress = false,
  width = '100%',
  height = '500px'
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null);
  const overlaysRef = useRef<(google.maps.Polyline | google.maps.Marker)[]>([]);
  const previousStopsRef = useRef<StopData[]>([]);

  const { dailyStops } = useDailyStops();

  const stops = Array.from(dailyStops.values()).flatMap((dayStops) => [
    dayStops.pickup,
    ...dayStops.intermediates,
    dayStops.dropoff
  ]);

  useEffect(() => {
    const initializeMap = async () => {
      // Check if the stops are the same as previous
      if (areStopsEqual(previousStopsRef.current, stops)) {
        return;
      }

      // Update previous stops
      previousStopsRef.current = [...stops];

      await loadGoogleMapsScript(apiKey);
      if (!mapRef.current) {
        return;
      }

      setupMap(mapInstance, mapRef, overlaysRef);

      const addresses = buildAddressList(showBaseAddress, baseAddress, stops);
      if (addresses.length >= 2) {
        const geocodedResults = await geocodeAddresses(addresses);
        renderRoute(geocodedResults, directionsServiceRef, mapInstance, overlaysRef, showBaseAddress);
      }
    };

    initializeMap();
  }, [stops, apiKey, baseAddress, showBaseAddress]);

  return <div ref={mapRef} style={{ width, height, borderRadius: '22px' }} />;
};

export default GoogleMapComponent;
