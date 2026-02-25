// src/_common/utils/handleSlackNotification.js

import { useState, useCallback } from 'react';

export function useNotification() {
  const [isSending, setIsSending] = useState(false);

  const handleNotification = useCallback(async message => {
    // avoid sending if running in development
    if (process.env.NODE_ENV === 'development') {
      return;
    }
    setIsSending(true);

    try {
      const response = await fetch('/api/slack-cvp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      const data = await response.json();
      if (data.success) {
      } else {
        console.error('Failed to send notification:', data.error);
      }
    } catch (error) {
      console.error('Error sending notification:', error);
    } finally {
      setIsSending(false);
    }
  }, []);

  return { handleNotification, isSending };
}
