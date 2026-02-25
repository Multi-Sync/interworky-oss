'use client';

import Image from 'next/image';
import { cva } from 'class-variance-authority';
import PropTypes from 'prop-types';
import { TOAST_COLORS, TOAST_ICONS } from '../constants/toast';

const toastVariants = cva(
  'max-w-md w-full shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-secondary ring-opacity-5',
  {
    variants: {
      type: TOAST_COLORS,
    },
    defaultVariants: {
      type: 'success',
    },
  },
);

export const Toast = ({ title, message, type, visible, onDismiss }) => (
  <div className={`${visible ? 'animate-enter' : 'animate-leave'} ${toastVariants({ type })}`}>
    <div className="flex-1 w-0 p-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <Image src={TOAST_ICONS[type]} alt={`${type}-toast-icon`} width={20} height={20} />
        </div>
        <div className="flex-1 ml-3">
          <p className="text-body font-medium text-white">{title}</p>
          <p className="mt-1 text-body text-white">{message}</p>
        </div>
      </div>
    </div>
    <div className="flex">
      <button
        onClick={onDismiss}
        type="button"
        className="me-2 hover:no-underline hover:opacity-50 focus:opacity-50 focus:shadow-none focus:outline-none box-content text-white border-none rounded-none opacity-100"
        data-te-toast-dismiss
        aria-label="Close"
      >
        <span className="w-[1em] focus:opacity-100 disabled:pointer-events-none disabled:select-none disabled:opacity-25 [&.disabled]:pointer-events-none [&.disabled]:select-none [&.disabled]:opacity-25">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </span>
      </button>
    </div>
  </div>
);

Toast.propTypes = {
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  type: PropTypes.oneOf(['success', 'warning', 'error', 'hint']).isRequired,
  visible: PropTypes.bool.isRequired,
  onDismiss: PropTypes.func.isRequired,
};
