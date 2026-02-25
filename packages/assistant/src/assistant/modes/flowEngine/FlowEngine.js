// src/assistant/modes/flowEngine/FlowEngine.js
import { RealtimeAgent, RealtimeSession } from '@openai/agents/realtime';
import { tool } from '@openai/agents';
import { z } from 'zod';
import { getSessionKey } from '../../../utils/api/rtc-session';
import { logger } from '../../../utils/logger';

/**
 * FlowEngine - Dynamically creates and manages multi-agent voice flows
 * based on JSON configuration from the backend
 */

// Store for collected data during flow execution
let flowData = {};

/**
 * Convert flowConfig parameter type to Zod schema
 */
function paramTypeToZod(paramConfig) {
  const type = paramConfig.type || 'string';
  let schema;

  switch (type) {
    case 'number':
    case 'integer':
      schema = z.number();
      break;
    case 'boolean':
      schema = z.boolean();
      break;
    case 'array':
      schema = z.array(z.string());
      break;
    case 'object':
      schema = z.object({}).passthrough();
      break;
    case 'string':
    default:
      schema = z.string();
      break;
  }

  // Handle enum values
  if (paramConfig.enum && paramConfig.enum.length > 0) {
    schema = z.enum(paramConfig.enum);
  }

  // Add description
  if (paramConfig.description) {
    schema = schema.describe(paramConfig.description);
  }

  // Make optional if not required
  if (!paramConfig.required) {
    schema = schema.optional();
  }

  return schema;
}

/**
 * Build Zod schema from flowConfig tool parameters
 */
function buildZodSchema(toolConfig) {
  const schemaShape = {};

  if (toolConfig.parameters) {
    Object.entries(toolConfig.parameters).forEach(([paramName, paramConfig]) => {
      schemaShape[paramName] = paramTypeToZod(paramConfig);
    });
  }

  return z.object(schemaShape);
}

/**
 * Create an SDK tool from flow config using the official tool() function
 * This creates tools that the SDK can properly manage during handoffs
 */
function createSDKTool(toolId, toolConfig, flowConfig) {
  const zodSchema = buildZodSchema(toolConfig);

  return tool({
    name: toolId,
    description: toolConfig.description || `Tool: ${toolId}`,
    parameters: zodSchema,
    execute: async (args) => {
      logger.debug('FLOW_ENGINE_001', 'SDK tool executed', { toolName: toolId, args });

      // Store the data under the tool name
      if (!flowData[toolId]) {
        flowData[toolId] = [];
      }
      flowData[toolId].push(args);

      // Return confirmation message
      return `Data saved successfully for ${toolId}`;
    },
  });
}

/**
 * Create a tool definition from flow config (legacy format for session.update fallback)
 */
function createToolFromConfig(toolId, toolConfig) {
  const parameters = {
    type: 'object',
    properties: {},
    required: [],
  };

  if (toolConfig.parameters) {
    Object.entries(toolConfig.parameters).forEach(([paramName, paramConfig]) => {
      parameters.properties[paramName] = {
        type: paramConfig.type || 'string',
        description: paramConfig.description || '',
      };
      if (paramConfig.enum) {
        parameters.properties[paramName].enum = paramConfig.enum;
      }
      if (paramConfig.required) {
        parameters.required.push(paramName);
      }
    });
  }

  return {
    type: 'function',
    name: toolId,
    description: toolConfig.description,
    parameters,
  };
}

/**
 * Handle tool calls - store data in flowData
 */
function handleToolCall(toolName, args, flowConfig) {
  logger.debug('FLOW_ENGINE_001', 'Tool called', { toolName, args });

  // Store the data under the tool name
  if (!flowData[toolName]) {
    flowData[toolName] = [];
  }
  flowData[toolName].push(args);

  // Return confirmation message
  const toolConfig = flowConfig.tools?.[toolName];
  if (toolConfig) {
    return `Data saved successfully for ${toolName}`;
  }
  return 'Data saved';
}

/**
 * Build SDK tools array for an agent (using tool() function)
 * These are proper SDK tools with execute functions that the SDK manages
 */
function buildSDKToolsForAgent(agentConfig, flowConfig) {
  return (agentConfig.tools || [])
    .map((toolId) => {
      const toolConfig = flowConfig.tools?.[toolId];
      if (toolConfig) {
        return createSDKTool(toolId, toolConfig, flowConfig);
      }
      return null;
    })
    .filter(Boolean);
}

