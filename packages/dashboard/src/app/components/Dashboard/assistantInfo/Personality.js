'use client';
import { useState } from 'react';
import Image from 'next/image';
import InfoLabel from '@/app/components/InfoTooltip';
import { useAssistantContext } from '@/_common/context/AssistantContext';
import useFireToast from '@/_common/hooks/fireToast';

const Personality = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { state, dispatch } = useAssistantContext();
  const { hint } = useFireToast();

  const options = [
    {
      label: 'Welcoming',
      value: 'Welcoming',
      image: '/personality/welcoming.png',
    },
    {
      label: 'Efficient',
      value: 'Efficient',
      image: '/personality/efficient.png',
    },
    {
      label: 'ClearCut',
      value: 'ClearCut',
      image: '/personality/clearcut.png',
    },
    {
      label: 'Funny',
      value: 'Funny',
      image: '/personality/funny.png',
    },
  ];

  const handleSelect = option => {
    dispatch({
      type: 'SET_CONTENT',
      payload: { personality: option.value },
    });
    setIsOpen(false);
    // Show toast notification when personality is changed
    hint('Personality updated', 'Please click save to apply the updates');
  };

  const selectedOption = options.find(option => option.value === state.personality) || options[0];

  return (
    <div
      className="relative flex flex-col lg:justify-between gap-4 items-start lg:items-center"
      id="customize-personality"
    >
      <InfoLabel
        label="Personality"
        tooltipText="Define your Agent tone. Choose a personality that aligns with your brand, whether it's professional, friendly, or humorous, to create the right user experience."
      />

      {/* Mobile Dropdown */}
      <div className="lg:hidden w-full">
        <div
          className="flex items-center justify-between px-4 h-14 mb-2 bg-surface-elevated-light/80 dark:bg-[#0a0e27]/60 backdrop-blur-sm border border-primary/30 rounded-lg outline-none cursor-pointer hover:border-primary/50 transition-all"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center text-primary">
              {selectedOption.image && (
                <Image
                  src={selectedOption.image}
                  alt={selectedOption.label}
                  width={32}
                  height={32}
                  className="w-8 h-8"
                />
              )}
            </span>
            <span className="text-gray-900 dark:text-white">{selectedOption.label}</span>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
            <path
              fill="none"
              stroke="#a855f7"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="m19 9l-7 6l-7-6"
            />
          </svg>
        </div>

        {isOpen && (
          <ul className="absolute z-10 w-full top-[112px] mt-1 bg-white/95 dark:bg-[#0a0e27]/95 backdrop-blur-xl border border-primary/30 rounded-lg shadow-2xl">
            {options.map(option => (
              <li
                key={option.value}
                className={`p-3 cursor-pointer rounded-lg flex items-center transition-all ${
                  option.value === state.personality
                    ? 'bg-primary/30 text-gray-900 dark:text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-primary/20'
                }`}
                onClick={() => handleSelect(option)}
              >
                <span className="flex items-center justify-center w-6 h-6 text-primary">
                  {option.image && (
                    <Image src={option.image} alt={option.label} width={24} height={24} className="w-6 h-6" />
                  )}
                </span>
                <span className="ml-3">{option.label}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Desktop Circle Layout */}
      <div className="hidden lg:flex items-start gap-32">
        {options.map(option => (
          <div key={option.value} className="flex flex-col items-center gap-2">
            <button
              className={`flex items-center justify-center w-20 h-20 rounded-full border-4 transition-all duration-300 cursor-pointer overflow-hidden ${
                option.value === state.personality
                  ? 'border-primary bg-primary/20 shadow-lg shadow-primary/50'
                  : 'border-gray-300 dark:border-gray-600 bg-white/60 dark:bg-[#0a0e27]/60 backdrop-blur-sm hover:border-primary/50 hover:shadow-primary/30'
              }`}
              onClick={() => handleSelect(option)}
            >
              {option.image && (
                <Image
                  src={option.image}
                  alt={option.label}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                />
              )}
            </button>
            <span
              className={`text-sm font-medium text-center ${
                option.value === state.personality ? 'text-primary' : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              {option.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Personality;
