'use client';

import { Input, Label } from '@/components/ui';
import { t } from '@/utils/i18n';

import type { ConfigureWeddings } from '@prisma/client';
import React from 'react';
import { convertDecimalToTime, convertTimeToDecimal } from '../../helper';
import type { SchemaData } from '../SchemaPopover';

interface ConfigureWeddingsFormProps<T extends SchemaData> {
  formData: ConfigureWeddings;
  handleChange: <K extends keyof T>(field: K, value: T[K]) => void;
}

const ConfigureWeddingsForm = <T extends SchemaData>({ formData, handleChange }: ConfigureWeddingsFormProps<T>) => {
  return (
    <div className="mb-4">
      <Label className="block text-sm font-medium mb-2">{t('admin.modalLabels.configureWeddings.name')}</Label>
      <div className="flex gap-2">
        <Input
          type="time"
          value={formData.minimumReturnTime !== undefined ? convertDecimalToTime(formData.minimumReturnTime) : ''}
          onChange={(e) => {
            const decimalValue = convertTimeToDecimal(e.target.value);
            handleChange('minimumReturnTime' as keyof T, decimalValue as T[keyof T]);
          }}
        />
      </div>
    </div>
  );
};

export default ConfigureWeddingsForm;