/**
 * Build tools array for session.update (OpenAI Realtime API format)
 * These are plain objects that the Realtime API accepts directly.
 * Used as fallback for manual tool configuration.
 */
function buildToolsForAgent(agentConfig, flowConfig) {
  return (agentConfig.tools || [])
    .map((toolId) => {
      const toolConfig = flowConfig.tools?.[toolId];
      if (toolConfig) {
        return createToolFromConfig(toolId, toolConfig);
      }
      return null;
    })
    .filter(Boolean);
}

/**
 * Create RealtimeAgents from flow configuration
 * Uses SDK's tool() function for proper tool management during handoffs.
 * The SDK automatically creates transfer_to_X tools for handoffs.
 */
function createAgentsFromConfig(flowConfig) {
  const agents = {};
  const agentConfigs = flowConfig.agents;

  // First pass: Create all agents WITH their SDK tools
  // Using tool() function ensures the SDK properly manages tools during handoffs
  Object.entries(agentConfigs).forEach(([agentId, agentConfig]) => {
    const sdkTools = buildSDKToolsForAgent(agentConfig, flowConfig);

    logger.info('FLOW_ENGINE_AGENT', 'Creating agent with SDK tools', {
      agentId,
      agentName: agentConfig.name,
      toolCount: sdkTools.length,
      toolNames: sdkTools.map((t) => t.name),
    });

    agents[agentId] = new RealtimeAgent({
      name: agentConfig.name,
      instructions: agentConfig.instructions,
      tools: sdkTools, // Now passing proper SDK tools
    });
  });

  // Second pass: Set up handoffs
  // The SDK will automatically create transfer_to_X tools for each handoff target
  Object.entries(agentConfigs).forEach(([agentId, agentConfig]) => {
    if (agentConfig.handoffsTo && agentConfig.handoffsTo.length > 0) {
      const handoffTargets = agentConfig.handoffsTo
        .map((targetId) => agents[targetId])
        .filter(Boolean);

      agents[agentId].handoffs = handoffTargets;

      logger.info('FLOW_ENGINE_HANDOFF', 'Setting up handoffs for agent', {
        agentId,
        agentName: agentConfig.name,
        handoffsTo: agentConfig.handoffsTo,
        handoffCount: handoffTargets.length,
      });
    }
  });

  return agents;
}

/**
 * DynamicFlowSession - Manages voice session for any flow configuration
 */
export class DynamicFlowSession extends EventTarget {
  constructor(flowConfig) {
    super();
    this.flowConfig = flowConfig;
    this.model = flowConfig.voice_config?.model || process.env.AI_REALTIME_MODEL || 'gpt-4o-realtime-preview-2024-12-17';
    this.voice = flowConfig.voice_config?.voice || 'sage';
    this.silenceDuration = flowConfig.voice_config?.silence_duration_ms || 500;
    this.session = null;
    this.agents = null;
    this.audioElement = null;
    this.connecting = false;
    this.micStream = null;
    this.currentAgent = null;

    // Track current voice for agent-specific voice changes
    this.currentVoice = this.voice;

    // Track called tools for progress (more accurate than agents)
    this.calledTools = new Set();

    // Current state for UI feedback
    this.currentState = 'connecting';

    // Clear flow data
    flowData = {};
  }

  async connect(audioElement = null) {
    if (this.isConnected()) return this;
    if (this.connecting) return this;

    this.connecting = true;
    this.audioElement = audioElement;

    try {
      // Create agents from config
      this.agents = createAgentsFromConfig(this.flowConfig);

      // Get the starting agent
      const startAgentId = this.flowConfig.start_agent;
      const startAgent = this.agents[startAgentId];

      if (!startAgent) {
        throw new Error(`Start agent "${startAgentId}" not found in flow config`);
      }

      this.currentAgent = startAgent;

      // Get API key from backend
      const session = await getSessionKey(startAgent.instructions);
      const apiKey = session.value;

      // Configure session for voice
      const sessionConfig = {
        type: 'realtime',
        modalities: ['audio'],
        voice: this.voice,
        input_audio_transcription: { model: 'whisper-1' },
        instructions: startAgent.instructions,
        turn_detection: {
          type: 'server_vad',
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: this.silenceDuration,
        },
        model: this.model,
      };

      // Create session with start agent
      this.session = new RealtimeSession(startAgent, {
        transport: 'webrtc',
        model: this.model,
        config: sessionConfig,
        apiKey,
      });

      // Setup event listeners
      this.setupEventListeners();

      // Setup audio
      if (this.audioElement) {
        this.audioElement.autoplay = true;
      }

      // Get microphone access
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
        logger.warn('FLOW_ENGINE_002', 'Could not get microphone', {
          error: error.message,
        });
      }

      // Connect the session
      await this.session.connect({ apiKey });

      logger.info('FLOW_ENGINE_003', 'Flow session connected', {
        flowId: this.flowConfig.flow_id,
        startAgent: startAgentId,
      });

      this.dispatchEvent(new Event('connected'));
    } catch (error) {
      logger.error('FLOW_ENGINE_004', 'Connection error', {
        error: error.message,
      });
      this.dispatchEvent(new CustomEvent('error', { detail: error }));
    } finally {
      this.connecting = false;
    }

