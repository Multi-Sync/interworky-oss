'use client';

import { useAssistantContext } from '@/_common/context/AssistantContext';
import InfoLabel from '@/app/components/InfoTooltip';

const OpeningStatement = () => {
  const { state, dispatch } = useAssistantContext();
  const maxLength = 60;

  return (
    <div className="relative flex lg:flex-row flex-col lg:justify-between gap-8 items-start lg:items-center">
      <InfoLabel
        label="What to say to welcome our visitors?"
        tooltipText="Appears next to your AI Agent as a welcoming message"
      />

      <textarea
        id="text"
        value={state.openingStatement}
        onChange={e => dispatch({ type: 'SET_STATEMENT', payload: e.target.value })}
        placeholder="Give your AI Agent an opening statement..."
        maxLength={maxLength}
        className="mb-2 p-4 rounded-lg bg-[#0a0e27]/60 backdrop-blur-sm border border-primary/30 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 w-full lg:w-5/12 text-white placeholder-gray-500 outline-none mr-60 resize-none transition-all"
      />

      <div className="lg:right-64 lg:bottom-7 right-4 bottom-7 absolute text-xs text-right text-gray-400">
        {state.openingStatementCharCount}/{maxLength}
      </div>
    </div>
  );
};

export default OpeningStatement;
