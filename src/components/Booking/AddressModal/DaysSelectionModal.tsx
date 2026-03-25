import ArrowLeft from '@/assets/icons/left-arrow.svg';
import ArrowRight from '@/assets/icons/right-arrow.svg';
import { Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useDailyStops } from '@/contexts/DailyStopsContext';
import { useLocations } from '@/contexts/LocationsContext';
import { t } from '@/utils/i18n';

const DaysSelectionModal = () => {
  const { numDays, setNumDays } = useDailyStops();
  const { isDaysModalOpen, closeDaysModal, openModal } = useLocations();
  const handleDaysSelection = () => {
    closeDaysModal();
    openModal();
  };
  return (
    <Dialog open={isDaysModalOpen} onOpenChange={closeDaysModal}>
      <DialogContent className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-8 rounded-lg shadow-lg z-50 w-[90%] max-w-[780px] h-[85%] max-h-[550px]">
        <div className="w-full max-h-[500px] overflow-y-auto px-2">
          <DialogTitle className="text-lg font-medium text-center mb-4">
            {t('bookingPage.tripsModal.SelectNumberOfDays')}
          </DialogTitle>

          {/* Select Number of Days */}
          <div className="flex flex-col items-center gap-4 mb-8">
            <Select value={String(numDays)} onValueChange={(value) => setNumDays(Number(value))}>
              <SelectTrigger className="w-full ">
                <SelectValue placeholder={t('bookingPage.tripsModal.SelectNumberOfDays')} />
              </SelectTrigger>
              <SelectContent>
                {[2, 3, 4, 5, 6].map((day) => (
                  <SelectItem key={day} value={String(day)}>
                    {day}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse lg:flex-row w-full items-center gap-2 justify-center">
            <Button
              variant="outline"
              rounded={'full'}
              prefixIcon={<ArrowLeft height={17.5} width={21} style={{ currentColor: '#3B4DA0' }} />}
              size={'xl'}
              onClick={closeDaysModal}
            >
              {t('admin.buttons.cancel')}
            </Button>
            <Button
              variant="default"
              rounded={'full'}
              color="primary"
              suffixIcon={<ArrowRight height={28} width={28} />}
              size={'xl'}
              onClick={() => handleDaysSelection()}
            >
              {t('bookingPage.tripsModal.continue')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DaysSelectionModal;
