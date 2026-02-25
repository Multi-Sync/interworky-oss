'use client';
import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

const FLASH_INTERVAL = 500;
const FLASH_TIMES = 2;

const ToggleSwitch = ({ id, label, checked, onChange, disabled = false }) => {
  const searchParams = useSearchParams();
  const capabilityId = searchParams.get('capabilityId');
  const isHighlighted = capabilityId === id;

  const [flashStep, setFlashStep] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!isHighlighted) {
      setFlashStep(0);
      return;
    }

    // Start flashing
    setFlashStep(1);
    intervalRef.current = setInterval(() => {
      setFlashStep(prev => {
        if (prev >= FLASH_TIMES * 2) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          return 0;
        }
        return prev + 1;
      });
    }, FLASH_INTERVAL);

    // Cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isHighlighted]);

  const isFlashing = isHighlighted && flashStep % 2 === 1;
  const flashClass = isFlashing ? 'ring-primary/80 ring-4' : 'ring-primary ring-2';

  return (
    <div
      className={`bg-surface-elevated-light/80 dark:bg-[#0a0e27]/60 backdrop-blur-sm border border-primary/30 p-4 px-6 rounded-lg flex items-center justify-between w-full max-h-16 h-[60px] transition-all duration-300 ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary/50'
      } ${isHighlighted ? `ring ${flashClass}` : ''}`}
    >
      <div className="flex items-center gap-2 flex-grow">
        <span className={`text-sm ${disabled ? 'text-gray-500' : 'text-gray-900 dark:text-white'}`}>{label}</span>
      </div>
      <label
        htmlFor={id || `toggle-${label}`}
        className={`relative inline-flex items-center ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <input
          id={id || `toggle-${label}`}
          type="checkbox"
          className="sr-only peer"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
        />
        <div
          className={`w-14 h-7 rounded-full peer transition-all duration-300 relative shadow-inner ${
            disabled
              ? 'bg-gray-700/30 peer-checked:bg-gray-600/50'
              : 'bg-gray-700/50 peer-checked:bg-gradient-to-r peer-checked:from-primary peer-checked:to-primary peer-checked:shadow-lg peer-checked:shadow-primary/50'
          }`}
        ></div>
        <span
          className={`absolute bottom-1 w-5 h-5 rounded-full shadow-lg transform ${
            checked ? 'translate-x-8 left-0' : 'translate-x-0 left-1'
          } transition-transform duration-300 ${disabled ? 'bg-gray-400' : 'bg-white'}`}
        ></span>
      </label>
    </div>
  );
};

export default ToggleSwitch;
