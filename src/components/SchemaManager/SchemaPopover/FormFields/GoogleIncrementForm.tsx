'use client';

import { Input, Label } from '@/components/ui';
import { t } from '@/utils/i18n';
import type { GoogleIncrement } from '@prisma/client';
import React from 'react';
import type { SchemaData } from '../SchemaPopover';

interface GoogleIncrementFormProps<T extends SchemaData> {
  formData: GoogleIncrement;
  handleChange: <K extends keyof T>(field: K, value: T[K]) => void;
}

const GoogleIncrementForm = <T extends SchemaData>({ formData, handleChange }: GoogleIncrementFormProps<T>) => {
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
      <Label className="block text-sm font-medium mb-2">{t('admin.modalLabels.googleIncrement.increment')}</Label>
      <Input
        type="number"
        value={formData.adjustmentPercentage !== undefined ? (formData.adjustmentPercentage * 100).toFixed(0) : ''}
        onChange={(e) => handlePercentageChange(e.target.value)}
        suffix="%"
      />
    </div>
  );
};

export default GoogleIncrementForm;
