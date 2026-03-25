'use client';

import { Input, Label } from '@/components/ui';
import { t } from '@/utils/i18n';
import type { VAT } from '@prisma/client';
import React from 'react';
import type { SchemaData } from '../SchemaPopover';

interface VATFormProps<T extends SchemaData> {
  formData: VAT;
  handleChange: <K extends keyof T>(field: K, value: T[K]) => void;
}

const VATForm = <T extends SchemaData>({ formData, handleChange }: VATFormProps<T>) => {
  const handlePercentageChange = (value: string) => {
    const numericValue = parseFloat(value);
    const decimalValue = numericValue / 100;
    handleChange('rate' as keyof T, !isNaN(numericValue) ? (decimalValue as T[keyof T]) : (undefined as T[keyof T]));
  };

  return (
    <div className="mb-4">
      <Label className="block text-sm font-medium mb-2">{t('admin.modalLabels.VAT.vatRate')}</Label>
      <Input
        type="number"
        value={formData.rate !== undefined ? (formData.rate * 100).toFixed(0) : ''}
        onChange={(e) => handlePercentageChange(e.target.value)}
        suffix="%"
      />
    </div>
  );
};

export default VATForm;
