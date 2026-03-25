import type { StopData } from '@/types/TravelCalculations';

export const setupMap = async (
  mapInstance: React.MutableRefObject<google.maps.Map | null>,
  mapRef: React.RefObject<HTMLDivElement>,
  overlaysRef: React.MutableRefObject<(google.maps.Polyline | google.maps.Marker)[]>
) => {
  // Import the new Map class from the "maps" library.
  //@ts-expect-error because in the google doc says to ignore this error
  const { Map } = await google.maps.importLibrary('maps');

  // Initialize the map with a valid vector map ID (from your Cloud Console)
  mapInstance.current = new Map(mapRef.current!, {
    center: { lat: 40.416775, lng: -3.70379 },
    zoom: 6,
    mapId: `${process.env.VECTOR_MAP_ID}`
  });

  clearOverlays(overlaysRef);
};

export const buildAddressList = (showBaseAddress: boolean, baseAddress?: string, stops?: StopData[]): string[] => {
  let addresses: string[] = [];
  if (showBaseAddress && baseAddress) {
    addresses.push(baseAddress);
  }
  if (stops) {
    addresses = addresses.concat(stops.map((stop) => stop.address));
  }
  if (showBaseAddress && baseAddress) {
    addresses.push(baseAddress);
  }
  return addresses;
};

export const geocodeAddresses = (addresses: string[]): Promise<google.maps.GeocoderResult[]> => {
  const geocoder = new google.maps.Geocoder();
  return Promise.all(
    addresses.map(
      (address) =>
        new Promise<google.maps.GeocoderResult>((resolve, reject) => {
          geocoder.geocode({ address }, (results, status) => {
            if (status === 'OK' && results && results.length > 0) {
              resolve(results[0]);
            } else {
              reject(`Geocode failed for: ${address}, status: ${status}`);
            }
          });
        })
    )
  );
};

export const renderRoute = (
  geocodedResults: google.maps.GeocoderResult[],
  directionsServiceRef: React.MutableRefObject<google.maps.DirectionsService | null>,
  mapInstance: React.MutableRefObject<google.maps.Map | null>,
  overlaysRef: React.MutableRefObject<(google.maps.Polyline | google.maps.Marker)[]>,
  showBaseAddress: boolean
) => {
  const directionsService = directionsServiceRef.current || new google.maps.DirectionsService();
  directionsServiceRef.current = directionsService;

  const startLocation = geocodedResults[0].geometry.location;
  const endLocation = geocodedResults[geocodedResults.length - 1].geometry.location;
  const waypoints = geocodedResults.slice(1, -1).map((result) => ({
    location: result.geometry.location,
    stopover: true
  }));

  directionsService.route(
    {
      origin: startLocation,
      destination: endLocation,
      waypoints,
      travelMode: google.maps.TravelMode.DRIVING
    },
    (result, status) => {
      if (status === google.maps.DirectionsStatus.OK && result) {
        renderCustomRoute(result.routes[0], mapInstance, overlaysRef, showBaseAddress);
        addMarkers(geocodedResults, mapInstance, overlaysRef, startLocation);
      }
    }
  );
};

export const renderCustomRoute = (
  route: google.maps.DirectionsRoute,
  mapInstance: React.MutableRefObject<google.maps.Map | null>,
  overlaysRef: React.MutableRefObject<(google.maps.Polyline | google.maps.Marker)[]>,
  showBaseAddress: boolean
) => {
  const colors = { baseToPickup: '#FF0000', trip: '#3B4DA0', dropoffToBase: '#00FF00' };

  route.legs.forEach((leg, index) => {
    let color = colors.trip;
    if (index === 0 && showBaseAddress) {
      color = colors.baseToPickup;
    }
    if (index === route.legs.length - 1 && showBaseAddress) {
      color = colors.dropoffToBase;
    }

    leg.steps.forEach((step) => {
      const polyline = new google.maps.Polyline({
        path: step.path,
        strokeColor: color,
        strokeOpacity: 1.0,
        strokeWeight: 4
      });
      polyline.setMap(mapInstance.current!);
      overlaysRef.current.push(polyline);
    });
  });

  const bounds = new google.maps.LatLngBounds();
  route.overview_path.forEach((path) => bounds.extend(path));
  mapInstance.current!.fitBounds(bounds);
};

// This function creates an advanced marker using the new importLibrary method.
async function createAdvancedMarker(mapInstance: google.maps.Map, position: google.maps.LatLng, logoPath: string) {
  //@ts-expect-error because in the google doc says to ignore this error
  const { AdvancedMarkerElement } = await google.maps.importLibrary('marker');
  const content = document.createElement('img');
  content.src = logoPath;
  content.style.width = '50px';
  content.style.height = '50px';
  const marker = new AdvancedMarkerElement({
    map: mapInstance,
    position,
    content
  });
  return marker;
}

export const addMarkers = async (
  geocodedResults: google.maps.GeocoderResult[],
  mapInstance: React.MutableRefObject<google.maps.Map | null>,
  overlaysRef: React.MutableRefObject<(google.maps.Polyline | google.maps.Marker)[]>,
  startLocation: google.maps.LatLng
) => {
  const logoPath = '/images/marker.png'; // Public path for your logo

  for (const [index, result] of geocodedResults.entries()) {
    const position = result.geometry.location;
    const isEndLocation = index === geocodedResults.length - 1;
    const isSameAsStart = position.lat() === startLocation.lat() && position.lng() === startLocation.lng();

    if (isEndLocation && isSameAsStart) {
      continue;
    }

    // Create an advanced marker asynchronously with the logo as content
    const marker = await createAdvancedMarker(mapInstance.current!, position, logoPath);
    overlaysRef.current.push(marker);
  }
};

export const clearOverlays = (overlaysRef: React.MutableRefObject<(google.maps.Polyline | google.maps.Marker)[]>) => {
  overlaysRef.current.forEach((overlay) => overlay.setMap(null));
  overlaysRef.current = [];
};

export const areStopsEqual = (stopsA: StopData[], stopsB: StopData[]): boolean => {
  if (stopsA.length !== stopsB.length) {
    return false;
  }
  return stopsA.every((stop, index) => {
    return JSON.stringify(stop) === JSON.stringify(stopsB[index]);
  });
};
