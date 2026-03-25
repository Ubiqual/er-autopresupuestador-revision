'use client';

import { Input, Label } from '@/components/ui';
import { t } from '@/utils/i18n';

import type { ConfigureTrips } from '@prisma/client';
import React from 'react';
import { convertDecimalToTime, convertTimeToDecimal } from '../../helper';
import type { SchemaData } from '../SchemaPopover';

interface ConfigureTripsFormProps<T extends SchemaData> {
  formData: ConfigureTrips;
  handleChange: <K extends keyof T>(field: K, value: T[K]) => void;
}

const ConfigureTripsForm = <T extends SchemaData>({ formData, handleChange }: ConfigureTripsFormProps<T>) => {
  return (
    <div className="mb-4">
      <Label className="block text-sm font-medium mb-2">
        {t('admin.modalLabels.configureTrips.minimumTimePerDay')}
      </Label>
      <div className="flex gap-2">
        <Input
          type="time"
          value={formData.minimumTimePerDay !== undefined ? convertDecimalToTime(formData.minimumTimePerDay) : ''}
          onChange={(e) => {
            const decimalValue = convertTimeToDecimal(e.target.value);
            handleChange('minimumTimePerDay' as keyof T, decimalValue as T[keyof T]);
          }}
        />
      </div>
      <Label className="block text-sm font-medium mb-2 mt-4">{t('admin.modalLabels.configureTrips.minimumKm')}</Label>
      <Input
        type="number"
        value={formData.minimumKmPerDay}
        onChange={(e) => handleChange('minimumKmPerDay' as keyof T, parseFloat(e.target.value) as T[keyof T])}
        suffix="km"
      />
    </div>
  );
};

export default ConfigureTripsForm;
