'use client';

import React from 'react';

interface RestTimePriceProps {
  restTimePrice: number;
}

const RestTimePrice: React.FC<RestTimePriceProps> = ({ restTimePrice }) => (
  <div className="mb-4">
    <h4 className="font-semibold text-md">Rest Time Price/Precio tiempo descanso</h4>
    <p>45-minute Rest/Descanso 45 minutos: €{restTimePrice}</p>
  </div>
);

export default RestTimePrice;
