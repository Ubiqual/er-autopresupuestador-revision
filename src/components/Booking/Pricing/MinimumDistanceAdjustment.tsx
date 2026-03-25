'use client';

import { useDailyStops } from '@/contexts/DailyStopsContext';
import type { MissingKmInfo } from '@prisma/client';
import React from 'react';

interface MissingKmInfoProps {
  effectiveDistance: number;
  adjustedDistance: number;
  missingKm: number;
  additionalPrice: number;
}

interface MinimumDistanceAdjustmentProps {
  missingKmInfo: MissingKmInfoProps[] | MissingKmInfo[];
}

const MinimumDistanceAdjustment: React.FC<MinimumDistanceAdjustmentProps> = ({ missingKmInfo }) => {
  const { numDays } = useDailyStops();
  return (
    <div className="mt-6 bg-white p-4 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-3">Minimum Distance Adjustment/Ajuste distancia mínima viajes</h3>
      {missingKmInfo.map((info, index) => (
        <div key={index} className="mb-4">
          <ul>
            <li>
              <strong>Effective trip distance/Distancia viaje real:</strong> {info.effectiveDistance} kms
            </li>
            <li>
              <strong>
                Adjusted trip distance/Distancia viaje ajustado (Minimum Required/Minimo Requerido: {numDays * 200} km):
              </strong>{' '}
              {info.adjustedDistance} kms
            </li>
            <li>
              <strong>Missing kilometers/Kilómetros restantes para llegar a el mínimo:</strong> {info.missingKm} kms
            </li>
            <li>
              <strong>Added trip km cost/Coste distancia extra añadido por no llegar a mínimo:</strong> €
              {info.additionalPrice}
            </li>
          </ul>
        </div>
      ))}
    </div>
  );
};

export default MinimumDistanceAdjustment;
