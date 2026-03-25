'use client';

import { Checkbox, Input, Label } from '@/components/ui';
import { t } from '@/utils/i18n';
import type { BusType } from '@prisma/client';
import React from 'react';
import type { SchemaData } from '../SchemaPopover';

interface BusTypeFormProps<T extends SchemaData> {
  formData: BusType;
  handleChange: <K extends keyof T>(field: K, value: T[K]) => void;
}

const BusTypeForm = <T extends SchemaData>({ formData, handleChange }: BusTypeFormProps<T>) => {
  const handlePercentageChange = (value: string) => {
    const numericValue = parseFloat(value);
    const decimalValue = numericValue / 100;
    handleChange(
      'adjustmentPercentage' as keyof T,
      !isNaN(numericValue) ? (decimalValue as T[keyof T]) : (undefined as T[keyof T])
    );
  };

  return (
    <>
      <div className="mb-4">
        <Label className="block text-sm font-medium mb-2">{t('admin.modalLabels.busType.numberOfPeople')}</Label>
        <Input
          type="number"
          value={formData.numberOfPeople !== undefined ? formData.numberOfPeople : ''}
          onChange={(e) => handleChange('numberOfPeople' as keyof T, e.target.valueAsNumber as T[keyof T])}
        />
      </div>
      <div className="mb-4">
        <Label className="block text-sm font-medium mb-2">{t('admin.modalLabels.busType.MinimumSeats')}</Label>
        <Input
          type="number"
          value={formData.rangeMinSeats !== undefined ? formData.rangeMinSeats : ''}
          onChange={(e) => handleChange('rangeMinSeats' as keyof T, e.target.valueAsNumber as T[keyof T])}
        />
      </div>
      <div className="mb-4">
        <Label className="block text-sm font-medium mb-2">{t('admin.modalLabels.busType.MaximumSeats')}</Label>
        <Input
          type="number"
          value={formData.rangeMaxSeats !== undefined ? formData.rangeMaxSeats : ''}
          onChange={(e) => handleChange('rangeMaxSeats' as keyof T, e.target.valueAsNumber as T[keyof T])}
        />
      </div>
      <div className="mb-4">
        <Label className="block text-sm font-medium mb-2">{t('admin.modalLabels.busType.adjustmentPercentage')}</Label>
        <Input
          type="number"
          value={formData.adjustmentPercentage !== undefined ? (formData.adjustmentPercentage * 100).toFixed(0) : ''}
          onChange={(e) => handlePercentageChange(e.target.value)}
          suffix="%"
        />
      </div>
      <div className="mb-4 flex items-center">
        <Checkbox
          checked={formData.isDefault}
          onCheckedChange={(checked) => handleChange('isDefault' as keyof T, checked as T[keyof T])}
        />
        <Label className="ml-2">Is Default</Label>
      </div>
    </>
  );
};

export default BusTypeForm;
