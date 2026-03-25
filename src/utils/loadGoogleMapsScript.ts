let googleMapsScriptLoadingPromise: Promise<void> | null = null;

const loadGoogleMapsScript = (apiKey: string): Promise<void> => {
  if (googleMapsScriptLoadingPromise) {
    return googleMapsScriptLoadingPromise;
  }

  googleMapsScriptLoadingPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Window is undefined'));
      return;
    }

    if (document.getElementById('google-maps-script')) {
      resolve();
      return;
    }

    // Define a global callback function
    //@ts-expect-error because in the google doc says to ignore this error
    window.__initGoogleMaps = () => {
      resolve();
    };

    const script = document.createElement('script');
    script.id = 'google-maps-script';
    // Append the callback parameter to the URL
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&loading=async&libraries=places,geometry&language=es&v=beta&callback=__initGoogleMaps`;
    script.async = true;
    script.defer = true;

    script.onerror = () => reject(new Error('Failed to load the Google Maps script'));

    document.head.appendChild(script);
  });

  return googleMapsScriptLoadingPromise;
};

export default loadGoogleMapsScript;
