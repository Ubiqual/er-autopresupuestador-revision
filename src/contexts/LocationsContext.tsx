'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState } from 'react';

// Define the shape of the state
interface LocationsState {
  isDaysModalOpen: boolean;
  isModalOpen: boolean;
  openDaysModal: () => void;
  openModal: () => void;
  closeModal: () => void;
  closeDaysModal: () => void;
}

// Create a Context
const LocationsContext = createContext<LocationsState | null>(null);

// Provider Component
export const LocationsProvider = ({ children }: { children: ReactNode }) => {
  const [isDaysModalOpen, setIsDaysModalOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const openDaysModal = () => setIsDaysModalOpen(true);
  const closeDaysModal = () => setIsDaysModalOpen(false);

  return (
    <LocationsContext.Provider
      value={{
        isDaysModalOpen,
        isModalOpen,
        openDaysModal,
        openModal,
        closeModal,
        closeDaysModal
      }}
    >
      {children}
    </LocationsContext.Provider>
  );
};

// Custom Hook for Consuming Context
export const useLocations = () => {
  const context = useContext(LocationsContext);
  if (!context) {
    throw new Error('useLocations must be used within LocationsProvider');
  }
  return context;
};
