'use client';

import { Input, Label } from '@/components/ui';
import { t } from '@/utils/i18n';
import type { ServiceMinimumPricing } from '@prisma/client';
import React from 'react';
import type { SchemaData } from '../SchemaPopover';

interface ServiceMinimumPricingFormProps<T extends SchemaData> {
  formData: ServiceMinimumPricing;
  handleChange: <K extends keyof T>(field: K, value: T[K]) => void;
}

const ServiceMinimumPricingForm = <T extends SchemaData>({
  formData,
  handleChange
}: ServiceMinimumPricingFormProps<T>) => {
  return (
    <div className="mb-4">
      <Label className="block text-sm font-medium mb-2">{t('admin.modalLabels.serviceMinimumPricing.minimumKm')}</Label>
      <Input
        type="number"
        value={formData.minimumKM !== undefined ? formData.minimumKM.toString() : ''}
        onChange={(e) => handleChange('minimumKM' as keyof T, parseFloat(e.target.value) as T[keyof T])}
      />

      <Label className="block text-sm font-medium mb-2 mt-4">
        {t('admin.modalLabels.serviceMinimumPricing.minimumTime')}
      </Label>
      <Input
        type="number"
        value={formData.minimumTime !== undefined ? formData.minimumTime.toString() : ''}
        onChange={(e) => handleChange('minimumTime' as keyof T, parseInt(e.target.value) as T[keyof T])}
      />
    </div>
  );
};

export default ServiceMinimumPricingForm;
