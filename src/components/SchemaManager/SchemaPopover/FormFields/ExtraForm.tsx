'use client';

import { Input, Label } from '@/components/ui';
import { t } from '@/utils/i18n';
import type { Extra } from '@prisma/client';
import React from 'react';
import type { SchemaData } from '../SchemaPopover';

interface ExtraFormProps<T extends SchemaData> {
  formData: Extra;
  handleChange: <K extends keyof T>(field: K, value: T[K]) => void;
}

const ExtraForm = <T extends SchemaData>({ formData, handleChange }: ExtraFormProps<T>) => {
  return (
    <div className="mb-4">
      <Label className="block text-sm font-medium mb-2">{t('admin.modalLabels.extras.name')}</Label>
      <Input
        type="text"
        value={formData.name || ''}
        onChange={(e) => handleChange('name' as keyof T, e.target.value as T[keyof T])}
      />

      <Label className="block text-sm font-medium mb-2 mt-4">{t('admin.modalLabels.extras.price')}</Label>
      <Input
        type="number"
        value={formData.price !== undefined ? formData.price.toString() : ''}
        onChange={(e) => handleChange('price' as keyof T, parseFloat(e.target.value) as T[keyof T])}
        suffix="€"
      />

      <Label className="block text-sm font-medium mb-2 mt-4">{t('admin.modalLabels.extras.hours')}</Label>
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
    </div>
  );
};

export default ExtraForm;
