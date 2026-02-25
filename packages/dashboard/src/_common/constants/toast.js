export const TOAST_TYPES = {
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
  HINT: 'hint',
};

export const TOAST_ICONS = {
  [TOAST_TYPES.SUCCESS]: '/success-toast-icon.svg',
  [TOAST_TYPES.WARNING]: '/warning-toast-icon.svg',
  [TOAST_TYPES.ERROR]: '/x-toast-icon.svg',
  [TOAST_TYPES.HINT]: '/hint-toast-icon.svg',
};

export const TOAST_COLORS = {
  [TOAST_TYPES.SUCCESS]: 'bg-[#19AF66]',
  [TOAST_TYPES.WARNING]: 'bg-[#F8BF00]',
  [TOAST_TYPES.ERROR]: 'bg-[#DF1D08]',
  [TOAST_TYPES.HINT]: 'bg-[#231F20]',
};

export const TOAST_DURATION = 3000;
