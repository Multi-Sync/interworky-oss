'use client';

import { useAssistantContext } from '@/_common/context/AssistantContext';
import InfoLabel from '@/app/components/InfoTooltip';

const AssistantName = () => {
  const { state, dispatch } = useAssistantContext();
  const maxLength = 40;
  return (
    <div
      className="relative  flex lg:flex-row flex-col lg:justify-between gap-8 items-start  lg:items-center"
      id="customize-name"
    >
      <InfoLabel label="Agent Name" tooltipText="Appears in the Chat Header as your AI Agent Name" />
      <input
        type="text"
        value={state.name}
        onChange={e => dispatch({ type: 'SET_NAME', payload: e.target.value })}
        placeholder="Give your AI Agent a name.."
        maxLength={maxLength}
        className="mb-2 p-4 h-14 rounded-lg bg-[#0a0e27]/60 backdrop-blur-sm border border-primary/30 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 w-full lg:w-5/12 text-body text-white placeholder-gray-500 outline-none mr-60 transition-all"
      />

      <div className="lg:right-64 lg:bottom-7 right-4 bottom-7 absolute text-xs text-right text-primary">
        {state.charCount}/{maxLength}
      </div>
    </div>
  );
};

export default AssistantName;
