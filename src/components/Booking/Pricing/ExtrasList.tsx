'use client';

import type { Extra } from '@prisma/client';
import React from 'react';

interface ExtrasListProps {
  extras: Extra[];
}

const ExtrasList: React.FC<ExtrasListProps> = ({ extras }) => (
  <div className="mb-4">
    <h4 className="text-lg font-medium mt-4">Additional Extras/ Extras adicionales</h4>
    {extras.map((extra, index) => (
      <div key={index} className="ml-4">
        <p>
          {extra.name}: €{extra.price}
        </p>
      </div>
    ))}
  </div>
);

export default ExtrasList;
