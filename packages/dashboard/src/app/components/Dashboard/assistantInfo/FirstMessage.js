'use client';

import { useAssistantContext } from '@/_common/context/AssistantContext';
import InfoLabel from '@/app/components/InfoTooltip';

const FirstMessage = () => {
  const { state, dispatch } = useAssistantContext();

  return (
    <div className="relative flex lg:flex-row flex-col lg:justify-between gap-8 items-start lg:items-center">
      <InfoLabel
        label="What should I say first?"
        tooltipText="First message your AI Agent sends when users open the chat"
      />
      <textarea
        id="text"
        value={state.firstMessage}
        onChange={e => dispatch({ type: 'SET_FIRST_MESSAGE', payload: e.target.value })}
        placeholder="Give your AI Agent a First Message..."
        className="mb-2 p-4 rounded-lg bg-[#0a0e27]/60 backdrop-blur-sm border border-primary/30 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 w-full lg:w-5/12 scrollbar text-white placeholder-gray-500 outline-none mr-60 resize-none transition-all"
      />
    </div>
  );
};

export default FirstMessage;
