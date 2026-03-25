'use client';

import { Input, Label } from '@/components/ui';
import { t } from '@/utils/i18n';
import type { BusCategory } from '@prisma/client';
import React from 'react';
import type { SchemaData } from '../SchemaPopover';

interface BusCategoryFormProps<T extends SchemaData> {
  formData: BusCategory;
  handleChange: <K extends keyof T>(field: K, value: T[K]) => void;
}

const BusCategoryForm = <T extends SchemaData>({ formData, handleChange }: BusCategoryFormProps<T>) => {
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
        <Label className="block text-sm font-medium mb-2"></Label>
        <Input
          type="text"
          value={formData.name || ''}
          onChange={(e) => handleChange('name' as keyof T, e.target.value as T[keyof T])}
        />
      </div>
      <div className="mb-4">
        <Label className="block text-sm font-medium mb-2">
          {t('admin.modalLabels.busCategory.adjustmentPercentage')}
        </Label>
        <Input
          type="number"
          value={formData.adjustmentPercentage !== undefined ? formData.adjustmentPercentage * 100 : ''}
          onChange={(e) => handlePercentageChange(e.target.value)}
          suffix="%"
        />
      </div>
    </>
  );
};

export default BusCategoryForm;
