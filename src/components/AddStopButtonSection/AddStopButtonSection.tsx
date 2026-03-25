import AddButton from '@/assets/icons/add-button.svg';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui';
import type { StopData } from '@/types/TravelCalculations';
import { t } from '@/utils/i18n';
import { useState } from 'react';

interface AddStopButtonSectionProps {
  isWedding: boolean;
  isAddStopDisabled: boolean;
  lastStopIndex: number | null;
  isAddingStopDisabled: boolean;
  dropoffLocation: StopData;
  serviceIsTransfer: boolean;
  handleAddStop: (isLastStop: boolean) => void;
}

const AddStopButtonSection = ({
  isWedding,
  isAddStopDisabled,
  lastStopIndex,
  isAddingStopDisabled,
  dropoffLocation,
  serviceIsTransfer,
  handleAddStop
}: AddStopButtonSectionProps) => {
  const [showError, setShowError] = useState(false);

  const handleDisabledClick = () => {
    setShowError(true);
    setTimeout(() => setShowError(false), 3000); // Hide error after 3 seconds
  };

  if (isWedding) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild disabled={isAddStopDisabled || !!lastStopIndex || dropoffLocation.address === ''}>
          <div
            className={`flex items-center gap-2 w-full sm:w-[530px] ${
              isAddStopDisabled || !!lastStopIndex || dropoffLocation.address === ''
                ? 'text-gray-300 cursor-not-allowed'
                : 'text-gray-400 cursor-pointer'
            }`}
            onClick={
              isAddStopDisabled || !!lastStopIndex || dropoffLocation.address === '' ? handleDisabledClick : undefined
            }
          >
            <div className="sm:min-w-[8.6rem]"></div>
            <AddButton width={50} height={50} />
            <label
              className={`text-sm font-medium ${
                isAddStopDisabled || !!lastStopIndex || dropoffLocation.address === ''
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-gray-400 cursor-pointer'
              }`}
            >
              {t('bookingPage.locationsModal.addStop')}
            </label>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="bottom" align="center" sideOffset={4}>
          <DropdownMenuItem
            onClick={() => {
              if (!isAddStopDisabled) {
                handleAddStop(false);
              }
            }}
          >
            {t('bookingPage.locationsModal.addRegularStop')}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              if (!isAddStopDisabled) {
                handleAddStop(true);
              }
            }}
          >
            {t('bookingPage.locationsModal.addLastStop')}
          </DropdownMenuItem>
        </DropdownMenuContent>
        <div className="flex items-center">
          <div className="sm:min-w-[8.6rem]"></div>
          {showError && <p className="text-red-500 text-sm ml-2">{t('bookingPage.locationsModal.errorMessage')}</p>}
        </div>
      </DropdownMenu>
    );
  }

  // Non-wedding variant
  return (
    <div>
      <div
        className={`flex items-center gap-2 group mt-4 ${
          isAddingStopDisabled || dropoffLocation.address === '' ? 'cursor-not-allowed' : 'cursor-pointer'
        }`}
        onClick={
          isAddingStopDisabled || dropoffLocation.address === '' ? handleDisabledClick : () => handleAddStop(false)
        }
      >
        <div className="sm:min-w-[8.6rem]"></div>
        <AddButton width={50} height={50} />
        <label
          className={`block text-md font-medium ${
            isAddingStopDisabled || dropoffLocation.address === '' ? 'text-gray-300' : 'text-gray-400'
          } ${isAddingStopDisabled || dropoffLocation.address === '' ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        >
          {serviceIsTransfer
            ? t('bookingPage.locationsModal.addStopTranslados')
            : t('bookingPage.locationsModal.addStop')}
        </label>
      </div>
      <div className={'flex items-center gap-2 group mt-1'}>
        <div className="sm:min-w-[8.6rem]"></div>
        {showError && <p className="text-red-500 text-sm ml-2">{t('bookingPage.locationsModal.errorMessage')}</p>}
      </div>
    </div>
  );
};

export default AddStopButtonSection;
