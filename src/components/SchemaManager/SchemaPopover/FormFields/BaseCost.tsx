'use client';

import { Input, Label } from '@/components/ui';
import { t } from '@/utils/i18n';
import type { BaseCost } from '@prisma/client';
import React from 'react';
import type { SchemaData } from '../SchemaPopover';

interface BaseCostFormProps<T extends SchemaData> {
  formData: BaseCost;
  handleChange: <K extends keyof T>(field: K, value: T[K]) => void;
}

const BaseCostForm = <T extends SchemaData>({ formData, handleChange }: BaseCostFormProps<T>) => (
  <>
    <div className="mb-4">
      <Label className="block text-sm font-medium mb-2">{t('admin.modalLabels.baseCost.pricePerKm')}</Label>
      <Input
        type="number"
        value={formData.pricePerKm || ''}
        onChange={(e) => handleChange('pricePerKm' as keyof T, Number(e.target.value) as T[keyof T])}
        suffix={'€'}
      />
    </div>
    <div className="mb-4">
      <Label className="block text-sm font-medium mb-2">{t('admin.modalLabels.baseCost.pricePerMinute')}</Label>
      <Input
        type="number"
        value={formData.pricePerMinute || ''}
        onChange={(e) => handleChange('pricePerMinute' as keyof T, Number(e.target.value) as T[keyof T])}
        suffix={'€'}
      />
    </div>
  </>
);

export default BaseCostForm;
