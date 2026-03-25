import Location from '@/assets/icons/location-outline.svg';
import { Input } from '@/components/ui/index';
import loadGoogleMapsScript from '@/utils/loadGoogleMapsScript';
import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
  dropdownWidth?: number; // width passed from parent
}

const AddressAutocomplete = forwardRef<HTMLInputElement, AddressAutocompleteProps>(
  ({ value, onChange, onSelect, placeholder, disabled = false, dropdownWidth = 500 }, ref) => {
    const internalRef = useRef<HTMLInputElement>(null);
    const autocompleteRef = useRef<google.maps.places.Autocomplete>();

    useImperativeHandle(ref, () => internalRef.current as HTMLInputElement);

    useEffect(() => {
      const style = document.createElement('style');
      style.type = 'text/css';
      style.innerHTML = `
        .pac-container {
          width: ${dropdownWidth}px !important;
        }
      `;
      document.head.appendChild(style);

      return () => {
        document.head.removeChild(style);
      };
    }, [dropdownWidth]);

    useEffect(() => {
      const initAutocomplete = () => {
        if (!window.google || !window.google.maps) {
          return;
        }
        if (!autocompleteRef.current && internalRef.current) {
          const europeBounds = new window.google.maps.LatLngBounds(
            new window.google.maps.LatLng(34.5, -10.5),
            new window.google.maps.LatLng(71.2, 44.5)
          );

          autocompleteRef.current = new window.google.maps.places.Autocomplete(internalRef.current, {
            types: ['geocode', 'establishment'],
            bounds: europeBounds,
            strictBounds: true
          });

          autocompleteRef.current.addListener('place_changed', () => {
            const place = autocompleteRef.current!.getPlace();
            if (place.formatted_address && onChange) {
              onChange(place.formatted_address);
              if (onSelect) {
                onSelect(place.formatted_address);
              }
            }
          });
        }
      };

      loadGoogleMapsScript(apiKey as string).then(initAutocomplete);
    }, [onChange, onSelect]);

    return (
      <Input
        ref={internalRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="rounded-full"
        prefix={<Location width={24} height={24} style={{ color: '#bfbfbf' }} />}
      />
    );
  }
);

AddressAutocomplete.displayName = 'AddressAutocomplete';

export default AddressAutocomplete;
