'use client';

import { useState } from 'react';
import { useAssistantContext } from '@/_common/context/AssistantContext';
import ToggleSwitch from '../../ToggleSwitch';
import RealTimeInstructions from './RealTimeInstructions';
import { getInterworkyAssistantId } from '@/_common/utils/localStorage';
import AssistantProfilePicture from './ProfilePicture';
import AssistantName from './AssistantName';
import ColorPicker from './ColorPicker';
import InfoLabel from '@/app/components/InfoTooltip';

const AdvancedTab = ({ handleFileChange }) => {
  const { state, dispatch } = useAssistantContext();
  const [openColorPicker, setOpenColorPicker] = useState(null);

  const colorOptions = [
    { label: 'Primary Color', key: 'primaryColor' },
    { label: 'Text Primary Color', key: 'textPrimary' },
    { label: 'Secondary Color', key: 'secondaryColor' },
    { label: 'Text Secondary Color', key: 'textSecondary' },
    { label: 'Error Color', key: 'errorColor' },
  ];

  const handleToggleColorPicker = colorKey => {
    setOpenColorPicker(openColorPicker === colorKey ? null : colorKey);
  };

  const handleCloseColorPicker = () => {
    setOpenColorPicker(null);
  };

  return (
    <div className="space-y-4 w-full">
      <div className="lg:flex-row lg:justify-start lg:gap-40 relative flex flex-col gap-10 mt-4">
        <AssistantProfilePicture onFileChange={handleFileChange} />
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent my-6" />

      <AssistantName />

      <div className="h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent my-6" />

      <div className="lg:flex-row lg:items-center flex flex-col items-start justify-between gap-8">
        <InfoLabel label="Agent Theme" tooltipText="Select the colors that match your website and brand." />
        <div className="sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 gap-y-5 gap-x-4 sm:gap-x-8 lg:gap-x-24 lg:mr-60 grid grid-cols-1">
          {colorOptions.map(({ label, key }) => (
            <ColorPicker
              key={key}
              label={label}
              colorKey={key}
              isOpen={openColorPicker === key}
              onToggle={handleToggleColorPicker}
              onClose={handleCloseColorPicker}
            />
          ))}
        </div>
      </div>
      <div className="h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent my-6" />

      <div className="grid grid-cols-1 gap-4 my-6 lg:grid-cols-2">
        <div className="w-full">
          <ToggleSwitch
            id="premium-toggle"
            label={
              <div className="flex items-center">
                <div>Remove Interworky Branding</div>
                <div className="hidden ml-3 sm:block"></div>
              </div>
            }
            checked={state.premium}
            onChange={() =>
              dispatch({
                type: 'SET_CAPABILITIES',
                payload: { premium: !state.premium },
              })
            }
          />
        </div>
        <div className="w-full">
          <ToggleSwitch
            id="Dim-toggle"
            label={
              <div className="flex items-center">
                <div>Dim Screen Effect</div>
                <div className="hidden ml-3 sm:block"></div>
              </div>
            }
            checked={state.dimScreen}
            onChange={() =>
              dispatch({
                type: 'SET_CAPABILITIES',
                payload: { dimScreen: !state.dimScreen },
              })
            }
          />
        </div>
      </div>

      <div className="mt-6">
        <RealTimeInstructions />
      </div>
    </div>
  );
};

export default AdvancedTab;
