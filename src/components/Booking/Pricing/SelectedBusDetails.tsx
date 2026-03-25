'use client';

import type { PricingDetails } from '@prisma/client';
import React from 'react';

export interface BusDetail {
  numberOfPeople: number;
  finalPricePerKm: number;
  finalPricePerMinute: number;
  seasonAdjustment: string;
  busTypeAdjustment: number;
  busyTimeAdjustment: number | null;
  nightTimeAdjustment: number | null;
}

interface SelectedBusDetailsProps {
  selectedBusDetails: BusDetail[] | PricingDetails[];
  setPricePerKmAndMinute?: (index: number, field: 'finalPricePerKm' | 'finalPricePerMinute', value: number) => void;
  allowEditing?: boolean | null;
}

const SelectedBusDetails: React.FC<SelectedBusDetailsProps> = ({
  selectedBusDetails,
  setPricePerKmAndMinute,
  allowEditing
}) => (
  <div className="mt-4">
    <h3 className="text-lg font-medium">Selected Bus Pricing Details/Información autocar seleccionado</h3>
    {selectedBusDetails.map((detail, index) => (
      <div key={index} className="mt-2">
        <p className="font-semibold">
          Bus for {detail?.numberOfPeople} people:/Autocar para {detail?.numberOfPeople} personas:
        </p>
        <ul>
          <li>
            Price per Km/Precio por km:
            {setPricePerKmAndMinute && allowEditing ? (
              <span className="ml-2">
                €{' '}
                <input
                  type="number"
                  className="border p-1 rounded w-20"
                  value={detail.finalPricePerKm || 0}
                  onChange={(e) => setPricePerKmAndMinute(index, 'finalPricePerKm', parseFloat(e.target.value))}
                />
              </span>
            ) : (
              ` €${detail.finalPricePerKm}`
            )}
          </li>
          <li>
            Price per Minute/Precio por minuto:
            {setPricePerKmAndMinute && allowEditing ? (
              <span className="ml-2">
                €{' '}
                <input
                  type="number"
                  className="border p-1 rounded w-20"
                  value={detail.finalPricePerMinute || 0}
                  onChange={(e) => setPricePerKmAndMinute(index, 'finalPricePerMinute', parseFloat(e.target.value))}
                />
              </span>
            ) : (
              ` €${detail.finalPricePerMinute}`
            )}
          </li>
          <li>Season Adjustment/Ajustes precio temporada aplicado: {detail?.seasonAdjustment}</li>
          <li>Bus Type Adjustment/Ajustes precio tipo de autocar aplicado: {detail?.busTypeAdjustment}</li>
          {detail?.busyTimeAdjustment !== null && (
            <li>Busy Time Adjustment/Ajuste hora punta aplicado: {detail?.busyTimeAdjustment}</li>
          )}
          {detail?.nightTimeAdjustment !== null && (
            <li>Night Time Adjustment/Ajust nocturnidad aplicado: {detail?.nightTimeAdjustment}</li>
          )}
        </ul>
      </div>
    ))}
  </div>
);

export default SelectedBusDetails;
