'use client';

import type { BusType } from '@prisma/client';
import type { ReactNode } from 'react';
import { createContext, useContext, useState } from 'react';

interface BusSelectionState {
  busSelection: { [key: string]: number };
  availableReturnBusTypes: { [numberOfPeople: string]: number };
  numberOfPeople: string;
  updateBusSelection: (selection: { [key: string]: number }, busTypes: BusType[]) => void;
  clearBusSelection: () => void;
  isDropdownOpen: boolean;
  setIsDropdownOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const BusSelectionContext = createContext<BusSelectionState | null>(null);

export const BusSelectionProvider = ({ children }: { children: ReactNode }) => {
  const [busSelection, setBusSelection] = useState<{ [key: string]: number }>({});
  const [availableReturnBusTypes, setAvailableReturnBusTypes] = useState<{ [numberOfPeople: string]: number }>({});
  const [numberOfPeople, setNumberOfPeople] = useState<string>('0');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const updateBusSelection = (selection: { [key: string]: number }, busTypes: BusType[]) => {
    setBusSelection((prev) => {
      const updatedBusSelection = { ...prev };
      Object.keys(selection).forEach((busId) => {
        const bus = busTypes.find((b) => b.id === busId);
        if (bus) {
          const count = selection[busId];
          if (count > 0) {
            updatedBusSelection[bus.numberOfPeople] = count;
          } else {
            delete updatedBusSelection[bus.numberOfPeople];
          }
        }
      });

      setAvailableReturnBusTypes(updatedBusSelection);

      const totalPeople = Object.keys(updatedBusSelection).reduce((total, key) => {
        return total + Number(key) * updatedBusSelection[key];
      }, 0);

      setNumberOfPeople(String(totalPeople));

      return updatedBusSelection;
    });
  };

  const clearBusSelection = () => {
    setBusSelection({});
    setAvailableReturnBusTypes({});
    setNumberOfPeople('0');
  };

  return (
    <BusSelectionContext.Provider
      value={{
        busSelection,
        availableReturnBusTypes,
        numberOfPeople,
        updateBusSelection,
        clearBusSelection,
        isDropdownOpen,
        setIsDropdownOpen
      }}
    >
      {children}
    </BusSelectionContext.Provider>
  );
};

export const useBusSelection = () => {
  const context = useContext(BusSelectionContext);
  if (!context) {
    throw new Error('useBusSelection must be used within BusSelectionProvider');
  }
  return context;
};
