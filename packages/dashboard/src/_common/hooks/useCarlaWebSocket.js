/**
 * useCarlaWebSocket Hook
 * Manages WebSocket connection to Carla agent with streaming support
 */

import { useState, useEffect, useRef, useCallback } from 'react';

const WS_URL = process.env.NEXT_PUBLIC_WS_ASSISTANT_URL || 'ws://localhost:33355';

export const useCarlaWebSocket = ({ organizationId, email, name, onMessage, onError }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentTool, setCurrentTool] = useState(null);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const streamingMessageRef = useRef('');
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  // Get client metadata
  const getClientMetadata = useCallback(() => {
    return {
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      language: navigator.language || 'en-US',
      deviceType: /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
      origin: typeof window !== 'undefined' ? window.location.origin : 'unknown',
      connectionType: navigator.connection?.effectiveType || 'unknown',
      todayDate: new Date().toLocaleDateString(),
      todayWeekday: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
    };
  }, []);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    try {
      const ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;

        // Send ping every 30 seconds to keep connection alive
        const pingInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send('ping');
          }
        }, 30000);

        ws.pingInterval = pingInterval;
      };

      ws.onclose = () => {
        setIsConnected(false);
        setIsStreaming(false);
        setCurrentTool(null);

        if (ws.pingInterval) {
          clearInterval(ws.pingInterval);
        }

        // Attempt to reconnect
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current += 1;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else {
          console.error('[CarlaWS] Max reconnect attempts reached');
          onError?.('Connection lost. Please refresh the page.');
        }
      };

      ws.onerror = error => {
        console.error('[CarlaWS] Error:', error);
        onError?.('WebSocket connection error');
      };

      ws.onmessage = event => {
        try {
          // Handle pong response
          if (event.data === 'pong') {
            return;
          }

          // Parse message
          const data = JSON.parse(event.data);

          switch (data.type) {
            case 'connected':
              break;

            case 'started':
              setIsStreaming(true);
              streamingMessageRef.current = '';
              break;

            case 'text_delta':
              // Stream text chunks
              streamingMessageRef.current += data.content;
              onMessage?.({
                type: 'streaming',
                content: streamingMessageRef.current,
              });
              break;

            case 'tool_call_started':
              setCurrentTool({
                name: data.tool,
                status: 'running',
                message: data.message,
              });
              break;

            case 'tool_call_completed':
              setCurrentTool({
                name: data.tool,
                status: 'completed',
                message: data.message,
              });
              // Clear tool status after a short delay
              setTimeout(() => setCurrentTool(null), 2000);
              break;

            case 'completed':
            case 'complete':
              setIsStreaming(false);
              setCurrentTool(null);
              // Finalize the message
              onMessage?.({
                type: 'complete',
                content: data.content || streamingMessageRef.current,
              });
              streamingMessageRef.current = '';
              break;

            case 'error':
              console.error('[CarlaWS] Error from server:', data.error);
              setIsStreaming(false);
              setCurrentTool(null);
              onError?.(data.error || 'An error occurred');
              streamingMessageRef.current = '';
              break;

            default:
              console.warn('[CarlaWS] Unknown message type:', data.type);
          }
        } catch (error) {
          console.error('[CarlaWS] Failed to parse message:', error);
        }
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('[CarlaWS] Connection failed:', error);
      onError?.('Failed to establish WebSocket connection');
    }
  }, [onMessage, onError]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    if (wsRef.current) {
      if (wsRef.current.pingInterval) {
        clearInterval(wsRef.current.pingInterval);
      }
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsConnected(false);
    setIsStreaming(false);
    setCurrentTool(null);
  }, []);

  // Send message via WebSocket
  const sendMessage = useCallback(
    async (messageContent, conversationId) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        throw new Error('WebSocket is not connected');
      }

      if (!messageContent.trim()) {
        throw new Error('Message cannot be empty');
      }

      if (isStreaming) {
        throw new Error('Already processing a message');
      }

      if (!conversationId) {
        throw new Error('Conversation ID is required');
      }

      const clientMetadata = getClientMetadata();

      const payload = {
        organizationId,
        conversationId,
        messageContent: messageContent.trim(),
        email,
        name,
        clientMetadata,
        useCarlaAgent: true, // Flag to use new Carla agent
      };
      wsRef.current.send(JSON.stringify(payload));
    },
    [organizationId, email, name, isStreaming, getClientMetadata],
  );

  // Connect on mount
  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    isStreaming,
    currentTool,
    sendMessage,
    connect,
    disconnect,
  };
};