    return this;
  }

  setupEventListeners() {
    const transport = this.session.transport;

    // Track current assistant response for accumulating transcript
    let currentAssistantTranscript = '';

    // Handle agent handoffs
    // NOTE: agent_handoff is emitted by the SESSION, not the transport
    // Signature: (context, fromAgent, toAgent)
    this.session.on('agent_handoff', (context, fromAgent, toAgent) => {
      this.currentAgent = toAgent;

      logger.info('FLOW_ENGINE_005', 'Agent handoff', {
        from: fromAgent?.name,
        to: toAgent?.name,
        toAgentFull: toAgent,
      });

      // Get the new agent's config to check for voice override
      // First try by name, then search by matching
      let agentConfig = this.getAgentConfig(toAgent?.name);

      // If not found by name, the toAgent might already have the config
      if (!agentConfig && toAgent) {
        // Try to find in our flow config by matching the agent name
        const agents = this.flowConfig.agents || {};
        for (const [key, config] of Object.entries(agents)) {
          if (config.name === toAgent?.name) {
            agentConfig = config;
            break;
          }
        }
      }

      logger.info('FLOW_ENGINE_005b', 'Agent config lookup', {
        searchedName: toAgent?.name,
        foundConfig: !!agentConfig,
        configName: agentConfig?.name,
        configVoice: agentConfig?.voice,
      });

      // If the new agent has a specific voice, update the session
      if (agentConfig?.voice && agentConfig.voice !== this.currentVoice) {
        this.updateSessionVoice(transport, agentConfig.voice);
        this.currentVoice = agentConfig.voice;
        logger.info('FLOW_ENGINE_015', 'Voice changed for agent', {
          agent: toAgent?.name,
          voice: agentConfig.voice,
        });
      }

      // Tools are now managed by SDK - no manual update needed
      // The SDK automatically handles tool switching during handoffs
      logger.info('FLOW_ENGINE_HANDOFF_TOOLS', 'SDK handling tools for new agent', {
        agent: toAgent?.name,
        toolCount: toAgent?.tools?.length || 0,
      });

      this.dispatchEvent(
        new CustomEvent('handoff', {
          detail: {
            from: fromAgent?.name,
            to: toAgent?.name,
            agentConfig,
            progress: this.getProgress(),
          },
        })
      );

      // Trigger the new agent to speak their greeting if defined
      if (agentConfig?.greeting) {
        // Send a system message to prompt the agent to use their greeting
        setTimeout(() => {
          this.dispatchEvent(
            new CustomEvent('agent_greeting', {
              detail: {
                agent: toAgent?.name,
                greeting: agentConfig.greeting,
              },
            })
          );
        }, 300);
      }
    });

    // Handle agent_start - fires when a new agent begins processing
    // This is the signal that the handoff is complete and the new agent is active
    // NOTE: agent_start is emitted by the SESSION, not the transport
    this.session.on('agent_start', (context, agent) => {
      const agentName = agent?.name || this.currentAgent?.name;

      logger.info('FLOW_ENGINE_AGENT_START', 'Agent started', {
        agentName,
        agent: agent?.name,
        hasContext: !!context,
      });

      // Look up the full agent config from flow config
      let agentConfig = this.getAgentConfig(agentName);

      // If not found by name, search by matching
      if (!agentConfig && agentName) {
        const agents = this.flowConfig.agents || {};
        for (const [key, config] of Object.entries(agents)) {
          if (config.name === agentName) {
            agentConfig = config;
            break;
          }
        }
      }

      // Emit agent_change event with all UI-relevant details
      this.dispatchEvent(
        new CustomEvent('agent_change', {
          detail: {
            name: agentConfig?.name || agentName,
            job_title: agentConfig?.job_title || agentConfig?.jobTitle || null,
            voice: agentConfig?.voice || this.currentVoice,
            avatar: agentConfig?.avatar || null,
            theme_color: agentConfig?.theme_color || agentConfig?.themeColor || null,
            agentConfig,
            progress: this.getProgress(),
          },
        })
      );

      logger.info('FLOW_ENGINE_AGENT_CHANGE', 'Agent change event dispatched', {
        name: agentConfig?.name || agentName,
        job_title: agentConfig?.job_title,
        voice: agentConfig?.voice,
      });
    });

    // Handle function calls - SDK tools have execute() functions that handle data storage
    // We just need to track progress and emit UI events here
    transport.on('function_call', (call) => {
      // Emit thinking state before tool execution
      this.dispatchEvent(
        new CustomEvent('state_change', {
          detail: { state: 'thinking', reason: 'tool_call', tool: call.name },
        })
      );

      logger.info('FLOW_ENGINE_TOOL_CALL', 'Tool called via SDK', {
        toolName: call.name,
        hasExecute: !!call.execute,
        args: call.arguments,
      });

      // Track tool for progress
      this.calledTools.add(call.name);

      this.dispatchEvent(
        new CustomEvent('tool_result', {
          detail: {
            tool: call.name,
            args: call.arguments,
            progress: this.getProgress(),
          },
        })
      );

      // Note: SDK tools now handle execution via their execute() function
      // The SDK manages the response cycle - no manual sendToolResponse needed
    });

    // Handle assistant transcript streaming
    transport.on('audio_transcript_delta', (event) => {
      // event can be { delta: "text" } or just "text" depending on transport
      const deltaText = typeof event === 'string' ? event : (event?.delta || '');
      currentAssistantTranscript += deltaText;
      this.dispatchEvent(
        new CustomEvent('transcript', {
          detail: { type: 'assistant', delta: deltaText, partial: currentAssistantTranscript },
        })
      );
      // Update state to speaking when we get transcript
      this.dispatchEvent(
        new CustomEvent('state_change', {
          detail: { state: 'speaking' },
        })
      );
    });

    // Handle assistant transcript complete
    transport.on('response.output_audio_transcript.done', (event) => {
      if (event.transcript) {
        this.dispatchEvent(
          new CustomEvent('transcript', {
            detail: { type: 'assistant', text: event.transcript, complete: true },
          })
        );
      }
      currentAssistantTranscript = '';
    });

    // Handle user transcript complete
    transport.on('input_audio_transcription.completed', (event) => {
      this.dispatchEvent(
        new CustomEvent('transcript', {
          detail: { type: 'user', text: event.transcript },
        })
      );
    });

    // Handle speech states
    transport.on('input_audio_buffer.speech_started', () => {
      this.dispatchEvent(
        new CustomEvent('state_change', {
          detail: { state: 'user_speaking' },
        })
      );
    });

    transport.on('input_audio_buffer.speech_stopped', () => {
      this.dispatchEvent(
        new CustomEvent('state_change', {
          detail: { state: 'thinking', reason: 'processing_speech' },
        })
      );
    });

    transport.on('output_audio_buffer.started', () => {
      this.dispatchEvent(
        new CustomEvent('state_change', {
          detail: { state: 'speaking' },
        })
      );
    });

    transport.on('output_audio_buffer.stopped', () => {
      this.dispatchEvent(
        new CustomEvent('state_change', {
          detail: { state: 'listening' },
        })
      );
    });

    // Connection events
    transport.on('connection_change', (status) => {
      if (status === 'connected') {
        // Tools are now properly set on agents via SDK's tool() function
        // No need for manual session.update - SDK manages tools during handoffs
        logger.info('FLOW_ENGINE_CONNECTED', 'Session connected with SDK tools', {
          agent: this.currentAgent?.name,
        });

        this.dispatchEvent(new Event('open'));
        // Trigger initial greeting after connection
        this.triggerInitialGreeting();
      } else if (status === 'disconnected') {
        this.dispatchEvent(new Event('close'));
      }
    });

    transport.on('error', (error) => {
      logger.error('FLOW_ENGINE_006', 'Transport error', { error });
      this.dispatchEvent(new CustomEvent('error', { detail: error }));
    });

    // Response completion
    transport.on('response.done', (event) => {
      currentAssistantTranscript = '';
      this.dispatchEvent(
        new CustomEvent('message', {
          detail: { type: 'response.done', response: event.response },
        })
      );
      // Back to listening after response completes
      this.dispatchEvent(
        new CustomEvent('state_change', {
          detail: { state: 'listening' },
        })
      );
    });
  }

  /**
   * Trigger initial greeting when session connects
   */
  triggerInitialGreeting() {
    const initialGreeting = this.flowConfig.initial_greeting;
    const startAgentConfig = this.flowConfig.agents?.[this.flowConfig.start_agent];
    const agentGreeting = startAgentConfig?.greeting || initialGreeting;

    // Emit initial agent_change event so UI knows about the first agent
    this.dispatchEvent(
      new CustomEvent('agent_change', {
        detail: {
          name: startAgentConfig?.name || this.currentAgent?.name,
          job_title: startAgentConfig?.job_title || startAgentConfig?.jobTitle || null,
          voice: startAgentConfig?.voice || this.currentVoice,
          avatar: startAgentConfig?.avatar || null,
          theme_color: startAgentConfig?.theme_color || startAgentConfig?.themeColor || null,
          agentConfig: startAgentConfig,
          progress: this.getProgress(),
          isInitial: true,
        },
      })
    );

    logger.info('FLOW_ENGINE_INITIAL_AGENT', 'Initial agent_change event dispatched', {
      name: startAgentConfig?.name,
      job_title: startAgentConfig?.job_title,
      voice: startAgentConfig?.voice,
    });

    if (agentGreeting) {
      logger.info('FLOW_ENGINE_009', 'Triggering initial greeting', {
        greeting: agentGreeting.substring(0, 50) + '...',
      });

      this.dispatchEvent(
        new CustomEvent('initial_greeting', {
          detail: {
            agent: this.currentAgent?.name,
            greeting: agentGreeting,
          },
        })
      );
    }
  }

  /**
   * Get agent config by name
   */
  getAgentConfig(agentName) {
    if (!agentName) return null;
    const agents = this.flowConfig.agents || {};
    return Object.values(agents).find((a) => a.name === agentName) || null;
  }

  /**
   * Get progress through the flow based on tools called
   * Completion is determined by the finalize/generate tool being called,
   * not just by counting all tools.
   */
  getProgress() {
    const totalTools = Object.keys(this.flowConfig.tools || {}).length;
    const called = this.calledTools.size;
    const percentage = totalTools > 0 ? Math.round((called / totalTools) * 100) : 0;

    // Check if the finalize tool has been called
    // Finalize tools typically start with "finalize_" or "generate_"
    const finalizeToolCalled = Array.from(this.calledTools).some(
      (tool) => tool.startsWith('finalize_') || tool.startsWith('generate_')
    );

    return {
      current: called,
      total: totalTools,
      percentage,
      isNearEnd: called >= totalTools - 1 && !finalizeToolCalled,
      isComplete: finalizeToolCalled,
    };
  }

  isConnected() {
    return this.session?.transport?.status === 'connected';
  }

  mute(muted = true) {
    if (this.session) {
      this.session.mute(muted);
    }
    if (this.micStream) {
      this.micStream.getAudioTracks().forEach((track) => {
        track.enabled = !muted;
      });
    }
  }

  isMuted() {
    return this.session?.muted || false;
  }

  /**
   * Send tool response back to OpenAI Realtime API
   * @param {Object} transport - The session transport
   * @param {string} callId - The function call ID
   * @param {string} toolName - The name of the tool that was called
   * @param {string} result - The result from the tool execution
   */
  sendToolResponse(transport, callId, toolName, result) {
    if (!transport) {
      logger.warn('FLOW_ENGINE_011', 'No transport available to send tool response');
      return;
    }

    logger.debug('FLOW_ENGINE_012', 'Sending tool response', { callId, toolName });

    try {
      // Send function_call_output via conversation.item.create
      transport.sendEvent({
        type: 'conversation.item.create',
        item: {
          type: 'function_call_output',
          call_id: callId,
          output: typeof result === 'string' ? result : JSON.stringify(result),
        },
      });

      // Trigger response generation after tool output
      // This is required - the Realtime API doesn't automatically respond after function_call_output.
      // May occasionally cause duplicate messages during handoffs, but silence is worse.
      transport.sendEvent({
        type: 'response.create',
      });
    } catch (error) {
      logger.error('FLOW_ENGINE_013', 'Error sending tool response', {
        error: error.message,
        callId,
        toolName,
      });
    }
  }

  /**
   * Update the session voice when switching agents
   * @param {Object} transport - The session transport
   * @param {string} newVoice - The new voice to use
   */
  updateSessionVoice(transport, newVoice) {
    if (!transport) {
      logger.warn('FLOW_ENGINE_016', 'No transport available to update voice');
      return;
    }

    try {
      transport.sendEvent({
        type: 'session.update',
        session: {
          type: "realtime",
          voice: newVoice,
        },
      });
      logger.debug('FLOW_ENGINE_017', 'Session voice updated', { voice: newVoice });
    } catch (error) {
      logger.error('FLOW_ENGINE_018', 'Error updating session voice', {
        error: error.message,
        voice: newVoice,
      });
    }
  }

  /**
   * Configure tools for the current agent via session.update
   * @deprecated - Tools are now managed by SDK via tool() function
   * This is kept for backward compatibility but should not be needed.
   * @param {Object} transport - The session transport (optional, will use this.session.transport)
   * @param {Object} agentConfig - Optional specific agent config (defaults to start agent)
   */
  configureToolsForCurrentAgent(transport = null, agentConfig = null) {
    logger.warn('FLOW_ENGINE_DEPRECATED', 'configureToolsForCurrentAgent is deprecated - SDK manages tools now');
    const sessionTransport = transport || this.session?.transport;
    if (!sessionTransport) {
      logger.warn('FLOW_ENGINE_019', 'No transport available to configure tools');
      return;
    }

    // Get agent config - either passed in or find start agent
    const config =
      agentConfig || this.flowConfig.agents?.[this.flowConfig.start_agent];

    if (!config) {
      logger.warn('FLOW_ENGINE_020', 'No agent config found for tools');
      return;
    }

    // Build tools array for this agent
    const tools = buildToolsForAgent(config, this.flowConfig);

    logger.info('FLOW_ENGINE_021', 'Configuring tools for agent', {
      agentName: config.name,
      toolCount: tools.length,
      toolNames: tools.map((t) => t.name),
    });

    try {
      sessionTransport.sendEvent({
        type: 'session.update',
        session: {
          type: 'realtime',
          tools,
        },
      });
    } catch (error) {
      logger.error('FLOW_ENGINE_022', 'Error configuring tools', {
        error: error.message,
        agentName: config.name,
      });
    }
  }

  /**
   * Get all collected data from the flow
   */
  getFlowData() {
    return { ...flowData };
  }

  /**
   * Get flow configuration
   */
  getFlowConfig() {
    return this.flowConfig;
  }

  /**
   * Get current agent name
   */
  getCurrentAgentName() {
    return this.currentAgent?.name || 'Unknown';
  }

  /**
   * End session and return final data
   */
  close() {
    if (this.session?.transport) {
      this.session.transport.close();
    }
    if (this.micStream) {
      this.micStream.getTracks().forEach((track) => track.stop());
    }
    if (this.session) {
      this.session.close();
    }

    const finalData = this.getFlowData();
    logger.info('FLOW_ENGINE_007', 'Flow session closed', {
      flowId: this.flowConfig.flow_id,
      dataKeys: Object.keys(finalData),
    });

    // Dispatch completion event with final data
    this.dispatchEvent(
      new CustomEvent('completed', {
        detail: {
          flowId: this.flowConfig.flow_id,
          data: finalData,
          outputSchema: this.flowConfig.output_schema,
        },
      })
    );

    return finalData;
  }
}

/**
 * Fetch flow configuration from backend
 */
export async function fetchFlowConfig(flowId) {
  const apiUrl = process.env.NODE_PUBLIC_API_URL || 'http://localhost:3015';

  try {
    const response = await fetch(`${apiUrl}/api/flows/public/${flowId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch flow: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    logger.error('FLOW_ENGINE_008', 'Failed to fetch flow config', {
      flowId,
      error: error.message,
    });
    throw error;
  }
}

/**
 * Create a flow session from flow ID
 */
export async function createFlowSession(flowId) {
  const flowConfig = await fetchFlowConfig(flowId);
  return new DynamicFlowSession(flowConfig);
}

export {
  createAgentsFromConfig,
  createToolFromConfig,
  buildToolsForAgent,
  handleToolCall,
  // New SDK-compatible exports
  createSDKTool,
  buildSDKToolsForAgent,
  buildZodSchema,
  paramTypeToZod,
};
