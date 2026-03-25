'use client';

import * as PopoverPrimitive from '@radix-ui/react-popover';
import { ChevronDown } from 'lucide-react';
import * as React from 'react';

import { Input, Label } from '@/components/ui/index';
import { useBusSelection } from '@/contexts/BusSelectionContext';
import { cn } from '@/lib/utils';
import { t } from '@/utils/i18n';
import type { BusType } from '@prisma/client';

interface BusSelectionProps {
  busTypes: BusType[];
  disabled?: boolean;
}

const BusSelection = ({ busTypes, disabled = false }: BusSelectionProps) => {
  const { busSelection, updateBusSelection, isDropdownOpen, setIsDropdownOpen } = useBusSelection();

  const handleBusCountChange = (busId: string, value: string) => {
    const sanitizedValue = value.replace(/\D/g, '');
    const count = Number(sanitizedValue);
    updateBusSelection({ ...busSelection, [busId]: count }, busTypes);
  };

  const selectedBusText = (() => {
    const totalSelectedBuses = Object.values(busSelection).reduce((acc, count) => acc + count, 0);
    if (totalSelectedBuses === 1) {
      return `${totalSelectedBuses} ${t('bookingPage.placeholders.selectedSingleBus')}`;
    }
    if (totalSelectedBuses > 1) {
      return `${totalSelectedBuses} ${t('bookingPage.placeholders.selectedBuses')}`;
    }
    return t('bookingPage.placeholders.selectBus');
  })();

  const isPlaceholder = selectedBusText === t('bookingPage.placeholders.selectBus');

  return (
    <div>
      <PopoverPrimitive.Root open={isDropdownOpen} onOpenChange={disabled ? undefined : setIsDropdownOpen}>
        <PopoverPrimitive.Trigger
          disabled={disabled}
          className={cn(
            'flex h-[2.6875rem] w-full items-center justify-between rounded-full border border-[#000000] bg-white px-3 py-2 text-md ring-offset-white focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-50 hover:bg-slate-100',
            isPlaceholder ? 'text-[#bfbfbf] italic' : 'text-[#313131]'
          )}
        >
          <Label className={cn('text-md', disabled ? 'cursor-not-allowed' : 'cursor-pointer')}>{selectedBusText}</Label>
          <ChevronDown className="h-4 w-4 text-[#000000]" />
        </PopoverPrimitive.Trigger>

        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            align="start"
            sideOffset={4}
            className={cn(
              'relative z-50 w-[var(--radix-popover-trigger-width)] overflow-hidden rounded-md border border-slate-200 bg-white text-slate-950 shadow-md',
              'data-[state=open]:animate-in data-[state=closed]:animate-out',
              'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
              'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
              'data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2',
              'data-[side=bottom]:translate-y-1 data-[side=top]:-translate-y-1',
              'p-1 md:p-4 md:py-6'
            )}
          >
            {busTypes.map((bus, index) => (
              <div key={bus.id} className={cn('flex items-center justify-between', index !== 0 && 'mt-2')}>
                <span className="text-md">
                  {bus.numberOfPeople === 55 ? 'Autocar de 31 a 55 plazas' : 'Minibus hasta 30 plazas'}
                </span>
                <div className="w-20 mr-2">
                  <Input
                    type="number"
                    min={0}
                    value={busSelection[bus.numberOfPeople] || ''}
                    onChange={(e) => handleBusCountChange(bus.id, e.target.value)}
                    className="w-20 ml-2"
                    placeholder="0"
                  />
                </div>
              </div>
            ))}
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>
    </div>
  );
};

export default BusSelection;
