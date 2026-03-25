'use client';

import { Button } from '@/components/ui';
import { Dialog, DialogContent, DialogOverlay } from '@/components/ui/dialog';
import { LoadingContainer, LoadingContent } from '@/components/ui/loading';
import { ToastType, useToastModal } from '@/contexts/ToastModalContext';
import type { FullBookingsType } from '@/types/searchedTrips';
import { t } from '@/utils/i18n';
import type {
  BaseAddress,
  BaseCost,
  BusCategory,
  BusType,
  BusyHours,
  ConfigureTrips,
  ConfigureWeddings,
  Extra,
  GoogleIncrement,
  NightHours,
  RestHours,
  Season,
  SeasonDay,
  Service,
  ServiceMinimumPricing,
  VAT
} from '@prisma/client';
import { DialogTitle } from '@radix-ui/react-dialog';
import React, { useCallback, useEffect, useState } from 'react';
import BaseAddressForm from './FormFields/BaseAddressForm';
import BaseCostForm from './FormFields/BaseCost';
import BusCategoryForm from './FormFields/BusCategoryForm';
import BusTypeForm from './FormFields/BusTypeForm';
import BusyHoursForm from './FormFields/BusyHoursForm';
import ConfigureTripsForm from './FormFields/ConfigureTripsForm';
import ConfigureWeddingsForm from './FormFields/ConfigureWeddingsForm';
import ExtraForm from './FormFields/ExtraForm';
import GoogleIncrementForm from './FormFields/GoogleIncrementForm';
import NightHoursForm from './FormFields/NightHoursForm';
import RestHoursForm from './FormFields/RestHoursForm';
import SeasonForm from './FormFields/SeasonForm';
import ServiceForm from './FormFields/ServiceForm';
import ServiceMinimumPricingForm from './FormFields/ServiceMinimumPricingForm';
import VATForm from './FormFields/VATForm';

export type WithoutTimestamps<T> = Omit<T, 'createdAt' | 'updatedAt'>;

export type SchemaData =
  | WithoutTimestamps<BusType>
  | WithoutTimestamps<Service>
  | WithoutTimestamps<BusCategory>
  | WithoutTimestamps<BaseAddress>
  | WithoutTimestamps<VAT>
  | WithoutTimestamps<RestHours>
  | WithoutTimestamps<GoogleIncrement>
  | WithoutTimestamps<Season>
  | WithoutTimestamps<SeasonDay>
  | WithoutTimestamps<BaseCost>
  | WithoutTimestamps<BusyHours>
  | WithoutTimestamps<NightHours>
  | WithoutTimestamps<ServiceMinimumPricing>
  | WithoutTimestamps<Extra>
  | WithoutTimestamps<ConfigureTrips>
  | WithoutTimestamps<ConfigureWeddings>
  | WithoutTimestamps<FullBookingsType>;

interface SchemaPopoverProps<T extends SchemaData> {
  isOpen: boolean;
  onRequestClose: () => void;
  onSubmit: (formData: SchemaData) => Promise<void>;
  schemaType: string;
  initialData?: T;
  schemaTitle: string;
}

const SchemaPopover = <T extends SchemaData>({
  isOpen,
  onRequestClose,
  onSubmit,
  schemaType,
  initialData,
  schemaTitle
}: SchemaPopoverProps<T>) => {
  const { showToast } = useToastModal();
  const [formData, setFormData] = useState<T>(initialData || ({} as T));
  const [isFormValid, setIsFormValid] = useState(false);
  const [loading, setLoading] = useState(false);
  const isEditMode = initialData && Object.values(initialData).every((value) => value !== undefined);

  const handleChange = <K extends keyof T>(field: K, value: T[K]) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);
    validateForm(newFormData);
  };

  const validateForm = useCallback((data: T) => {
    const isEmptyObject = Object.keys(data).length === 0;
    const isValid = Object.values(data).every((value) => value !== undefined);
    setIsFormValid(!isEmptyObject && isValid);
  }, []);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      validateForm(initialData);
    }
  }, [initialData, validateForm]);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      await onSubmit(formData);
    } catch (error) {
      showToast({ message: `Ha ocurrido un error: ${error}`, toastType: ToastType.error });
    } finally {
      setLoading(false);
      onRequestClose();
    }
  };

  const renderFields = () => {
    switch (schemaType) {
      case 'BusType':
        return <BusTypeForm formData={formData as BusType} handleChange={handleChange} />;
      case 'Service':
        return <ServiceForm formData={formData as Service} handleChange={handleChange} />;
      case 'BusCategory':
        return <BusCategoryForm formData={formData as BusCategory} handleChange={handleChange} />;
      case 'BaseAddress':
        return <BaseAddressForm formData={formData as BaseAddress} handleChange={handleChange} />;
      case 'VAT':
        return <VATForm formData={formData as VAT} handleChange={handleChange} />;
      case 'RestHours':
        return <RestHoursForm formData={formData as RestHours} handleChange={handleChange} />;
      case 'GoogleIncrement':
        return <GoogleIncrementForm formData={formData as GoogleIncrement} handleChange={handleChange} />;
      case 'Season':
        return <SeasonForm formData={formData as Season} handleChange={handleChange} />;
      case 'BaseCost':
        return <BaseCostForm formData={formData as BaseCost} handleChange={handleChange} />;
      case 'BusyHours':
        return <BusyHoursForm formData={formData as BusyHours} handleChange={handleChange} />;
      case 'NightHours':
        return <NightHoursForm formData={formData as NightHours} handleChange={handleChange} />;
      case 'ServiceMinimumPricing':
        return <ServiceMinimumPricingForm formData={formData as ServiceMinimumPricing} handleChange={handleChange} />;
      case 'Extra':
        return <ExtraForm formData={formData as Extra} handleChange={handleChange} />;
      case 'ConfigureTrips':
        return <ConfigureTripsForm formData={formData as ConfigureTrips} handleChange={handleChange} />;
      case 'ConfigureWeddings':
        return <ConfigureWeddingsForm formData={formData as ConfigureWeddings} handleChange={handleChange} />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onRequestClose}>
      <DialogOverlay className="fixed inset-0 bg-black bg-opacity-50 z-50" />
      <DialogContent className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg shadow-lg z-50 w-[90%] max-w-[780px] h-[85%] max-h-[550px]">
        <div className="w-full">
          <DialogTitle className="text-lg font-medium  mb-4">
            {' '}
            {t('admin.pages.subTitle')} {t(`admin.pages.${schemaTitle}`)}
          </DialogTitle>
          {loading ? (
            <LoadingContainer>
              <LoadingContent></LoadingContent>
            </LoadingContainer>
          ) : (
            <>
              {renderFields()}
              <div className="mt-4 flex justify-center">
                <Button variant="default" onClick={handleSubmit} disabled={!isFormValid || loading} className="mr-2">
                  {isEditMode ? 'Actualizar' : 'Añadir'}
                </Button>
                <Button variant="destructive" onClick={onRequestClose} disabled={loading}>
                  Cancelar
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SchemaPopover;
