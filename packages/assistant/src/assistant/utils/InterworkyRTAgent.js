// src/utils/InterworkyRTAgent.js
import { RealtimeAgent, RealtimeSession } from '@openai/agents/realtime';
import { Usage } from '@openai/agents-core';
import { getSessionKey } from '../../utils/api/rtc-session';
import { getWebsiteKnowledgeTool } from '../../utils/tools/getWebsiteKnowledge';
import { captureEmailTool } from '../../utils/tools/captureEmail';
import { getClientInfoTool } from '../../utils/tools/getClientInfo';
import { requestAppointmentTool } from '../../utils/tools/requestAppointment';
import { logger } from '../../utils/logger';
import {
  getAssistantInfo,
  getOrgMethods,
  setOrgMethods,
  getOrganization,
} from './state';
import { closeConversation } from '../../utils/api/conversationApi';
import { getOrgMethodsByOrganizationId } from '../../utils/api/organizationMehodsApi';
import { convertMethodsToTools } from '../../utils/tools/dynamicTools';

/**
 * InterworkyRTAgent wraps the OpenAI Agents SDK to maintain compatibility
 * with the existing RealtimeClient interface while providing enhanced features.
 */
export class InterworkyRTAgent extends EventTarget {
  constructor({
    model = process.env.AI_REALTIME_MODEL || 'gpt-4o-realtime-preview-2024-12-17',
    iceServers = [], // Kept for compatibility
    textOnly = false, // New parameter for text-only mode
  } = {}) {
    super();
    this.model = model;
    this.iceServers = iceServers;
    this.textOnly = textOnly; // Store text-only mode
    this.session = null;
    this.openAIRTAgent = null;
    this.audioElement = null;
    this.audioCtx = null;
    this.connecting = false;
    this.micStream = null; // For backward compatibility with UI

    // Usage tracking
    this.initialUsage = null;
    this.currentUsage = new Usage();

    // Audio state - Privacy-first defaults
    this.speakerMuted = false;
    this.remoteAudioEl = null;
    this.micMutedOnInit = true; // Start with mic muted for privacy
  }

