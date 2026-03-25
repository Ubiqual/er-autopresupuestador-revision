'use client';

import { Input, Label } from '@/components/ui';
import { t } from '@/utils/i18n';
import type { Season } from '@prisma/client';
import React from 'react';
import { HexColorPicker } from 'react-colorful';
import type { SchemaData } from '../SchemaPopover';

interface SeasonFormProps<T extends SchemaData> {
  formData: Season;
  handleChange: <K extends keyof T>(field: K, value: T[K]) => void;
}

const SeasonForm = <T extends SchemaData>({ formData, handleChange }: SeasonFormProps<T>) => {
  const handlePercentageChange = (value: string) => {
    const numericValue = parseFloat(value);
    const decimalValue = numericValue / 100;
    handleChange(
      'adjustmentPercentage' as keyof T,
      !isNaN(numericValue) ? (decimalValue as T[keyof T]) : (undefined as T[keyof T])
    );
  };

  const handleColorChange = (color: string) => {
    handleChange('color' as keyof T, color as T[keyof T]);
  };

  return (
    <>
      <div className="mb-4">
        <Label className="block text-sm font-medium mb-2">{t('admin.modalLabels.season.name')}</Label>
        <Input
          type="text"
          value={formData.name || ''}
          onChange={(e) => handleChange('name' as keyof T, e.target.value as T[keyof T])}
        />
      </div>
      <div className="mb-4">
        <Label className="block text-sm font-medium mb-2">{t('admin.modalLabels.season.adjustmentPercentage')}</Label>
        <Input
          type="number"
          value={formData.adjustmentPercentage !== undefined ? (formData.adjustmentPercentage * 100).toFixed(0) : ''}
          onChange={(e) => handlePercentageChange(e.target.value)}
          suffix="%"
        />
      </div>
      <div className="mb-4">
        <Label className="block text-sm font-medium mb-2">Color</Label>
        <HexColorPicker color={formData.color || '#000000'} onChange={handleColorChange} />
      </div>
    </>
  );
};

export default SeasonForm;
