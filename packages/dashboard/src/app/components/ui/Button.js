import { cva } from 'class-variance-authority';
import { BeatLoader } from 'react-spinners';

const buttonVariants = cva(
  'transition-all duration-150 cursor-pointer rounded-lg capitalize focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-opacity-50',
  {
    variants: {
      intent: {
        primary: [
          'bg-neutral-800',
          'text-white',
          'hover:bg-neutral-700',
          'border',
          'border-border-default',
          'shadow-sm',
        ],
        secondary: [
          'bg-surface',
          'text-gray-300',
          'border',
          'border-dashed',
          'border-border-default',
          'hover:bg-surface-elevated',
          'hover:border-border-subtle',
        ],
        outline: [
          'bg-transparent',
          'text-gray-300',
          'border',
          'border-dashed',
          'border-border-default',
          'hover:bg-surface-elevated',
          'hover:border-border-subtle',
        ],
        underline: ['underline', 'text-gray-300', 'hover:text-gray-100'],
      },
      size: {
        small: ['text-body', 'py-1', 'px-2'],
        medium: ['text-base', 'py-2', 'px-4'],
        large: ['text-lg', 'py-3', 'px-6'],
      },
      state: {
        active: [],
        disabled: ['opacity-50', 'cursor-not-allowed', 'shadow-none', 'drop-shadow-none', 'pointer-events-none'],
        loading: ['opacity-50', 'cursor-not-allowed', 'shadow-none', 'drop-shadow-none', 'pointer-events-none'],
      },
    },
    defaultVariants: {
      intent: 'primary',
      size: 'medium',
      state: 'active',
    },
  },
);

export const Button = ({ className, intent, size, disabled = false, isLoading = false, children, ...props }) => {
  const computedState = isLoading ? 'loading' : disabled ? 'disabled' : 'active';
  const loadingColor = () => {
    if (intent === 'secondary') {
      return '#a3a3a3';
    } else if (intent === 'outline') {
      return '#a3a3a3';
    } else {
      return '#ffffff';
    }
  };

  return (
    <button
      className={buttonVariants({ intent, size, state: computedState, className })}
      disabled={disabled || isLoading}
      aria-disabled={disabled || isLoading}
      aria-busy={isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center justify-center gap-2">
          {children}
          {/* outline intent gray color, secondary intent a3a3a3 color */}
          <BeatLoader size={8} color={loadingColor} />
        </span>
      ) : (
        children
      )}
    </button>
  );
};
