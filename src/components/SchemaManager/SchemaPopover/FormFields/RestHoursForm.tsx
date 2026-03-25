'use client';

import { Input, Label } from '@/components/ui';
import { t } from '@/utils/i18n';
import type { RestHours } from '@prisma/client';
import React from 'react';
import { convertDecimalToTime, convertTimeToDecimal } from '../../helper';
import type { SchemaData } from '../SchemaPopover';

interface RestHoursFormProps<T extends SchemaData> {
  formData: RestHours;
  handleChange: <K extends keyof T>(field: K, value: T[K]) => void;
}

const RestHoursForm = <T extends SchemaData>({ formData, handleChange }: RestHoursFormProps<T>) => {
  return (
    <div className="mb-4">
      <Label className="block text-sm font-medium mb-2">{t('admin.modalLabels.restHours.maxDrivingTime')}</Label>
      <Input
        type="time"
        value={formData.drivingTime !== undefined ? convertDecimalToTime(formData.drivingTime) : ''}
        onChange={(e) => {
          const decimalValue = convertTimeToDecimal(e.target.value);
          handleChange('drivingTime' as keyof T, decimalValue as T[keyof T]);
        }}
      />

      <Label className="block text-sm font-medium mb-2 mt-4">{t('admin.modalLabels.restHours.mandatoryRest')}</Label>
      <Input
        type="time"
        value={formData.restDuration !== undefined ? convertDecimalToTime(formData.restDuration) : ''}
        onChange={(e) => {
          const decimalValue = convertTimeToDecimal(e.target.value);
          handleChange('restDuration' as keyof T, decimalValue as T[keyof T]);
        }}
      />
      <Label className="block text-sm font-medium mb-2 mt-4">
        {t('admin.modalLabels.restHours.excursionsDurationLimit')}
      </Label>
      <Input
        type="time"
        value={formData.excursionsLimit !== undefined ? convertDecimalToTime(formData.excursionsLimit) : ''}
        onChange={(e) => {
          const decimalValue = convertTimeToDecimal(e.target.value);
          handleChange('excursionsLimit' as keyof T, decimalValue as T[keyof T]);
        }}
      />
      <Label className="block text-sm font-medium mb-2 mt-4">{t('admin.modalLabels.restHours.fullDayDriving')}</Label>
      <Input
        type="time"
        value={formData.fullDayDriving !== undefined ? convertDecimalToTime(formData.fullDayDriving) : ''}
        onChange={(e) => {
          const decimalValue = convertTimeToDecimal(e.target.value);
          handleChange('fullDayDriving' as keyof T, decimalValue as T[keyof T]);
        }}
      />
      <Label className="block text-sm font-medium mb-2 mt-4">{t('admin.modalLabels.restHours.fullDayRest')}</Label>
      <Input
        type="time"
        value={formData.fullDayRest !== undefined ? convertDecimalToTime(formData.fullDayRest) : ''}
        onChange={(e) => {
          const decimalValue = convertTimeToDecimal(e.target.value);
          handleChange('fullDayRest' as keyof T, decimalValue as T[keyof T]);
        }}
      />
    </div>
  );
};

export default RestHoursForm;
