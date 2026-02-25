import { useEffect, useCallback } from 'react';
import ModalPortal from './ModalPortal';

const Dialog = ({
  isOpen,
  onClose,
  title,
  children,
  className = '',
  childrenStyle = '',
  backdropColor = 'backdrop-blur-sm',
  position = 'center',
  hideCloseButton = false,
}) => {
  const handleEscape = useCallback(
    event => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    },
    [isOpen, onClose],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleEscape);
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleEscape]);

  if (!isOpen) return null;

  const positionClasses = {
    center: 'flex items-center justify-center',
    bottomRight: 'flex items-end justify-end pb-4 pr-4',
  };

  // const handleOverlayClick = e => {
  //   if (e.target === e.currentTarget) {
  //     onClose();
  //   }
  // };

  return (
    <ModalPortal>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        className={`fixed inset-0 z-[9999999] ${backdropColor} ${positionClasses[position]} transition-opacity duration-200 p-4`}
        style={{ zIndex: 9999999 }}
        // onClick={handleOverlayClick}
      >
        <div
          className={`max-h-[90vh] max-w-[95vw] w-full ${className} flex relative flex-col bg-white rounded-xl shadow-xl transition-all duration-200 transform overflow-hidden`}
        >
          <div className="flex justify-between items-center px-4 py-2 w-full">
            <h2 id="dialog-title" className="text-subTitle font-medium text-gray-900 dark:text-white">
              {title}
            </h2>
            {!hideCloseButton && (
              <button
                onClick={onClose}
                className={`
                  rounded-lg p-1.5
                  text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary
                  bg-transparent hover:bg-primary/20
                  transition-colors duration-200
                  focus:outline-none focus:ring-2 focus:ring-primary/50
                `}
                aria-label="Close dialog"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <div className={`scrollbar ${childrenStyle} overflow-y-auto flex-1 p-4`}>{children}</div>
        </div>
      </div>
    </ModalPortal>
  );
};

export default Dialog;
