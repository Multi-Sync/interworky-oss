'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, Trash2, Github, X } from 'lucide-react';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '../../components/ui/Button';
import { formatMessageTime } from '@/_common/utils/utils';
import { getOrganization } from '@/_common/utils/localStorage';
import { GitHubConnectionModal } from './components/GitHubConnectionModal';
import { ConversationSidebar } from './components/ConversationSidebar';
import { BeatLoader } from 'react-spinners';
import { useCarlaWebSocket } from '@/_common/hooks/useCarlaWebSocket';

const CarlaMessage = ({ message, role }) => {
  return (
    <div className={`flex ${role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`${
          role === 'user'
            ? 'bg-neutral-800 text-white rounded-br-sm shadow-sm'
            : 'bg-surface-elevated text-white rounded-bl-sm border border-border-default shadow-sm'
        } w-fit max-w-[70%] break-words p-4 text-left rounded-[15px] text-balance relative`}
      >
        <div className="flex items-start gap-2">
          {role === 'assistant' && (
            <div className="flex-shrink-0 w-8 h-8 rounded-full border-2 border-border-subtle overflow-hidden -top-5 -left-2 ring-2 ring-border-default absolute bg-white">
              <Image
                src="/interworky-character.webp"
                alt="Carla"
                width={32}
                height={32}
                className="object-cover rounded-full"
                quality={75}
                loading="lazy"
              />
            </div>
          )}
          <div className="flex-1">
            <div className={`prose prose-sm max-w-none text-sm ${role === 'user' ? 'prose-invert' : ''}`}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  // Customize heading styles
                  h1: ({ node, ...props }) => (
                    <h1
                      className={`text-lg font-bold mt-4 mb-2 ${role === 'assistant' ? 'text-gray-100' : ''}`}
                      {...props}
                    />
                  ),
                  h2: ({ node, ...props }) => (
                    <h2
                      className={`text-base font-bold mt-3 mb-2 ${role === 'assistant' ? 'text-gray-100' : ''}`}
                      {...props}
                    />
                  ),
                  h3: ({ node, ...props }) => (
                    <h3
                      className={`text-sm font-bold mt-2 mb-1 ${role === 'assistant' ? 'text-gray-100' : ''}`}
                      {...props}
                    />
                  ),
                  // Customize list styles
                  ul: ({ node, ...props }) => (
                    <ul
                      className={`list-disc list-inside my-2 space-y-1 ${role === 'assistant' ? 'text-gray-100' : ''}`}
                      {...props}
                    />
                  ),
                  ol: ({ node, ...props }) => (
                    <ol
                      className={`list-decimal list-inside my-2 space-y-1 ${role === 'assistant' ? 'text-gray-100' : ''}`}
                      {...props}
                    />
                  ),
                  li: ({ node, ...props }) => <li className="ml-2" {...props} />,
                  // Customize link styles
                  a: ({ node, ...props }) => (
                    <a
                      className={`${role === 'user' ? 'text-white underline hover:text-gray-200' : 'text-blue-400 hover:text-blue-300'} hover:underline font-medium transition-colors`}
                      target="_blank"
                      rel="noopener noreferrer"
                      {...props}
                    />
                  ),
                  // Customize code blocks
                  code: ({ node, inline, ...props }) =>
                    inline ? (
                      <code
                        className={`${role === 'user' ? 'bg-white/20 text-white' : 'bg-neutral-700 text-gray-100'} px-1.5 py-0.5 rounded text-xs font-mono font-semibold`}
                        {...props}
                      />
                    ) : (
                      <code
                        className={`block ${role === 'user' ? 'bg-white/20 text-white border-white/30' : 'bg-neutral-800 text-gray-100 border-border-default'} p-3 rounded my-2 overflow-x-auto text-xs font-mono border`}
                        {...props}
                      />
                    ),
                  // Customize paragraphs
                  p: ({ node, ...props }) => (
                    <p
                      className={`my-1 ${role === 'assistant' ? 'text-gray-100 leading-relaxed' : 'leading-relaxed'}`}
                      {...props}
                    />
                  ),
                  // Customize strong/bold
                  strong: ({ node, ...props }) => (
                    <strong className={`font-bold ${role === 'assistant' ? 'text-white' : ''}`} {...props} />
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
            <p className={`text-xs mt-2 ${role === 'user' ? 'text-white/70' : 'text-gray-400'}`}>
              {message.timestamp ? formatMessageTime(message.timestamp) : 'Just now'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const CarlaChatPage = () => {
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showGithubModal, setShowGithubModal] = useState(false);
  const [githubConnected, setGithubConnected] = useState(false);
  const [connectedRepo, setConnectedRepo] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [streamingMessage, setStreamingMessage] = useState(''); // For real-time streaming
  const [currentConversationId, setCurrentConversationId] = useState(null); // Active conversation
  const [conversations, setConversations] = useState([]); // List of all conversations
  const [isLoadingConversation, setIsLoadingConversation] = useState(false); // Loading state for switching conversations
  const [isCheckingGithub, setIsCheckingGithub] = useState(false); // Loading state for GitHub status check
  const [isDisconnectingGithub, setIsDisconnectingGithub] = useState(false); // Loading state for GitHub disconnect
  const [isClearingConversation, setIsClearingConversation] = useState(false); // Loading state for clearing conversation
  const messagesEndRef = useRef(null);
  const sendingRef = useRef(false); // Prevent duplicate sends
  const autoSentRef = useRef(false); // Track if auto-send has been executed
  const timeoutsRef = useRef([]); // Track all setTimeout calls for cleanup

  // Get organization from localStorage (memoized to prevent re-reads)
  const organizationId = useMemo(() => {
    const organization = getOrganization();
    return organization?.organization?.id;
  }, []);

  // Helper to create tracked timeouts that clean up automatically
  const setTrackedTimeout = useCallback((callback, delay) => {
    const timeoutId = setTimeout(() => {
      callback();
      // Remove from tracking array after execution
      timeoutsRef.current = timeoutsRef.current.filter(id => id !== timeoutId);
    }, delay);
    timeoutsRef.current.push(timeoutId);
    return timeoutId;
  }, []);

  // Cleanup all timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(timeoutId => clearTimeout(timeoutId));
      timeoutsRef.current = [];
    };
  }, []);

  // WebSocket connection handlers (stable - no dependencies)
  const handleWsMessage = useCallback(data => {
    if (data.type === 'streaming') {
      // Update streaming message in real-time
      setStreamingMessage(data.content);
    } else if (data.type === 'complete') {
      // Finalize the message
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'assistant',
          content: data.content,
          timestamp: new Date(),
        },
      ]);
      setStreamingMessage('');
      setIsLoading(false);
    }
  }, []); // Empty deps - uses setState updater functions

  const handleWsError = useCallback(error => {
    console.error('[CarlaWS] Error:', error);
    setError(error);
    setIsLoading(false);
    setStreamingMessage('');
  }, []); // Empty deps - stable callback

  // Initialize WebSocket connection
  const {
    isConnected,
    isStreaming,
    currentTool,
    sendMessage: wsSendMessage,
  } = useCarlaWebSocket({
    organizationId: organizationId || '',
    email: session?.user?.email || 'guest@interworky.com',
    name: session?.user?.name || 'Guest User',
    onMessage: handleWsMessage,
    onError: handleWsError,
  });

  // Helper to clean URL parameters after processing
  const cleanUrlParameters = () => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('message');
      url.searchParams.delete('autoSend');
      window.history.replaceState({}, '', url.toString());
    }
  };

  // Load conversations and initialize chat when component mounts
  useEffect(() => {
    const initializeChat = async () => {
      if (!isInitialized && organizationId && session?.id) {
        await loadConversationList();
        checkGithubStatus();
      }
    };

    initializeChat();
    // eslint-disable-next-line
  }, [isInitialized, organizationId, session?.id]);

  // Handle auto-send from URL parameters (separate effect)
  useEffect(() => {
    // Wait for initialization and conversation to be ready
    if (!isInitialized || !currentConversationId || autoSentRef.current) return;

    const urlMessage = searchParams.get('message');
    const autoSend = searchParams.get('autoSend');

    // Handle URL-based message (prefill or auto-send)
    if (urlMessage) {
      const decodedMessage = decodeURIComponent(urlMessage);

      // Validate message length (max 5000 characters)
      if (decodedMessage.length > 5000) {
        setError('Message too long (max 5000 characters)');
        cleanUrlParameters();
        return;
      }

      // Set input message for prefill
      setInputMessage(decodedMessage);

      // Only auto-send if autoSend=true
      if (autoSend === 'true') {
        autoSentRef.current = true; // Mark as auto-sent to prevent duplicate sends

        // Show visual feedback
        setSuccessMessage('🚀 Auto-sending your message...');

        // Wait for messages to load, then check if message already exists
        // Only check if we have messages loaded (to avoid race condition)
        const messageExists =
          messages.length > 0 &&
          messages.some(msg => msg.role === 'user' && msg.content.trim() === decodedMessage.trim());

        if (!messageExists) {
          // Message doesn't exist, safe to auto-send
          sendMessageWithContent(decodedMessage)
            .then(() => {
              // Clean URL after successful send
              cleanUrlParameters();
              setSuccessMessage('✅ Message sent successfully');
              setTrackedTimeout(() => setSuccessMessage(null), 3000);
            })
            .catch(err => {
              console.error('Auto-send failed:', err);
              setError('Failed to auto-send message. Please try sending manually.');
              setSuccessMessage(null);
              autoSentRef.current = false; // Reset on failure so user can retry
              // Don't clean URL so user can retry
            });
        } else {
          // Message already exists, just clean URL
          cleanUrlParameters();
          setSuccessMessage('ℹ️ Message already in conversation');
          setTrackedTimeout(() => setSuccessMessage(null), 3000);
        }
      } else {
        // Just prefill, clean URL to avoid confusion
        cleanUrlParameters();
      }
    }
    // Check for pending message from localStorage (performance monitoring)
    else if (!autoSentRef.current) {
      const pendingMessage = localStorage.getItem('carla_pending_message');
      if (pendingMessage) {
        // Clear the pending message
        localStorage.removeItem('carla_pending_message');

        // Validate message length
        if (pendingMessage.length > 5000) {
          setError('Message too long (max 5000 characters)');
          return;
        }

        // Set it as input message and auto-send
        setInputMessage(pendingMessage);
        autoSentRef.current = true; // Mark as auto-sent to prevent duplicate sends

        setSuccessMessage('🚀 Auto-sending performance query...');
        sendMessageWithContent(pendingMessage)
          .then(() => {
            setSuccessMessage('✅ Performance query sent');
            setTrackedTimeout(() => setSuccessMessage(null), 3000);
          })
          .catch(err => {
            console.error('Auto-send failed:', err);
            setError('Failed to auto-send message. Please try sending manually.');
            setSuccessMessage(null);
            autoSentRef.current = false; // Reset on failure so user can retry
          });
      }
    }
    // eslint-disable-next-line
  }, [searchParams, isInitialized, currentConversationId, messages]);

  const checkGithubStatus = async () => {
    try {
      setIsCheckingGithub(true);

      if (!organizationId) {
        console.error('Organization not found');
        return;
      }

      const response = await fetch(`/api/mcp/github/status?organization_id=${organizationId}`);
      const data = await response.json();
      setGithubConnected(data.connected || false);
      if (data.connected && data.repo) {
        setConnectedRepo(data.repo);
      }
    } catch (error) {
      console.error('Error checking GitHub status:', error);
      setError('Failed to check GitHub status');
    } finally {
      setIsCheckingGithub(false);
    }
  };

  const handleGithubSuccess = repo => {
    setGithubConnected(true);
    setConnectedRepo(repo);
    setSuccessMessage(`✅ Successfully connected to ${repo}`);
    setTrackedTimeout(() => setSuccessMessage(null), 5000);
    checkGithubStatus();
  };

  const disconnectGithub = async () => {
    try {
      setIsDisconnectingGithub(true);

      if (!organizationId) {
        setError('Organization not found. Please refresh the page.');
        return;
      }

      const response = await fetch('/api/mcp/github/connect', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organization_id: organizationId,
        }),
      });

      if (response.ok) {
        setGithubConnected(false);
        setConnectedRepo(null);
        setSuccessMessage('✅ GitHub disconnected successfully');
        setTrackedTimeout(() => setSuccessMessage(null), 5000);
        // Refresh status to update UI
        setTrackedTimeout(() => checkGithubStatus(), 500);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to disconnect GitHub');
      }
    } catch (error) {
      console.error('Disconnect GitHub error:', error);
      setError('Failed to disconnect GitHub. Please try again.');
    } finally {
      setIsDisconnectingGithub(false);
    }
  };

  // Load list of all conversations
  const loadConversationList = async () => {
    try {
      const response = await fetch(`/api/chat/conversations?organizationId=${organizationId}&userId=${session?.id}`);
      const data = await response.json();

      setConversations(data.conversations || []);

      // Load most recent conversation or create new
      if (data.conversations?.length > 0) {
        await switchConversation(data.conversations[0].id);
      } else {
        await createNewConversation();
      }

      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to load conversations:', error);
      setError('Failed to load conversations');
    }
  };

  // Switch to a different conversation
  const switchConversation = async conversationId => {
    try {
      // Clear messages first to force re-render
      setMessages([]);
      setIsLoadingConversation(true);
      setError(null);

      const url = `/api/chat?organizationId=${organizationId}&conversationId=${conversationId}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setCurrentConversationId(conversationId);
        setMessages(data.messages || []);
      } else {
        console.error('[switchConversation] Failed - data.success is false:', data);
        setError('Failed to load conversation');
      }
    } catch (error) {
      console.error('[switchConversation] Exception:', error);
      setError('Failed to switch conversation');
    } finally {
      setIsLoadingConversation(false);
    }
  };

  // Create new conversation
  const createNewConversation = async () => {
    try {
      const response = await fetch(`/api/chat/conversations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId }),
      });
      const data = await response.json();

      setCurrentConversationId(data.id);
      setMessages([]);

      // Refresh conversation list
      const listResponse = await fetch(
        `/api/chat/conversations?organizationId=${organizationId}&userId=${session?.id}`,
      );
      const listData = await listResponse.json();
      setConversations(listData.conversations || []);

      return data.id; // Return the new conversation ID
    } catch (error) {
      console.error('Failed to create conversation:', error);
      setError('Failed to create conversation');
      throw error; // Throw error to prevent message sending
    }
  };

  const sendMessageWithContent = async messageContent => {
    // Prevent duplicate sends
    if (!messageContent.trim() || isStreaming || sendingRef.current) {
      return Promise.reject(new Error('Cannot send message: already sending or empty message'));
    }

    // Check WebSocket connection
    if (!isConnected) {
      setError('WebSocket not connected. Please wait or refresh the page.');
      return Promise.reject(new Error('WebSocket not connected'));
    }

    // Validate conversationId exists, create one if missing
    let activeConversationId = currentConversationId;
    if (!activeConversationId) {
      try {
        activeConversationId = await createNewConversation();
        if (!activeConversationId) {
          throw new Error('Failed to create conversation');
        }
      } catch (error) {
        setError('Failed to create conversation. Please try again.');
        return Promise.reject(error);
      }
    }

    // Set sending flag immediately
    sendingRef.current = true;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: messageContent,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setError(null);

    try {
      // Send via WebSocket with conversationId
      await wsSendMessage(messageContent, activeConversationId);
      return Promise.resolve();
    } catch (error) {
      console.error('Send message error:', error);
      setError(error.message || 'Failed to send message');
      // Remove the user message if sending failed
      setMessages(prev => prev.slice(0, -1));
      setIsLoading(false);
      return Promise.reject(error);
    } finally {
      sendingRef.current = false; // Reset sending flag
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;
    await sendMessageWithContent(inputMessage);
  };

  const clearConversation = async () => {
    try {
      setIsClearingConversation(true);

      // Clear local state and create a new conversation
      setMessages([]);
      autoSentRef.current = false; // Reset auto-send flag

      // Create a new conversation to start fresh
      await createNewConversation();
    } catch (error) {
      console.error('Clear conversation error:', error);
      setError('Failed to create new conversation');
    } finally {
      setIsClearingConversation(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="h-screen bg-app-bg flex overflow-hidden">
      {/* Conversation Sidebar */}
      <ConversationSidebar
        conversations={conversations}
        currentConversationId={currentConversationId}
        onSelectConversation={switchConversation}
        onNewConversation={createNewConversation}
        isLoading={!isInitialized}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-surface border-b border-border-default shadow-sm">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full border border-border-default overflow-hidden ring-2 ring-border-subtle">
                  <Image
                    src="/interworky-character.webp"
                    alt="Carla"
                    width={48}
                    height={48}
                    className="object-cover rounded-full"
                    quality={75}
                  />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold text-gray-50">Carla Chat</h1>
                  <p className="text-sm text-gray-400">Your AI assistant for analytics & performance</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {/* WebSocket Connection Status */}
                <div
                  className={`px-3 py-2 rounded-lg border flex items-center gap-2 ${
                    isConnected ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}
                  />
                  <span className={`text-xs font-medium ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                    {isConnected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>

                {githubConnected ? (
                  <Button
                    intent="success"
                    size="medium"
                    onClick={disconnectGithub}
                    disabled={isDisconnectingGithub}
                    isLoading={isDisconnectingGithub}
                    className="flex items-center gap-2"
                  >
                    <Github className="w-4 h-4" />
                    <div className="flex flex-col items-start">
                      <span className="text-xs">{isDisconnectingGithub ? 'Disconnecting...' : 'GitHub Connected'}</span>
                      {connectedRepo && !isDisconnectingGithub && (
                        <span className="text-xs opacity-75">{connectedRepo}</span>
                      )}
                    </div>
                  </Button>
                ) : (
                  <Button
                    intent="secondary"
                    size="medium"
                    onClick={() => setShowGithubModal(true)}
                    disabled={isCheckingGithub}
                    className="flex items-center gap-2"
                  >
                    <Github className="w-4 h-4" />
                    {isCheckingGithub ? 'Checking...' : 'Connect GitHub'}
                  </Button>
                )}
                <Button
                  intent="secondary"
                  size="medium"
                  onClick={clearConversation}
                  disabled={isClearingConversation}
                  isLoading={isClearingConversation}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  {isClearingConversation ? 'Clearing...' : 'Clear Chat'}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-6 py-6 overflow-hidden">
          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border-l-4 border-red-400 p-4 mb-6 rounded backdrop-blur-sm">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto bg-surface rounded-lg shadow-sm border border-border-default p-6 mb-6 scrollbar">
            {isLoadingConversation ? (
              <BeatLoader color="#058A7C" />
            ) : messages.length === 0 && !isLoading ? (
              <div className="text-center text-gray-400">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full border border-border-default overflow-hidden ring-4 ring-border-subtle mt-8">
                  <Image
                    src="/interworky-character.webp"
                    alt="Carla"
                    width={96}
                    height={96}
                    className="object-cover rounded-full"
                    quality={75}
                  />
                </div>
                <h3 className="text-lg font-medium text-gray-50 mb-2">Hi! I&apos;m Carla</h3>
                <p className="text-gray-400 mb-8">
                  Your AI assistant with access to all your analytics and performance data
                </p>

                {/* Conversation Starters */}
                <div className="max-w-2xl mx-auto">
                  <h4 className="text-sm font-medium text-gray-300 mb-4 text-left">Try asking me about:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <button
                      onClick={() => sendMessageWithContent('Show me error statistics from the last 7 days')}
                      className="group p-4 bg-surface-elevated hover:bg-neutral-700 border border-border-default hover:border-border-subtle rounded-lg text-left transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-red-400"
                          >
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-200 group-hover:text-gray-100 transition-colors">
                            Error Statistics
                          </p>
                          <p className="text-xs text-gray-400 mt-1">View recent errors and trends</p>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => sendMessageWithContent('Analyze visitor engagement metrics')}
                      className="group p-4 bg-surface-elevated hover:bg-neutral-700 border border-border-default hover:border-border-subtle rounded-lg text-left transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-green-500/20 border border-green-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-green-400"
                          >
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-200 group-hover:text-gray-100 transition-colors">
                            Visitor Engagement
                          </p>
                          <p className="text-xs text-gray-400 mt-1">Analyze user behavior patterns</p>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => sendMessageWithContent('Show me recent conversations and their outcomes')}
                      className="group p-4 bg-surface-elevated hover:bg-neutral-700 border border-border-default hover:border-border-subtle rounded-lg text-left transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-teal-400"
                          >
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-200 group-hover:text-gray-100 transition-colors">
                            Conversations
                          </p>
                          <p className="text-xs text-gray-400 mt-1">Recent visitor conversations</p>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => sendMessageWithContent('Show me recent high-severity errors')}
                      className="group p-4 bg-surface-elevated hover:bg-neutral-700 border border-border-default hover:border-border-subtle rounded-lg text-left transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-orange-500/20 border border-orange-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-orange-400"
                          >
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-200 group-hover:text-gray-100 transition-colors">
                            Critical Errors
                          </p>
                          <p className="text-xs text-gray-400 mt-1">High-priority issues to fix</p>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              !isLoadingConversation &&
              messages.length > 0 && (
                <div key={currentConversationId} className="space-y-4">
                  <AnimatePresence mode="wait">
                    {messages.map((message, index) => {
                      return (
                        <motion.div
                          key={`${message.id || message._id || index}-${message.timestamp || message.createdAt || index}`}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          <CarlaMessage message={message} role={message.role} />
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>

                  {/* Streaming message display */}
                  {isStreaming && streamingMessage && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start mb-4">
                      <div className="bg-surface-elevated text-white rounded-bl-sm border border-border-default shadow-sm w-fit max-w-[70%] break-words p-4 rounded-[15px] text-balance relative">
                        <div className="flex items-start gap-2">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full border-2 border-border-subtle overflow-hidden -top-5 -left-2 ring-2 ring-border-default absolute bg-white">
                            <Image
                              src="/interworky-character.webp"
                              alt="Carla"
                              width={32}
                              height={32}
                              className="object-cover rounded-full"
                              quality={75}
                              loading="lazy"
                            />
                          </div>
                          <div className="flex-1">
                            <div className="prose prose-sm max-w-none text-sm">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>{streamingMessage}</ReactMarkdown>
                            </div>
                            {currentTool && (
                              <p className="text-xs text-blue-400 mt-2 flex items-center gap-1">
                                <span className="animate-pulse">🔧</span> {currentTool.message}
                              </p>
                            )}
                            <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                              <span className="animate-pulse">●</span> Streaming...
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Loading indicator when waiting for stream to start */}
                  {isLoading && !streamingMessage && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                      <div className="bg-surface-elevated p-4 rounded-lg rounded-bl-sm border border-border-default shadow-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full border border-border-default overflow-hidden">
                            <Image
                              src="/interworky-character.webp"
                              alt="Carla"
                              width={24}
                              height={24}
                              className="object-cover rounded-full"
                              quality={75}
                            />
                          </div>
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                            <div
                              className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                              style={{ animationDelay: '0.1s' }}
                            ></div>
                            <div
                              className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                              style={{ animationDelay: '0.2s' }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              )
            )}
          </div>

          {/* Input */}
          <div className="bg-surface rounded-lg shadow-sm border border-border-default p-4">
            {!isConnected && (
              <div className="mb-3 px-3 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <p className="text-xs text-yellow-400">⚠️ WebSocket disconnected. Attempting to reconnect...</p>
              </div>
            )}
            <div className="flex gap-3">
              <input
                type="text"
                value={inputMessage}
                onChange={e => setInputMessage(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey && isConnected) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder={isConnected ? 'Type your message...' : 'Waiting for connection...'}
                className="flex-1 p-3 bg-surface-elevated border border-border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-white placeholder-gray-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!isConnected || isStreaming}
              />
              <Button
                intent="primary"
                size="medium"
                onClick={sendMessage}
                disabled={!inputMessage.trim() || !isConnected || isStreaming}
                isLoading={isStreaming}
                className="flex items-center gap-2 px-6"
              >
                <Send className="w-4 h-4" />
                Send
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 shadow-lg backdrop-blur-sm"
          >
            <p className="text-sm text-green-400">{successMessage}</p>
          </motion.div>
        </div>
      )}

      {/* GitHub Connection Modal */}
      <GitHubConnectionModal
        isOpen={showGithubModal}
        onClose={() => setShowGithubModal(false)}
        onSuccess={handleGithubSuccess}
      />
    </div>
  );
};

export default CarlaChatPage;
