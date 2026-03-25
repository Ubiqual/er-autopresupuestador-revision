'use client';

import type { SchemaName } from '@/app/(isolated)/admin/[schema]/page';
import { createOrUpdateItem } from '@/app/api/admin/createOrUpdateItem';
import { deleteSchemaItem } from '@/app/api/admin/deleteItems';
import { ToastType, useToastModal } from '@/contexts/ToastModalContext';
import { formatPrice } from '@/utils/formatPrice';
import { t } from '@/utils/i18n';
import type { BusType, SeasonDay } from '@prisma/client';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '../ui/button';
import { LoadingContainer, LoadingContent } from '../ui/loading';
import { convertDecimalToTime } from './helper';
import type { SchemaData } from './SchemaPopover/SchemaPopover';
import SchemaPopover from './SchemaPopover/SchemaPopover';
import SchemaSearchedTrips from './SchemaSearchedTrips';
import SeasonDayManager from './SeasonDayManager';

interface SchemaManagerProps {
  schemaType: SchemaName;
  data: SchemaData[];
  actions: string[];
  schemaTitle: string;
}

const SchemaManager = ({ schemaType, data, actions, schemaTitle }: SchemaManagerProps) => {
  const { showToast } = useToastModal();
  const [localData, setLocalData] = useState(data);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [editData, setEditData] = useState<SchemaData>();
  const [metadata, setMetadata] = useState<{ column_name: string; is_nullable: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetadata = async () => {
      setLoading(true);
      const response = await fetch(`/api/admin/metadata/${schemaType}`);
      if (response.ok) {
        const data = await response.json();
        setMetadata(data);
        setLoading(false);
      }
    };
    fetchMetadata();
  }, [schemaType]);

  const handleDelete = useCallback(
    async (data: SchemaData) => {
      try {
        const result = await deleteSchemaItem({ schema: schemaType, data });

        if (result.success) {
          setLocalData((prevData) => prevData.filter((item) => item.id !== data.id));
          showToast({ message: 'Item borrado!', toastType: ToastType.success });
        } else {
          showToast({ message: `Ha ocurrido un error: ${result.error}`, toastType: ToastType.error });
        }
      } catch (error) {
        showToast({ message: `Ha ocurrido un error: ${error}`, toastType: ToastType.error });
      }
    },
    [schemaType]
  );

  const handleCreateOrEdit = async (formData: SchemaData) => {
    try {
      const result = await createOrUpdateItem({ schema: schemaType, data: formData });

      if (result.success) {
        setLocalData(result.result);
        showToast({ message: 'Creación o actualización realizada correctamente!', toastType: ToastType.success });
        setPopoverOpen(false);
      } else {
        showToast({ message: `Ha ocurrido un error: ${result.error}`, toastType: ToastType.error });
        setPopoverOpen(false);
      }
    } catch (error) {
      showToast({ message: `Ha ocurrido un error: ${error}`, toastType: ToastType.error });
    }
  };

  const openCreatePopover = () => {
    const initialData: Partial<SchemaData> = {};

    metadata.forEach((field) => {
      const key = field.column_name as keyof SchemaData;
      if (key === ('isDefault' as keyof BusType)) {
        initialData[key] = false as unknown as SchemaData[typeof key];
      } else {
        initialData[key] = (field.is_nullable === 'YES' ? '' : undefined) as unknown as SchemaData[keyof SchemaData];
      }
    });

    setEditData(initialData as SchemaData);
    setPopoverOpen(true);
  };

  const openEditPopover = (item: SchemaData) => {
    setEditData(item);
    setPopoverOpen(true);
  };

  const renderCellValue = (item: SchemaData, field: { column_name: string }) => {
    if (
      field.column_name === 'drivingTime' ||
      field.column_name === 'restDuration' ||
      field.column_name === 'fullDayDriving' ||
      field.column_name === 'fullDayRest' ||
      field.column_name === 'excursionsLimit' ||
      field.column_name === 'minimumTimePerDay' ||
      field.column_name === 'minimumReturnTime'
    ) {
      const decimalValue = item[field.column_name as keyof SchemaData] as unknown as number;
      return decimalValue !== undefined ? convertDecimalToTime(decimalValue) : '';
    } else if (
      field.column_name === 'adjustmentPercentage' ||
      (field.column_name === 'rate' && item[field.column_name as keyof SchemaData] !== undefined)
    ) {
      const value = item[field.column_name as keyof SchemaData] as unknown as number;
      return `${(value * 100).toFixed(2)}%`;
    } else if (
      field.column_name === 'pricePerKm' ||
      field.column_name === 'pricePerMinute' ||
      field.column_name === 'price'
    ) {
      const value = item[field.column_name as keyof SchemaData] as unknown as number;
      return `${formatPrice(value)}`;
    } else if (field.column_name === 'isDefault') {
      const value = item[field.column_name as keyof SchemaData] as unknown as number;
      return value && t('admin.busTypesPage.true');
    }

    return String(item[field.column_name as keyof SchemaData] || '');
  };
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">
        {t('admin.pages.subTitle')} {t(`admin.pages.${schemaTitle}`)}
      </h1>
      {schemaType === 'SeasonDay' ? (
        <SeasonDayManager data={localData as SeasonDay[]} />
      ) : schemaType === 'Bookings' ? (
        <SchemaSearchedTrips />
      ) : loading ? (
        <LoadingContainer>
          <LoadingContent></LoadingContent>
        </LoadingContainer>
      ) : (
        <>
          <div className="mb-4">
            {actions.includes('create') && <Button onClick={openCreatePopover}>{t('admin.buttons.create')}</Button>}
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white dark:bg-gray-800 border border-gray-300 rounded-md shadow-sm">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-700">
                  {metadata.map((field) => (
                    <th key={field.column_name + field.is_nullable} className="py-2 px-4 border-b border-gray-300">
                      {t(`admin.columns.${field.column_name}`)}
                    </th>
                  ))}
                  <th className="py-2 px-4 border-b border-gray-300">{t('admin.columns.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {localData.map((item) => (
                  <tr key={item.id} className="even:bg-gray-50 odd:bg-white dark:even:bg-gray-900 dark:odd:bg-gray-800">
                    {metadata.map((field) => (
                      <td key={field.column_name} className="py-2 px-4 border-b border-gray-300 text-center">
                        {renderCellValue(item, field)}
                      </td>
                    ))}
                    <td className="py-2 px-4 border-b border-gray-300 flex justify-center items-center">
                      {actions.includes('edit') && (
                        <Button variant="default" className="mr-2" onClick={() => openEditPopover(item)}>
                          {t('admin.buttons.edit')}
                        </Button>
                      )}
                      {actions.includes('delete') && (
                        <Button variant="destructive" onClick={() => handleDelete(item)}>
                          {t('admin.buttons.delete')}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      <SchemaPopover
        isOpen={popoverOpen}
        onRequestClose={() => setPopoverOpen(false)}
        onSubmit={handleCreateOrEdit}
        schemaType={schemaType}
        initialData={editData}
        schemaTitle={schemaTitle}
      />
    </div>
  );
};

export default SchemaManager;
