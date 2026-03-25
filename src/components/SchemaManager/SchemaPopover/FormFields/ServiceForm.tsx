'use client';

import { Input, Label } from '@/components/ui';
import { t } from '@/utils/i18n';
import type { Service } from '@prisma/client';
import React from 'react';
import type { SchemaData } from '../SchemaPopover';

interface ServiceFormProps<T extends SchemaData> {
  formData: Service;
  handleChange: <K extends keyof T>(field: K, value: T[K]) => void;
}

const ServiceForm = <T extends SchemaData>({ formData, handleChange }: ServiceFormProps<T>) => (
  <>
    <div className="mb-4">
      <Label className="block text-sm font-medium mb-2">{t('admin.modalLabels.service.name')}</Label>
      <Input
        type="text"
        value={formData.name || ''}
        onChange={(e) => handleChange('name' as keyof T, e.target.value as T[keyof T])}
      />
    </div>
    <div className="mb-4">
      <Label className="block text-sm font-medium mb-2">{t('admin.modalLabels.service.order')}</Label>
      <Input
        type="number"
        value={formData.order || ''}
        onChange={(e) => handleChange('order' as keyof T, Number(e.target.value) as T[keyof T])}
      />
    </div>
  </>
);

export default ServiceForm;
