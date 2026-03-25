'use client';

import ToastModal from '@/components/ToastModal/ToastModal';
import React, { createContext, type ReactNode, useContext, useState } from 'react';

interface ToastModalContextValue {
  showToast: ({ message, toastType, onClose }: { message: string; toastType: ToastType; onClose?: () => void }) => void;
  hideError: () => void;
}

export enum ToastType {
  error,
  success
}

const ToastModalContext = createContext<ToastModalContextValue | undefined>(undefined);

export const ToastModalProvider = ({ children }: { children: ReactNode }) => {
  const [message, setMessage] = useState('');
  const [toastTitle, setToastTitle] = useState('');
  const [toastType, setToastType] = useState<ToastType>(ToastType.success);
  const [open, setOpen] = useState(false);
  const [onCloseCallback, setOnCloseCallback] = useState<(() => void) | undefined>(undefined);

  const showToast = ({
    message,
    toastType,
    title,
    onClose
  }: {
    message: string;
    toastType: ToastType;
    title?: string;
    onClose?: () => void;
  }) => {
    setMessage(message);
    setToastType(toastType);
    setToastTitle(title ? title : toastType === ToastType.error ? 'error' : 'Confirmado');
    setOnCloseCallback(() => onClose);
    setOpen(true);
  };

  const hideError = () => {
    setOpen(false);
    setMessage('');
    if (onCloseCallback) {
      onCloseCallback();
      setOnCloseCallback(undefined);
    }
  };

  return (
    <ToastModalContext.Provider value={{ showToast, hideError }}>
      {children}
      <ToastModal open={open} message={message} onClose={hideError} toastType={toastType} title={toastTitle} />
    </ToastModalContext.Provider>
  );
};

export const useToastModal = (): ToastModalContextValue => {
  const context = useContext(ToastModalContext);
  if (!context) {
    throw new Error('useToastModal must be used within a ToastModalProvider');
  }
  return context;
};
