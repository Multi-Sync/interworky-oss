'use client';

import { getInterworkyAssistantId, getOrganizationId } from '../utils/localStorage';
import { useEffect, useState } from 'react';

const useApiKey = () => {
  const [apiKey, setApiKey] = useState('');

  useEffect(() => {
    const generateApiKey = () => {
      try {
        const orgId = getOrganizationId();
        if (!orgId) {
          setApiKey('');
          return;
        }
        const assistantId = getInterworkyAssistantId();
        const lmStudioUrl = localStorage.getItem('interworky-lm-studio-url') || '';
        const modelName = localStorage.getItem('interworky-lm-studio-model-name') || '';
        const systemMessage = localStorage.getItem('interworky-lm-studio-system-message') || '';

        // If LM Studio configuration exists, use it
        if (lmStudioUrl.trim() && modelName.trim() && systemMessage.trim()) {
          const encodedKey = btoa(`${orgId}$$${lmStudioUrl}$$${modelName}$$${systemMessage}`);
          setApiKey(encodedKey);
          return;
        }

        // Otherwise use OpenAI assistant if available
        if (assistantId) {
          const encodedKey = btoa(`${orgId}$$${assistantId}`);
          setApiKey(encodedKey);
          return;
        }

        setApiKey('');
      } catch (error) {
        console.error('Error generating API key:', error);
        setApiKey('');
      }
    };

    generateApiKey();
  }, []);

  return { apiKey };
};

export default useApiKey;