  /**
   * Initialize and connect using OpenAI Agents SDK
   */
  async connect(audioElement = null, instructions = '') {
    if (this.isConnected()) return this;
    if (this.connecting) return this;

    this.connecting = true;
    this.audioElement = audioElement;

    try {
      // Load built-in tools
      let tools = [getWebsiteKnowledgeTool];
      if (getAssistantInfo().contact_info_required) {
        tools.push(captureEmailTool);
      }
      if (getAssistantInfo().appointments_enabled) {
        tools.push(getClientInfoTool, requestAppointmentTool);
      }

      // Load dynamic tools from organization_methods
      try {
        const organization = getOrganization();
        if (organization && organization.id) {
          logger.debug('IW024', 'Loading organization methods', {
            organizationId: organization.id,
          });

          // Fetch fresh org methods from API instead of using cached state
          // This ensures we have the latest methods even if state wasn't populated yet
          let orgMethods = getOrgMethods();
          // If not in cache or empty, fetch from API
          if (
            !orgMethods ||
            !Array.isArray(orgMethods) ||
            orgMethods.length === 0
          ) {
            logger.debug('IW024b', 'Fetching organization methods from API');
            orgMethods = await getOrgMethodsByOrganizationId(organization.id);
            console.log('orgMethods from API', orgMethods);

            // Update cache for future use
            if (orgMethods && Array.isArray(orgMethods)) {
              setOrgMethods(orgMethods);
            }
          }

          if (
            orgMethods &&
            Array.isArray(orgMethods) &&
            orgMethods.length > 0
          ) {
            logger.info('IW025', 'Loaded organization methods', {
              count: orgMethods.length,
            });

            // Convert methods to tools and add to tools array
            let dynamicTools = convertMethodsToTools(orgMethods);
            //only 5 tools
            dynamicTools.length = Math.min(dynamicTools.length, 5);
            tools = [...tools, ...dynamicTools];

            logger.info('IW026', 'Total tools loaded', {
              builtIn: tools.length - dynamicTools.length,
              dynamic: dynamicTools.length,
              total: tools.length,
            });
          } else {
            logger.info('IW025b', 'No organization methods found');
          }
        }
      } catch (error) {
        logger.error('IW027', 'Failed to load organization methods', {
          error: error.message,
        });
        // Continue with built-in tools only
      }

      // 1) Create OpenAI Realtime Agent with your instructions
      this.openAIRTAgent = new RealtimeAgent({
        name: 'Interworky Assistant',
        instructions: instructions || 'You are a helpful Interworky assistant.',
        tools: tools,
      });

      // 2) Get API key from your backend first
      const session = await getSessionKey(instructions);
      const apiKey = session.value;

      // 3) Configure session based on text-only mode
      const sessionConfig = this.textOnly
        ? {
            type: 'realtime',
            modalities: ['text'],
            tools: tools,
            instructions: instructions,
            turn_detection: { type: 'none' },
          }
        : {
            type: 'realtime',
            modalities: ['audio'],
            voice: 'sage',
            input_audio_transcription: { model: 'whisper-1' },
            tools: tools,
            instructions: instructions,
            turn_detection: {
              type: 'server_vad',
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 200,
            },

            model: this.model,
          };

      // 4) Create session with configuration
      this.session = new RealtimeSession(this.openAIRTAgent, {
        transport: this.textOnly ? 'websocket' : 'webrtc',
        model: this.model,
        config: sessionConfig,
        apiKey: apiKey,
      });

      // 5) Setup event listeners before connecting
      this.setupEventListeners();

      // 6) Handle audio setup only for non-text-only mode
      if (!this.textOnly) {
        // Attach audio element
        if (this.audioElement) {
          this.attachRemoteAudioElement(this.audioElement);
        }

        // Create audio context for compatibility
        this.audioCtx = {
          state: 'running',
          suspend: () => Promise.resolve(),
          resume: () => Promise.resolve(),
        };

        // Create mock micStream for UI compatibility
        // The OpenAI Agents SDK handles microphone internally, but UI components expect micStream
        try {
          this.micStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              sampleRate: { ideal: 44100 },
              channelCount: { ideal: 1 },
            },
          });
        } catch (error) {
          logger.warn(
            'IW022',
            'Could not create micStream for UI compatibility',
            { error: error.message }
          );
          // Create a mock stream for compatibility
          this.micStream = {
            getAudioTracks: () => [],
            getTracks: () => [],
          };
        }
      } else {
        this.audioCtx = null; // No audio context needed for text-only
        this.micStream = null; // No mic stream - this prevents getUserMedia calls
      }
      // 7) Connect using SDK
      await this.session.connect({
        apiKey,
        ...(this.textOnly && {
          initialSessionConfig: {
            modalities: ['text'],
            turn_detection: { type: 'none' },
          },
        }),
      });
    } catch (error) {
      logger.error('IW019', 'Connection error occurred', {
        error: error.message,
        stack: error.stack,
      });
      this.dispatchEvent(new CustomEvent('error', { detail: error }));
    } finally {
      this.connecting = false;
    }

    return this;
  }

  /**
   * Setup event listeners to map SDK events to RealtimeClient-compatible events
   */
  setupEventListeners() {
    logger.debug('IW001', 'Setting up event listeners');
    const transport = this.session.transport;
    transport.on('*', (event) => {
      logger.debug('IW002', 'Transport event received', {
        eventType: event.type,
      });
    });

    if (this.textOnly) {
      // Text-only mode: Listen for text streaming events
      transport.on('response.text.delta', (ev) => {
        logger.debug('IW003', 'Text delta received', { delta: ev.delta });
        this.dispatchEvent(
          new CustomEvent('message', {
            detail: { type: 'response.text.delta', text: ev.delta },
          })
        );
      });

      transport.on('response.text.done', () => {
        logger.debug('IW004', 'Text done received');
        this.dispatchEvent(
          new CustomEvent('message', {
            detail: { type: 'response.done' },
          })
        );
      });

      // Also listen for other text events that might be used
      transport.on('response.output_text.delta', (ev) => {
        logger.debug('IW005', 'Output text delta received', {
          delta: ev.delta,
        });
        this.dispatchEvent(
          new CustomEvent('message', {
            detail: { type: 'response.text.delta', text: ev.delta },
          })
        );
      });

      transport.on('response.output_text.done', () => {
        logger.debug('IW006', 'Output text done received');
        this.dispatchEvent(
          new CustomEvent('message', {
            detail: { type: 'response.done' },
          })
        );
      });

      // Listen for any response events
      transport.on('response', (response) => {
        logger.debug('IW007', 'Response event received', { response });
        this.dispatchEvent(
          new CustomEvent('message', {
            detail: { type: 'response', response },
          })
        );
      });
    } else {
      // Audio mode: Handle audio transcript events
      transport.on('audio_transcript_delta', (delta) => {
        logger.debug('IW003', 'Text delta received', { delta });
        const messageEvent = {
          type: 'response.text.delta',
          delta: delta,
        };
        this.dispatchEvent(
          new CustomEvent('message', { detail: messageEvent })
        );
      });

      transport.on('text_done', (text) => {
        logger.debug('IW004', 'Text done received', { text });
        const messageEvent = {
          type: 'response.done',
          response: {
            output: [
              {
                type: 'message',
                role: 'assistant',
                content: [
                  {
                    type: 'text',
                    text: text,
                  },
                ],
              },
            ],
          },
        };
        this.dispatchEvent(
          new CustomEvent('message', { detail: messageEvent })
        );
      });
    }

    // Handle audio transcript events for text-only mode
    transport.on('response.output_audio_transcript.done', (event) => {
      if (this.textOnly) {
        logger.debug('IW005', 'Audio transcript received in text-only mode', {
          transcript: event.transcript,
        });
        const messageEvent = {
          type: 'response.done',
          response: {
            output: [
              {
                type: 'message',
                role: 'assistant',
                content: [
                  {
                    type: 'text',
                    text: event.transcript,
                  },
                ],
              },
            ],
          },
        };
        this.dispatchEvent(
          new CustomEvent('message', { detail: messageEvent })
        );
      }
    });

    // Handle text delta events - let them flow through normally
    transport.on('response.output_audio_transcript.delta', (event) => {
      if (this.textOnly) {
        logger.debug('IW006', 'Text delta in text-only mode', {
          delta: event.delta,
        });
      }
      // Don't interfere with the normal event flow
    });

    // Handle response output item done events (this is the main event for text responses)
    transport.on('response.output_item.done', (event) => {
      logger.debug('IW007', 'Response output item done', { event });
      const messageEvent = {
        type: 'response.output_item.done',
        item: event.item,
        output_index: event.output_index,
        response_id: event.response_id,
      };
      this.dispatchEvent(new CustomEvent('message', { detail: messageEvent }));
    });

    // Handle function calls
    transport.on('function_call', (call) => {
      logger.debug('IW008', 'Function call received', { call });
      const messageEvent = {
        type: 'function_call',
        function_call: call,
      };
      this.dispatchEvent(new CustomEvent('message', { detail: messageEvent }));
    });

    // Handle session events
    transport.on('session_created', (session) => {
      logger.debug('IW009', 'Session created', { session });
      const messageEvent = {
        type: 'session.created',
        session: session,
      };
      this.dispatchEvent(new CustomEvent('message', { detail: messageEvent }));
    });

    // Handle session updates
    transport.on('session_updated', (session) => {
      logger.debug('IW010', 'Session updated', { session });
      const messageEvent = {
        type: 'session.updated',
        session: session,
      };
      this.dispatchEvent(new CustomEvent('message', { detail: messageEvent }));
    });

    // Handle conversation item created events
    transport.on('conversation.item.created', (event) => {
      logger.debug('IW011', 'Conversation item created', { event });
      const messageEvent = {
        type: 'conversation.item.created',
        item: event.item,
      };
      this.dispatchEvent(new CustomEvent('message', { detail: messageEvent }));
    });

    // Handle conversation item retrieved events
    transport.on('conversation.item.retrieved', (event) => {
      logger.debug('IW012', 'Conversation item retrieved', { event });
      const messageEvent = {
        type: 'conversation.item.retrieved',
        item: event.item,
      };
      this.dispatchEvent(new CustomEvent('message', { detail: messageEvent }));
    });

    // Handle response done events
    transport.on('response.done', (event) => {
      logger.debug('IW013', 'Response done', { event });
      const messageEvent = {
        type: 'response.done',
        response: event.response,
      };
      this.dispatchEvent(new CustomEvent('message', { detail: messageEvent }));
    });

    // Connection status events
    transport.on('connection_change', (status) => {
      // console.log('Connection status:', status);
      if (status === 'connected') {
        this.dispatchEvent(new Event('open'));
      } else if (status === 'disconnected') {
        this.dispatchEvent(new Event('close'));
      }
    });

    // Error events
    transport.on('error', (error) => {
      logger.error('IW014', 'Transport error occurred', { error });
      this.dispatchEvent(new CustomEvent('error', { detail: error }));
    });

    // Usage tracking - key for token monitoring!
    transport.on('usage_update', (usage) => {
      logger.debug('IW015', 'Usage update received', { usage });
      this.currentUsage = usage;
    });

    // Log all events for debugging
    // transport.on('*', (event) => {
    // console.log('Transport event:', event);
    // });

    // Log audio events in text-only mode but don't interfere
    if (this.textOnly) {
      transport.on('output_audio_buffer.started', () => {
        logger.warn('IW016', 'Audio buffer started in text-only mode');
      });

      transport.on('output_audio_buffer.stopped', () => {
        logger.warn('IW017', 'Audio buffer stopped in text-only mode');
      });

      transport.on('response.output_audio.done', () => {
        logger.warn('IW018', 'Audio generation done in text-only mode');
      });
    }
  }

  /**
   * Check if connected
   */
  isConnected() {
    return this.session?.transport?.status === 'connected';
  }

  /**
   * Send a JSON event (compatibility method)
   */
  send(eventObj) {
    if (!this.isConnected()) {
      logger.error('IW020', 'Cannot send event - not connected', {
        eventType: eventObj.type,
      });
      return;
    }

    try {
      // Handle different event types
      if (
        eventObj.type === 'conversation.item.create' &&
        eventObj.item?.type === 'message'
      ) {
        // Send text message
        const content = eventObj.item.content?.[0]?.text || '';
        // console.log('Sending text message via RT Agent:', content);

        if (this.textOnly) {
          // Text-only mode: Use WebSocket transport events
          this.session.transport.sendEvent({
            type: 'conversation.item.create',
            item: {
              type: 'message',
              role: 'user',
              content: [{ type: 'input_text', text: content }],
            },
          });

          // Request a response (text-only based on session config)
          this.session.transport.sendEvent({
            type: 'response.create',
          });
        } else {
          // Audio mode: Use the proper sendMessage method
          this.session.sendMessage(content);
        }
      } else if (eventObj.type === 'function_call_output') {
        // Handle function call outputs for text mode
        // console.log('Sending function call output via RT Agent:', eventObj);
        this.session.sendMessage(`Function call result: ${eventObj.output}`);
      } else if (eventObj.type === 'response.create') {
        // Handle response creation
        // console.log('Triggering response creation via RT Agent');
        this.session.sendMessage('');
      } else {
        // For other events, send directly if possible
        // console.log('Sending event:', eventObj);
        // The SDK handles most events internally
      }
    } catch (error) {
      logger.error('IW021', 'Error sending event', {
        error: error.message,
        eventType: eventObj.type,
      });
    }
  }

  /**
   * Audio controls using SDK methods
   */
  muteMic() {
    // console.log('Muting microphone via SDK');
    if (this.session) {
      this.session.mute(true);
    }

    // Also update mock micStream for UI compatibility
    if (this.micStream && this.micStream.getAudioTracks) {
      this.micStream.getAudioTracks().forEach((track) => {
        track.enabled = false;
      });
    }
  }

  unMuteMic() {
    // console.log('Unmuting microphone via SDK');
    if (this.session) {
      this.session.mute(false);
    }

    // Also update mock micStream for UI compatibility
    if (this.micStream && this.micStream.getAudioTracks) {
      this.micStream.getAudioTracks().forEach((track) => {
        track.enabled = true;
      });
    }
  }

  isMicMuted() {
    return this.session?.muted || false;
  }

  /**
   * Stop agent response (interrupt)
   */
  stopAgent() {
    // console.log('Stopping agent response');
    this.session?.transport?.interrupt();
    this.muteMic(); // Ensure mic is muted when stopping agent
  }

  /**
   * Attach audio element for playback
   */
  attachRemoteAudioElement(el) {
    this.remoteAudioEl = el;
    if (el) {
      el.muted = this.speakerMuted;
      el.autoplay = true;
    }
  }

  /**
   * Mute/unmute incoming audio (compatibility methods)
   */
  muteIncomingAudio() {
    this.speakerMuted = true;
    if (this.remoteAudioEl) {
      this.remoteAudioEl.muted = true;
    }
  }

  unmuteIncomingAudio() {
    this.speakerMuted = false;
    if (this.remoteAudioEl) {
      this.remoteAudioEl.muted = false;
    }
  }

  /**
   * Usage tracking methods using official SDK
   */
  getCurrentUsage() {
    // console.log('=== getCurrentUsage() called ===');
    // console.log('Current usage from events:', this.currentUsage);
    return this.currentUsage;
  }

  getSessionUsage() {
    return this.currentUsage; // Current usage IS the session usage
  }

  getSessionCost(pricePerToken = 0.00002) {
    const sessionUsage = this.getSessionUsage();
    const cost = sessionUsage.totalTokens * pricePerToken;
    // console.log('=== Cost Calculation ===');
    // console.log('Session tokens:', sessionUsage.totalTokens);
    // console.log('Price per token:', pricePerToken);
    // console.log('Calculated cost:', cost);
    return cost;
  }

  getSessionTokens() {
    const sessionUsage = this.getSessionUsage();
    return sessionUsage.totalTokens;
  }

  resetSessionUsage() {
    this.currentUsage = new Usage();
    logger.debug('IW023', 'Session usage reset to zero');
  }

  /**
   * Close the connection and trigger conversation closure with email notification
   */
  close() {
    // Close SDK session
    if (this.session?.transport) {
      this.session.transport.close();
    }

    // Cleanup micStream for UI compatibility
    if (this.micStream && this.micStream.getTracks) {
      this.micStream.getTracks().forEach((track) => track.stop());
    }

    // Close the session
    this.session.close();

    // Close conversation and send email notification to organization owner
    // This is done asynchronously to avoid blocking the UI cleanup
    closeConversation().catch((error) => {
      logger.error(
        'IW056',
        'Failed to close conversation during agent cleanup',
        {
          error: error.message,
        }
      );
    });
  }
}

// Export both for compatibility
export { InterworkyRTAgent as RealtimeClient };
