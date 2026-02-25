'use client';
import { AssistantContext } from '@/_common/context/AssistantContext';
import InfoLabel from '@/app/components/InfoTooltip';
import { useState, useContext } from 'react';
import useFireToast from '@/_common/hooks/fireToast';

const ViewSelector = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { state, dispatch } = useContext(AssistantContext);
  const { hint } = useFireToast();

  const options = [
    {
      label: 'Circle',
      value: 'normal',
      description: 'Classic circular button view',
      image: '/plugin-view/circle.png',
    },
    {
      label: 'Agent',
      value: 'landing',
      description: 'Full character landing page view',
      image: '/plugin-view/agent.png',
    },
    {
      label: 'Badge',
      value: 'badge',
      description: 'Compact badge in center-right of the screen',
      image: '/plugin-view/badge.png',
    },
  ];

  const handleSelect = option => {
    dispatch({
      type: 'SET_VIEW_TYPE',
      payload: { viewType: option.value },
    });
    setIsOpen(false);
    // Show toast notification when view type is changed
    hint('Carla View updated', 'Please click save to apply the updates');
  };

  const selectedOption = options.find(option => option.value === state.viewType) || options[0];

  return (
    <div
      className="relative flex flex-col lg:justify-between gap-4 items-start lg:items-center"
      id="customize-view-type"
    >
      <InfoLabel
        label="How should Carla appear?"
        tooltipText="Choose how Carla appears on your website. Select between a circular view, a full agent view, or a compact side badge."
      />

      {/* Mobile Dropdown */}
      <div className="lg:hidden w-full">
        <div
          className="flex items-center justify-between px-4 h-14 mb-2 bg-surface-elevated border border-border-default text-white rounded-lg outline-none cursor-pointer hover:border-border-subtle transition-all"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex items-center gap-3">
            <img
              src={selectedOption.image}
              alt={selectedOption.label}
              className="w-32 h-32 object-contain drop-shadow-md"
            />
            <span className="text-body text-gray-300">{selectedOption.label}</span>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
            <path
              fill="none"
              stroke="#a3a3a3"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="m19 9l-7 6l-7-6"
            />
          </svg>
        </div>

        {isOpen && (
          <ul className="absolute z-10 w-full top-[112px] mt-1 bg-surface border border-border-default rounded-lg shadow-lg">
            {options.map(option => (
              <li
                key={option.value}
                className={`p-3 cursor-pointer rounded-lg transition-all ${
                  option.value === state.viewType
                    ? 'bg-surface-elevated border border-border-subtle'
                    : 'hover:bg-surface-elevated text-gray-300'
                }`}
                onClick={() => handleSelect(option)}
              >
                <div className="flex items-center gap-3">
                  <img src={option.image} alt={option.label} className="w-16 h-16 object-contain drop-shadow-sm" />
                  <div className="flex flex-col">
                    <span
                      className={`text-body font-medium ${option.value === state.viewType ? 'text-gray-300' : 'text-gray-300'}`}
                    >
                      {option.label}
                    </span>
                    <span className="text-sm text-gray-500">{option.description}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:flex items-start gap-8">
        {options.map(option => (
          <div key={option.value} className="flex flex-col items-center gap-3 max-w-[240px]">
            <button
              className={`flex items-center justify-center w-40 h-40 rounded-lg border-2 transition-all duration-200 cursor-pointer overflow-hidden ${
                option.value === state.viewType
                  ? 'border-primary bg-gradient-to-r from-primary/20 to-primary/20 shadow-lg shadow-primary/30'
                  : 'border-primary/30 bg-[#0a0e27]/60 backdrop-blur-sm hover:border-border-subtle hover:shadow-lg hover:shadow-primary/20'
              }`}
              onClick={() => handleSelect(option)}
            >
              <img
                src={option.image}
                alt={option.label}
                className="w-full h-full object-contain drop-shadow-lg hover:scale-105 transition-transform duration-200"
              />
            </button>
            <div className="text-center">
              <span
                className={`text-sm font-medium block ${option.value === state.viewType ? 'text-gray-300' : 'text-gray-300'}`}
              >
                {option.label}
              </span>
              <span className="text-xs text-gray-500">{option.description}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ViewSelector;
