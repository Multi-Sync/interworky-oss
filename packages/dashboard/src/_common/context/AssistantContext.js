'use client';

import { createContext, useContext } from 'react';

export const AssistantContext = createContext(null);

export const useAssistantContext = () => {
  const context = useContext(AssistantContext);
  if (!context) {
    throw new Error('useAssistantContext must be used within an AssistantProvider');
  }
  return context;
};
