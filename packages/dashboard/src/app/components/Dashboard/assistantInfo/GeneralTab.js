'use client';

import { useState } from 'react';
import WebSiteSyncStatus from './WebSiteSyncStatus';
import AssistantProfilePicture from './ProfilePicture';
import AssistantName from './AssistantName';
import Personality from './Personality';
import InfoLabel from '@/app/components/InfoTooltip';
import ColorPicker from './ColorPicker';
import Knowledge from './Knowledge';
import { AssistantContext } from '@/_common/context/AssistantContext';
import { useContext } from 'react';
import OpeningStatement from './OpeningStatement';
import FileManager from './FileManager';
import { getInterworkyAssistantId } from '@/_common/utils/localStorage';
import FirstMessage from './FirstMessage';
import { useMediaQuery } from 'react-responsive';
import ViewSelector from './ViewSelector';

const GeneralTab = ({ handleFileChange }) => {
  const colorOptions = [
    { label: 'Primary Color', key: 'primaryColor' },
    { label: 'Text Primary Color', key: 'textPrimary' },
    { label: 'Secondary Color', key: 'secondaryColor' },
    { label: 'Text Secondary Color', key: 'textSecondary' },
    { label: 'Error Color', key: 'errorColor' },
  ];
  const { state, dispatch } = useContext(AssistantContext);
  const [isEditingKnowledge, setIsEditingKnowledge] = useState(false);
  const [openColorPicker, setOpenColorPicker] = useState(null);
  const isMobile = useMediaQuery({ maxWidth: 1024 });

  const handleToggleColorPicker = colorKey => {
    setOpenColorPicker(openColorPicker === colorKey ? null : colorKey);
  };

  const handleCloseColorPicker = () => {
    setOpenColorPicker(null);
  };

  return (
    <div className="space-y-8">
      <WebSiteSyncStatus />
      <div className="h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      <ViewSelector />
      <div className="h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      {/* <div className="lg:flex-row lg:justify-start lg:gap-40 relative flex flex-col gap-10 mb-4" id="customize-image">
        <AssistantProfilePicture onFileChange={handleFileChange} />
      </div> */}

      {/* <hr className="border-t-1 border-gray-200" /> */}

      {/* <AssistantName />

      <hr className="border-t-1 border-gray-200" /> */}

      <Personality />
      <div className="h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

      <OpeningStatement />
      <div className="h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

      <FirstMessage />
      <div className="h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

      {/* <hr className="border-t-1 border-gray-200" /> */}
      {/* <div
        className="lg:flex-row lg:items-center flex flex-col items-start justify-between gap-8"
        id="customize-colors"
      >
        <InfoLabel
          label="Agent Theme"
          tooltipText="Select the colors that match your website and brand."
          docText="Documentation"
          docLink="https://interworky.gitbook.io/interworky/features-overview/ai-chat-bot-customization/customizing-the-theme"
        />
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
      <hr className="border-t-1 border-gray-200" /> */}
      {/* <Knowledge
        knowledge={state.knowledge}
        onKnowledgeChange={newKnowledge => dispatch({ type: 'SET_KNOWLEDGE', payload: newKnowledge })}
        onEditModeChange={setIsEditingKnowledge}
      /> */}

      {/* <FeatureGuard featureKey={'knowledge-file'}>
        <hr className="border-t-1 border-gray-200" />
        <FileManager assistantId={getInterworkyAssistantId()} />
        <hr className="border-t-1 border-gray-200" />
      </FeatureGuard> */}
    </div>
  );
};

export default GeneralTab;
