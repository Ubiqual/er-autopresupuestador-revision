import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { t } from '@/utils/i18n';
import type { CustomExtras } from '@prisma/client';
import { Cross1Icon } from '@radix-ui/react-icons';
import React, { useState } from 'react';

interface DeleteCustomExtrasModal {
  handleExtraRemove: ({ extra }: { extra: CustomExtras }) => void;
  extra: CustomExtras;
}

const DeleteCustomExtrasModal = ({ handleExtraRemove, extra }: DeleteCustomExtrasModal) => {
  const [isModalOpen, setModalOpen] = useState(false);

  return (
    <Dialog open={isModalOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="border-none absolute right-0 top-1/2 -translate-y-1/2 lg:static lg:top-auto lg:translate-y-0"
          onClick={() => setModalOpen(true)}
        >
          <Cross1Icon className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('deleteCustomExtraModal.title')}</DialogTitle>
          <DialogDescription>{t('deleteCustomExtraModal.description')}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex sm:justify-center items-center">
          <Button
            variant="default"
            rounded={'full'}
            color="white"
            className="text-[#3B4DA0]"
            onClick={() => setModalOpen(false)}
          >
            {t('admin.buttons.cancel')}
          </Button>
          <Button
            variant="default"
            color="primary"
            rounded={'full'}
            onClick={() => {
              handleExtraRemove({ extra });
              setModalOpen(false);
            }}
          >
            {t('admin.buttons.delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteCustomExtrasModal;
