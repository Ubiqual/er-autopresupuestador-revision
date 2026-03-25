'use client';
export function getLocationDetails(address: string): Promise<{ country: string | null; isInMadridCommunity: boolean }> {
  if (typeof google === 'undefined' || !google.maps) {
    throw new Error('Google Maps script not loaded');
  }

  const geocoder = new google.maps.Geocoder();

  return new Promise((resolve, reject) => {
    geocoder.geocode({ address }, (results, status) => {
      if (status === 'OK' && results && results.length > 0) {
        const addressComponents = results[0].address_components;

        // Extract country
        const countryComponent = addressComponents.find((component) => component.types.includes('country'));
        const country = countryComponent ? countryComponent.long_name : null;

        // Extract region or locality for Madrid-specific detection
        const regionComponent = addressComponents.find((component) =>
          component.types.includes('administrative_area_level_1')
        );
        const localityComponent = addressComponents.find((component) => component.types.includes('locality'));

        const region = regionComponent ? regionComponent.long_name : null;
        const locality = localityComponent ? localityComponent.long_name : null;

        // Check if it's in the Comunidad de Madrid
        const isInMadridCommunity = region === 'Comunidad de Madrid' || locality === 'Madrid';
        resolve({ country, isInMadridCommunity });
      } else {
        reject(new Error(`Geocoding failed: ${status}`));
      }
    });
  });
}
