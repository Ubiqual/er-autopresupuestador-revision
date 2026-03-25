'use client';

import React from 'react';

interface MinimumsPerDayProps {
  totalDuration?: number;
  minimumPerDayDuration?: number;
  minimumTimePerDayDuration?: number;
  minimumPricePerDayDuration?: number;
}

const MinimumsPerDay: React.FC<MinimumsPerDayProps> = ({
  totalDuration,
  minimumPerDayDuration,
  minimumTimePerDayDuration,
  minimumPricePerDayDuration
}) => (
  <>
    <h4 className="font-semibold text-md">4. Minimums Per Day for Trip/ Tiempo mínimo por día viaje</h4>
    <ul>
      <li>
        <strong>Actual trip time/ Tiempo viaje real:</strong> {totalDuration} min.
      </li>
      <li>
        <strong>Missing time/ Tiempo restante para llegar al mínimo:</strong> {minimumPerDayDuration} min.
      </li>
      <li>
        <strong>
          Adjusted time (Minimum required time per day: {minimumTimePerDayDuration} min.)/Tiempo ajustado (Tiempo mínimo
          requerido por día: {minimumTimePerDayDuration} min.):
        </strong>{' '}
        {minimumPerDayDuration === 0 ? totalDuration : minimumTimePerDayDuration} min.
      </li>
      <li>
        <strong>Added trip time cost/ Coste tiempo extra añadido por no llegar a mínimo:</strong> €
        {minimumPricePerDayDuration}
      </li>
    </ul>
  </>
);

export default MinimumsPerDay;
