'use client';

import { addExtra } from '@/app/api/addExtra';
import { t } from '@/utils/i18n';
import type { CustomExtras } from '@prisma/client';
import { useState } from 'react';
import { Button, Input, Label } from '../ui';
import { Dialog, DialogContent, DialogOverlay, DialogTitle } from '../ui/dialog';

interface AddExtraProps {
  onExtraAdded: (newExtra: CustomExtras) => void;
  bookingId: string;
  vat: number;
}

const AddExtra = ({ onExtraAdded, bookingId, vat }: AddExtraProps) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [loading, setLoading] = useState(false);

  const handleAddExtra = async () => {
    if (!description || !price) {
      return;
    }
    setLoading(true);

    try {
      const customExtra = await addExtra({
        bookingId: bookingId,
        name: description,
        price: Number(price),
        vat
      });

      setDescription('');
      setPrice('');
      setModalOpen(false);

      onExtraAdded(customExtra);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Add Extra Button */}
      <Button
        variant="default"
        rounded={'full'}
        color="primary"
        size={'xl'}
        className="w-full lg:w-[212px]"
        onClick={() => setModalOpen(true)}
      >
        {t('admin.buttons.addExtra')}
      </Button>

      {/* Modal */}
      <Dialog open={isModalOpen} onOpenChange={setModalOpen}>
        <DialogOverlay className="fixed inset-0 bg-black bg-opacity-50 z-50" />
        <DialogContent className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg shadow-lg z-50 w-[90%] max-w-[400px]">
          <DialogTitle className="text-lg font-medium mb-4">{t('admin.modalLabels.addExtra.title')}</DialogTitle>
          <div className="flex flex-col gap-4">
            {/* Description Input */}
            <div>
              <Label className="block text-sm font-medium mb-2">{t('admin.modalLabels.addExtra.description')}</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>

            {/* Price Input */}
            <div>
              <Label className="block text-sm font-medium mb-2">{t('admin.modalLabels.addExtra.price')}</Label>
              <Input value={price} onChange={(e) => setPrice(parseFloat(e.target.value))} type="number" suffix="€" />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end mt-4">
              <Button variant="default" onClick={handleAddExtra} className="mr-2" loading={loading}>
                {t('admin.buttons.addExtra')}
              </Button>
              <Button variant="destructive" onClick={() => setModalOpen(false)}>
                {t('admin.buttons.cancel')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AddExtra;
