'use client';

import { Input, Label } from '@/components/ui';
import { t } from '@/utils/i18n';
import type { NightHours } from '@prisma/client';
import React from 'react';
import type { SchemaData } from '../SchemaPopover';

interface NightHoursFormProps<T extends SchemaData> {
  formData: NightHours;
  handleChange: <K extends keyof T>(field: K, value: T[K]) => void;
}

const NightHoursForm = <T extends SchemaData>({ formData, handleChange }: NightHoursFormProps<T>) => {
  const handlePercentageChange = (value: string) => {
    const numericValue = parseFloat(value);
    const decimalValue = numericValue / 100;
    handleChange(
      'adjustmentPercentage' as keyof T,
      !isNaN(numericValue) ? (decimalValue as T[keyof T]) : (undefined as T[keyof T])
    );
  };
  return (
    <div className="mb-4">
      <Label className="block text-sm font-medium mb-2">{t('admin.modalLabels.nightHours.nightHours')}</Label>
      <div className="flex gap-2">
        <Input
          type="time"
          value={formData.startTime || ''}
          onChange={(e) => handleChange('startTime' as keyof T, e.target.value as T[keyof T])}
        />
        <Input
          type="time"
          value={formData.endTime || ''}
          onChange={(e) => handleChange('endTime' as keyof T, e.target.value as T[keyof T])}
        />
      </div>

      <Label className="block text-sm font-medium mb-2 mt-4">
        {t('admin.modalLabels.nightHours.adjustmentPercentage')}
      </Label>
      <Input
        type="number"
        value={formData.adjustmentPercentage !== undefined ? formData.adjustmentPercentage * 100 : ''}
        onChange={(e) => handlePercentageChange(e.target.value)}
        suffix="%"
      />
    </div>
  );
};

export default NightHoursForm;
