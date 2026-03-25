import AddButton from '@/assets/icons/add-button.svg';
import { t } from '@/utils/i18n';
import { useState } from 'react';

interface AddStopButtonSectionProps {
  isAddingStopDisabled: boolean;
  handleAddStop: (isLastStop: boolean) => void;
  steps: number;
}

const AddStopButtonSectionWedding = ({ isAddingStopDisabled, handleAddStop, steps }: AddStopButtonSectionProps) => {
  const [showError, setShowError] = useState(false);
  const handleDisabledClick = () => {
    setShowError(true);
    setTimeout(() => setShowError(false), 3000);
  };

  return (
    <div>
      <div
        className={`flex items-center gap-2 group mt-4 ${
          isAddingStopDisabled ? 'cursor-not-allowed' : 'cursor-pointer'
        }`}
        onClick={isAddingStopDisabled ? handleDisabledClick : () => handleAddStop(false)}
      >
        <div className="sm:min-w-[8.6rem]"></div>
        <AddButton width={50} height={50} />
        <label
          className={`block text-md font-medium ${
            isAddingStopDisabled ? 'text-gray-300' : 'text-gray-400'
          } ${isAddingStopDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        >
          {steps === 1 ? 'añadir parada intermedia' : t('bookingPage.locationsModal.addStopWedding')}
        </label>
      </div>
      <div className={'flex items-center gap-2 group mt-1'}>
        <div className="sm:min-w-[8.6rem]"></div>
        {showError && <p className="text-red-500 text-sm ml-2">{t('bookingPage.locationsModal.errorMessage')}</p>}
      </div>
    </div>
  );
};

export default AddStopButtonSectionWedding;
