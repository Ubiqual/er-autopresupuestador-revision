'use client';

import AddressAutocomplete from '@/components/Booking/AdressAutoComplete';
import { Label } from '@/components/ui';
import { t } from '@/utils/i18n';
import type { BaseAddress } from '@prisma/client';
import React, { useRef } from 'react';
import type { SchemaData } from '../SchemaPopover';

interface BaseAddressFormProps<T extends SchemaData> {
  formData: BaseAddress;
  handleChange: <K extends keyof T>(field: K, value: T[K]) => void;
}

const BaseAddressForm = <T extends SchemaData>({ formData, handleChange }: BaseAddressFormProps<T>) => {
  const addressRef = useRef<HTMLInputElement>(null);

  return (
    <div className="mb-4">
      <Label className="block text-sm font-medium mb-2">{t('admin.modalLabels.baseAddress.address')}</Label>
      <AddressAutocomplete
        ref={addressRef}
        value={formData.address || ''}
        onChange={(value) => handleChange('address' as keyof T, value as T[keyof T])}
        placeholder="Enter address"
      />
    </div>
  );
};

export default BaseAddressForm;
