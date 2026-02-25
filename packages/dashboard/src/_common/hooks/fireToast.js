'use client';

import { useCallback } from 'react';
import toast from 'react-hot-toast';
import { Toast } from '../components/Toast';
import { TOAST_TYPES, TOAST_DURATION } from '../constants/toast';

const createToast = (title, msg, type) => {
  if (typeof window === 'undefined') return;

  toast.custom(
    t => <Toast title={title} message={msg} type={type} visible={t.visible} onDismiss={() => toast.dismiss(t.id)} />,
    {
      duration: TOAST_DURATION,
      position: 'top-right',
    },
  );
};

const useFireToast = () => {
  const success = useCallback((title, msg) => createToast(title, msg, TOAST_TYPES.SUCCESS), []);
  const warning = useCallback((title, msg) => createToast(title, msg, TOAST_TYPES.WARNING), []);
  const error = useCallback((title, msg) => createToast(title, msg, TOAST_TYPES.ERROR), []);
  const hint = useCallback((title, msg) => createToast(title, msg, TOAST_TYPES.HINT), []);

  return {
    success,
    warning,
    error,
    hint,
  };
};

export default useFireToast;
