import React from 'react';

const LoadingButton = ({
  id,
  type = 'button',
  isLoading = false,
  disabled = false,
  className = '',
  onClick,
  children,
}) => {
  return (
    <button
      id={id}
      type={type}
      disabled={isLoading || disabled}
      onClick={onClick}
      className={`px-14 py-2 text-white rounded-lg bg-primary ${
        isLoading || disabled ? 'bg-tertiary opacity-50 cursor-not-allowed' : 'bg-primary hover:bg-primary-dark'
      } ${className}`}
    >
      {isLoading ? (
        <span className="flex justify-center items-center gap-2">
          <svg
            className="animate-spin w-5 h-5 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        </span>
      ) : (
        children
      )}
    </button>
  );
};

export default LoadingButton;
