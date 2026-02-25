const EventHandler = require("./openAIStreamEventHandler");
const {
  getThreadIdFromOrganizationConversationThreads,
  saveThreadIdToOrganizationConversationThreads,
} = require("./services/organizationConversationService");
const axios = require("axios");
const OpenAI = require("openai");
const { threadCache, vectorStoreCache } = require("./state");
const { Runner } = require("@openai/agents");
const { createCarlaAgent } = require("./agents/carlaAgent");
const { createMobileAgent } = require("./agents/mobileAgent");
const Sentry = require("@sentry/node");
// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.AI_API_KEY || process.env.OPENAI_API_KEY,
  baseURL: process.env.AI_BASE_URL || "https://api.openai.com/v1",
});

async function runInterworkyAssistant(
  organizationId,
  assistantId,
  messageContent,
  email,
  name,
  ws,
  key,
  clients,
  clientMetadata,
  voiceEnabled,
) {
  try {
    // Check cache for vector_store_ids using assistantId
    let vector_store_ids;
    if (vectorStoreCache.has(assistantId)) {
      vector_store_ids = vectorStoreCache.get(assistantId);
    } else {
      const assistant = await openai.beta.assistants.retrieve(assistantId);
      if (
        assistant.tool_resources &&
        assistant.tool_resources.file_search &&
        assistant.tool_resources.file_search.vector_store_ids &&
        assistant.tool_resources.file_search.vector_store_ids.length > 0
      ) {
        vector_store_ids =
          assistant.tool_resources.file_search.vector_store_ids;
        // Cache the vector store ids for future use
        vectorStoreCache.set(assistantId, vector_store_ids);
      }
    }

    // Create a cache key for thread using email and assistantId
    const threadCacheKey = `${email}:${assistantId}`;
    let threadData;
    if (threadCache.has(threadCacheKey)) {
      threadData = threadCache.get(threadCacheKey);
    } else {
      threadData = await getOrCreateThread(
        organizationId,
        email,
        vector_store_ids,
      );
      // Cache the thread data for future requests
      threadCache.set(threadCacheKey, threadData);
    }
    const { threadId, firstMessage } = threadData;

    // console.time("Cancel Active Runs");
    // await cancelActiveRuns(threadId);
    // console.timeEnd("Cancel Active Runs");

    if (voiceEnabled) {
      //triggers if the user thinks the transcription is wrong
      if (messageContent == "$cancel_run$") {
        cancelActiveRuns(threadId);
        console.log("Canceling active runs");
        return;
      }
    }

    await addMessageToThread(
      threadId,
      messageContent,
      firstMessage,
      clientMetadata,
      voiceEnabled,
    );

    const eventHandler = new EventHandler(openai, organizationId, voiceEnabled);
    eventHandler.ws = ws; // Pass WebSocket reference
    eventHandler.threadId = threadId;
    eventHandler.clientData = clients.get(key) || {};
    eventHandler.clientKey = key;
    eventHandler.clients = clients;
    eventHandler.on("event", eventHandler.onEvent.bind(eventHandler));

    const stream = await openai.beta.threads.runs.create(threadId, {
      assistant_id: assistantId,
      stream: true,
      tool_choice: { type: "file_search" },
    });

    for await (const event of stream) {
      if (event.event === "thread.run.failed") {
        console.log(event.data.last_error);
        ws.send(
          JSON.stringify({
            error: event.data.last_error,
          }),
        );
      }
      eventHandler.emit("event", event);
    }
  } catch (error) {
    console.error("Error running assistant:", error.message);
    ws.send(
      JSON.stringify({
        error: `${error.message}, please contact hello@interworky.com if the issue persists.`,
      }),
    );
  }
}

async function runInterworkyAssistantLM(
  messageContent,
  systemMessage,
  modelName,
  ws,
  lmStudioEndpoint,
) {
  try {
    // Construct the payload
    const payload = {
      model: modelName,
      messages: [
        {
          role: "system",
          content: systemMessage,
        },
        {
          role: "user",
          content: messageContent,
        },
      ],
      temperature: 0.7,
      max_tokens: -1,
      stream: true,
    };

    let fullMessage = ""; // Buffer to collect the message parts

    // Make the POST request to LM Studio
    const response = await axios.post(lmStudioEndpoint, payload, {
      headers: {
        "Content-Type": "application/json",
      },
      responseType: "stream", // Enable streaming response
    });

    // Process the streaming response
    response.data.on("data", (chunk) => {
      // Convert chunk to string and remove whitespace
      const data = chunk.toString().trim();

      // Check if the data starts with 'data:' and isn't '[DONE]'
      if (data.startsWith("data:") && data !== "data: [DONE]") {
        try {
          // Parse the JSON after removing the 'data:' prefix
          const message = JSON.parse(data.slice(5)); // Remove 'data:' prefix

          // Check if the 'choices' array exists and has content
          if (message.choices && message.choices.length > 0) {
            const content = message.choices[0].delta.content || ""; // Extract content
            fullMessage += content; // Append content to the buffer
            console.log("Extracted content:", content); // Log the extracted content
          }
        } catch (error) {
          console.error("Error parsing data chunk:", error.message);
        }
      }
    });

    response.data.on("end", () => {
      // console.log("Stream ended");
      // Send the full concatenated message to the WebSocket
      ws.send(fullMessage.trim());
    });

    response.data.on("error", (error) => {
      console.error("Error in LM Studio response stream:", error.message);
      ws.send(
        JSON.stringify({
          error: `${error.message}, please contact ahmed@interworky.com if the issue persists.`,
        }),
      );
    });
  } catch (error) {
    console.error("Error running assistant:", error.message);
    ws.send(
      JSON.stringify({
        error: `${error.message}, please contact hello@interworky.com if the issue persists.`,
      }),
    );
  }
}

// Cancel any active runs associated with the thread
async function cancelActiveRuns(threadId) {
  try {
    const runs = await openai.beta.threads.runs.list(threadId);
    // console.log("Active runs:", { runs });
    for (const run of runs.data) {
      console.log(`Canceling active run: ${run.id}`);
      await openai.beta.threads.runs.cancel(threadId, run.id);
    }
  } catch (error) {
    console.error("Error canceling active runs:", error.message);
  }
}

async function getOrCreateThread(organizationId, email, vector_store_ids) {
  let threadId = await getThreadIdFromOrganizationConversationThreads(
    organizationId,
    email,
  );
  // console.log({ threadId });
  let firstMessage = false;
  let threadExistsOnOpenAI;
  if (threadId) {
    threadExistsOnOpenAI = await openai.beta.threads.retrieve(threadId);
  }
  if (!threadId || !threadExistsOnOpenAI || !threadExistsOnOpenAI.id) {
    // console.log("first time convo");
    firstMessage = true;
    const threadResponse = await openai.beta.threads.create({
      ...(vector_store_ids && vector_store_ids.length > 0
        ? {
            tool_resources: {
              file_search: {
                vector_store_ids,
              },
            },
          }
        : {}),
    });
    threadId = threadResponse.id;
    await saveThreadIdToOrganizationConversationThreads(
      organizationId,
      email,
      threadId,
    );
  }

  return { threadId, firstMessage };
}

async function addMessageToThread(
  threadId,
  messageContent,
  firstMessage,
  clientMetadata,
  voiceEnabled,
) {
  let content = messageContent;
  if (firstMessage) {
    let userMetadata;
    try {
      userMetadata = `
    The user is speaking to you from ${clientMetadata.origin || "an unknown website"}, 
    and the user ip is ${clientMetadata.ip},
    The user's browser type is ${clientMetadata.userAgent || "unknown"}. 
    The time now for the user is ${new Date().toLocaleTimeString("en-US", { timeZone: clientMetadata.timeZone || "UTC" }) || "unknown"}, 
    today date for the user is ${clientMetadata.todayDate || "unknown"},
    today week date for the user is ${clientMetadata.todayWeekday || "unknown"},
    and the user's timezone is ${clientMetadata.timeZone || "unknown"}. 
    The user's preferred language is ${clientMetadata.language || "unknown"}.
  `
        .replace(/\s+/g, " ")
        .trim();
    } catch (err) {
      console.error(err);
    }
    const voiceEnabledMetadata = voiceEnabled
      ? `The user is speaking to you using voice so be aware of trabscription errors and try to respond from the knowledge base or the context of the conversation`
      : ``;
    // console.log({ userMetadata });
    await openai.beta.threads.messages.create(threadId, {
      role: "assistant",
      content: `The user who is sending the question has these metadata ${userMetadata ?? ""}, feel free to use to provide the best answer, ${voiceEnabledMetadata}`,
    });
    content = `${messageContent}`;
  }

  return await openai.beta.threads.messages.create(threadId, {
    role: "user",
    content,
  });
}

// In-memory conversation state storage
const conversationStates = new Map(); // key: `${organizationId}:${conversationId}`

// Clean up old conversation states every 30 minutes
setInterval(
  () => {
    const now = new Date();
    const INACTIVE_TIMEOUT = 60 * 60 * 1000; // 1 hour

    for (const [key, state] of conversationStates.entries()) {
      if (now - state.lastActivity > INACTIVE_TIMEOUT) {
        console.log(
          "[CarlaAgent] Cleaning up inactive conversation state:",
          key,
        );
        conversationStates.delete(key);
      }
    }
  },
  30 * 60 * 1000,
); // Run every 30 minutes

/**
 * Run Carla Agent with streaming support via WebSocket
 * Maintains conversation history for context awareness
 * @param {string} organizationId - Organization ID
 * @param {string} conversationId - Conversation ID for state isolation
 * @param {string} messageContent - User message
 * @param {string} email - User email
 * @param {string} name - User name
 * @param {WebSocket} ws - WebSocket connection
 * @param {Object} clientMetadata - Client metadata (timezone, device, etc.)
 * @param {Array} mcpServers - MCP servers for GitHub access (optional)
 */
async function runCarlaAgent(
  organizationId,
  conversationId,
  messageContent,
  email,
  name,
  ws,
  clientMetadata,
  mcpServers = [],
) {
  try {
    console.log("\n========== CARLA AGENT EXECUTION STARTED ==========");
    console.log("[CarlaAgent] Organization:", organizationId);
    console.log("[CarlaAgent] Conversation:", conversationId);
    console.log("[CarlaAgent] User:", email);
    console.log(
      "[CarlaAgent] Message:",
      messageContent.substring(0, 100) + "...",
    );

    // Get or create conversation state - CHANGED: Use conversationId in state key
    const stateKey = `${organizationId}:${conversationId}`;
    let conversationState = conversationStates.get(stateKey);

    if (!conversationState) {
      console.log("[CarlaAgent] Creating new conversation state");

      // NEW: Load conversation history from MongoDB via interworky-core
      let initialHistory = [];
      try {
        console.log(
          "[CarlaAgent] Loading conversation history from MongoDB...",
        );
        const response = await axios.get(
          `${process.env.NODE_PUBLIC_API_URL}/api/conversation/carla/${conversationId}/messages`,
          {
            headers: {
              Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
            },
          },
        );

        if (response.data.success && response.data.messages) {
          // Convert MongoDB messages to our format
          initialHistory = response.data.messages.map((msg) => ({
            role: msg.role,
            content: msg.content,
            timestamp: new Date(msg.timestamp),
          }));
          console.log(
            "[CarlaAgent] ✓ Loaded",
            initialHistory.length,
            "messages from MongoDB",
          );
        }
      } catch (error) {
        console.error(
          "[CarlaAgent] Failed to load conversation history:",
          error.message,
        );
        // Continue with empty history if load fails
      }

      conversationState = {
        history: initialHistory,
        conversationId,
        organizationId,
        email,
        createdAt: new Date(),
        lastActivity: new Date(),
      };
      conversationStates.set(stateKey, conversationState);
    } else {
      console.log(
        "[CarlaAgent] Using existing conversation state with",
        conversationState.history.length,
        "messages",
      );
      conversationState.lastActivity = new Date();
    }

    // Create the Carla agent with all tools
    const carlaAgent = createCarlaAgent(organizationId, mcpServers);
    const runner = new Runner();

    // Construct context-aware prompt with user metadata (only on first message)
    const userContext =
      conversationState.history.length === 0
        ? `
User Context:
- Email: ${email}
- Name: ${name}
- Origin: ${clientMetadata.origin || "unknown website"}
- Timezone: ${clientMetadata.timeZone || "UTC"}
- Today: ${clientMetadata.todayDate || new Date().toLocaleDateString()}
- Time: ${new Date().toLocaleTimeString("en-US", { timeZone: clientMetadata.timeZone || "UTC" })}
- Device: ${clientMetadata.deviceType || "desktop"}
- Language: ${clientMetadata.language || "en-US"}

`
        : "";

    // Build conversation history for context
    const conversationHistory = conversationState.history
      .map(
        (msg) =>
          `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`,
      )
      .join("\n");

    const fullPrompt = conversationHistory
      ? `${conversationHistory}

User: ${messageContent}
${userContext}Please respond to the user's latest message, maintaining context from the conversation history above.`
      : `${messageContent}
${userContext}`;

    console.log("[CarlaAgent] Running agent with streaming...");
    console.log(
      "[CarlaAgent] Conversation history messages:",
      conversationState.history.length,
    );

    // Send initial acknowledgment
    ws.send(
      JSON.stringify({
        type: "started",
        message: "Processing your request...",
      }),
    );

    let fullResponse = "";
    let currentToolCall = null;

    // Run agent with streaming (correct method signature)
    const stream = await runner.run(carlaAgent, fullPrompt, { stream: true });

    for await (const chunk of stream) {
      try {
        // Log chunk for debugging
        console.log(
          "[CarlaAgent] Chunk type:",
          chunk.type,
          "| Name:",
          chunk.name || "N/A",
        );

        // Handle different chunk types from the stream
        if (chunk.type === "text_delta" && chunk.textDelta) {
          // Stream text chunks to the client (legacy format)
          fullResponse += chunk.textDelta;
          ws.send(
            JSON.stringify({
              type: "text_delta",
              content: chunk.textDelta,
            }),
          );
        } else if (chunk.type === "run_item_stream_event") {
          // Handle OpenAI Agents SDK format
          if (
            chunk.name === "message_output_created" &&
            chunk.item?.rawItem?.content
          ) {
            // Extract text from the message content
            const content = chunk.item.rawItem.content;
            for (const contentItem of content) {
              if (contentItem.type === "output_text" && contentItem.text) {
                fullResponse += contentItem.text;
                console.log(
                  "[CarlaAgent] Text extracted:",
                  contentItem.text.substring(0, 100) + "...",
                );

                // Stream the complete text as a delta
                ws.send(
                  JSON.stringify({
                    type: "text_delta",
                    content: contentItem.text,
                  }),
                );
              }
            }
          }
        } else if (chunk.type === "tool_call_started") {
          // Tool execution started
          currentToolCall = chunk.toolName;
          console.log(`[CarlaAgent] Tool started: ${chunk.toolName}`);
          ws.send(
            JSON.stringify({
              type: "tool_call_started",
              tool: chunk.toolName,
              message: `Executing ${chunk.toolName}...`,
            }),
          );
        } else if (chunk.type === "tool_call_completed") {
          // Tool execution completed
          console.log(`[CarlaAgent] Tool completed: ${chunk.toolName}`);
          ws.send(
            JSON.stringify({
              type: "tool_call_completed",
              tool: chunk.toolName,
              message: `Completed ${chunk.toolName}`,
            }),
          );
          currentToolCall = null;
        } else if (chunk.type === "error") {
          // Handle errors
          console.error("[CarlaAgent] Stream error:", chunk.error);
          ws.send(
            JSON.stringify({
              type: "error",
              error: chunk.error || "An error occurred during processing",
            }),
          );
        }
        // Ignore raw_model_stream_event - it's internal SDK events
      } catch (chunkError) {
        console.error("[CarlaAgent] Error processing chunk:", chunkError);
        Sentry.captureException(chunkError);
      }
    }

    // Save conversation to history (in-memory)
    const userTimestamp = new Date();
    const assistantTimestamp = new Date();

    conversationState.history.push({
      role: "user",
      content: messageContent,
      timestamp: userTimestamp,
    });
    conversationState.history.push({
      role: "assistant",
      content: fullResponse,
      timestamp: assistantTimestamp,
    });

    // Limit history to last 20 messages (10 exchanges) to prevent prompt bloat
    if (conversationState.history.length > 20) {
      conversationState.history = conversationState.history.slice(-20);
    }

    // NEW: Persist messages to MongoDB via interworky-core
    try {
      console.log("[CarlaAgent] Persisting messages to MongoDB...");
      console.log("[CarlaAgent] API URL:", process.env.NODE_PUBLIC_API_URL);
      console.log("[CarlaAgent] Conversation ID:", conversationId);
      console.log("[CarlaAgent] Has ACCESS_TOKEN:", !!process.env.ACCESS_TOKEN);

      const apiUrl = `${process.env.NODE_PUBLIC_API_URL}/api/conversation/${conversationId}/messages`;
      console.log("[CarlaAgent] Full API URL:", apiUrl);

      // Save user message
      console.log("[CarlaAgent] Saving user message...");
      const userResponse = await axios.post(
        apiUrl,
        {
          role: "user",
          content: messageContent,
          timestamp: userTimestamp,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
            "Content-Type": "application/json",
          },
        },
      );
      console.log(
        "[CarlaAgent] ✓ User message saved. Status:",
        userResponse.status,
      );

      // Save assistant message
      console.log("[CarlaAgent] Saving assistant message...");
      const assistantResponse = await axios.post(
        apiUrl,
        {
          role: "assistant",
          content: fullResponse,
          timestamp: assistantTimestamp,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
            "Content-Type": "application/json",
          },
        },
      );
      console.log(
        "[CarlaAgent] ✓ Assistant message saved. Status:",
        assistantResponse.status,
      );

      console.log(
        "[CarlaAgent] ✓ Both messages persisted to MongoDB successfully",
      );
    } catch (persistError) {
      console.error(
        "[CarlaAgent] ✗ Failed to persist messages to MongoDB:",
        persistError.message,
      );
      if (persistError.response) {
        console.error(
          "[CarlaAgent] ✗ Response status:",
          persistError.response.status,
        );
        console.error(
          "[CarlaAgent] ✗ Response data:",
          persistError.response.data,
        );
      }
      console.error("[CarlaAgent] ✗ Full error:", persistError);
      // Don't fail the whole request if persistence fails - messages are still in memory
      Sentry.captureException(persistError);
    }

    // Send completion signal
    console.log("[CarlaAgent] ✓ Agent execution completed");
    console.log(
      "[CarlaAgent] Response length:",
      fullResponse.length,
      "characters",
    );
    console.log(
      "[CarlaAgent] Conversation history now has:",
      conversationState.history.length,
      "messages",
    );
    console.log("========== CARLA AGENT EXECUTION FINISHED ==========\n");

    ws.send(
      JSON.stringify({
        type: "complete",
        content: fullResponse || "No response generated",
      }),
    );
  } catch (error) {
    console.error("[CarlaAgent] ✗ Execution failed:", error);
    console.log("========== CARLA AGENT EXECUTION FAILED ==========\n");
    Sentry.captureException(error);

    ws.send(
      JSON.stringify({
        type: "error",
        error: `${error.message || "An unexpected error occurred"}, please contact hello@interworky.com if the issue persists.`,
      }),
    );
  } finally {
    // Cleanup MCP server connections
    for (const server of mcpServers) {
      if (server && typeof server.close === "function") {
        try {
          await server.close();
          console.log("[CarlaAgent] MCP server closed");
        } catch (cleanupError) {
          console.error(
            "[CarlaAgent] Error closing MCP server:",
            cleanupError.message,
          );
        }
      }
    }
  }
}

/**
 * Run Mobile Agent with streaming support via WebSocket
 * Personal productivity assistant for the Interworky mobile app
 * @param {string} organizationId - Organization ID
 * @param {string} conversationId - Conversation ID for state isolation
 * @param {string} messageContent - User message
 * @param {string} email - User email
 * @param {string} name - User name
 * @param {string} userId - User ID for scoping file/task operations
 * @param {WebSocket} ws - WebSocket connection
 * @param {Object} clientMetadata - Client metadata (timezone, device, etc.)
 */
async function runMobileAgent(
  organizationId,
  conversationId,
  messageContent,
  email,
  name,
  userId,
  ws,
  clientMetadata,
) {
  try {
    console.log("\n========== MOBILE AGENT EXECUTION STARTED ==========");
    console.log("[MobileAgent] Organization:", organizationId);
    console.log("[MobileAgent] Conversation:", conversationId);
    console.log("[MobileAgent] User:", email, "(ID:", userId, ")");
    console.log(
      "[MobileAgent] Message:",
      messageContent.substring(0, 100) + "...",
    );

    // Get or create conversation state
    const stateKey = `${organizationId}:${conversationId}`;
    let conversationState = conversationStates.get(stateKey);

    if (!conversationState) {
      console.log("[MobileAgent] Creating new conversation state");

      // Load conversation history from MongoDB via interworky-core
      let initialHistory = [];
      try {
        console.log(
          "[MobileAgent] Loading conversation history from MongoDB...",
        );
        const response = await axios.get(
          `${process.env.NODE_PUBLIC_API_URL}/api/conversation/carla/${conversationId}/messages`,
          {
            headers: {
              Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
            },
          },
        );

        if (response.data.success && response.data.messages) {
          initialHistory = response.data.messages.map((msg) => ({
            role: msg.role,
            content: msg.content,
            timestamp: new Date(msg.timestamp),
          }));
          console.log(
            "[MobileAgent] Loaded",
            initialHistory.length,
            "messages from MongoDB",
          );
        }
      } catch (error) {
        console.error(
          "[MobileAgent] Failed to load conversation history:",
          error.message,
        );
      }

      conversationState = {
        history: initialHistory,
        conversationId,
        organizationId,
        email,
        createdAt: new Date(),
        lastActivity: new Date(),
      };
      conversationStates.set(stateKey, conversationState);
    } else {
      console.log(
        "[MobileAgent] Using existing conversation state with",
        conversationState.history.length,
        "messages",
      );
      conversationState.lastActivity = new Date();
    }

    // Build user context for agent and tools
    const userContext = {
      userId,
      email,
      name,
      timezone: clientMetadata.timeZone || "UTC",
      organizationId,
    };

    // Create the mobile agent with productivity tools
    const mobileAgent = createMobileAgent(organizationId, userContext);
    const runner = new Runner();

    // Construct context-aware prompt with user metadata (only on first message)
    const userContextPrompt =
      conversationState.history.length === 0
        ? `
User Context:
- Email: ${email}
- Name: ${name}
- Timezone: ${clientMetadata.timeZone || "UTC"}
- Today: ${clientMetadata.todayDate || new Date().toLocaleDateString()}
- Time: ${new Date().toLocaleTimeString("en-US", { timeZone: clientMetadata.timeZone || "UTC" })}
- Device: ${clientMetadata.deviceType || "mobile"}

`
        : "";

    // Build conversation history for context
    const conversationHistory = conversationState.history
      .map(
        (msg) =>
          `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`,
      )
      .join("\n");

    const fullPrompt = conversationHistory
      ? `${conversationHistory}

User: ${messageContent}
${userContextPrompt}Please respond to the user's latest message, maintaining context from the conversation history above.`
      : `${messageContent}
${userContextPrompt}`;

    console.log("[MobileAgent] Running agent with streaming...");
    console.log(
      "[MobileAgent] Conversation history messages:",
      conversationState.history.length,
    );

    // Send initial acknowledgment
    ws.send(
      JSON.stringify({
        type: "started",
        message: "Processing your request...",
      }),
    );

    let fullResponse = "";

    // Run agent with streaming
    const stream = await runner.run(mobileAgent, fullPrompt, { stream: true });

    for await (const chunk of stream) {
      try {
        console.log(
          "[MobileAgent] Chunk type:",
          chunk.type,
          "| Name:",
          chunk.name || "N/A",
        );

        if (chunk.type === "text_delta" && chunk.textDelta) {
          fullResponse += chunk.textDelta;
          ws.send(
            JSON.stringify({
              type: "text_delta",
              content: chunk.textDelta,
            }),
          );
        } else if (chunk.type === "run_item_stream_event") {
          if (
            chunk.name === "message_output_created" &&
            chunk.item?.rawItem?.content
          ) {
            const content = chunk.item.rawItem.content;
            for (const contentItem of content) {
              if (contentItem.type === "output_text" && contentItem.text) {
                fullResponse += contentItem.text;
                ws.send(
                  JSON.stringify({
                    type: "text_delta",
                    content: contentItem.text,
                  }),
                );
              }
            }
          }
        } else if (chunk.type === "tool_call_started") {
          console.log(`[MobileAgent] Tool started: ${chunk.toolName}`);
          ws.send(
            JSON.stringify({
              type: "tool_call_started",
              tool: chunk.toolName,
              message: `Executing ${chunk.toolName}...`,
            }),
          );
        } else if (chunk.type === "tool_call_completed") {
          console.log(`[MobileAgent] Tool completed: ${chunk.toolName}`);
          ws.send(
            JSON.stringify({
              type: "tool_call_completed",
              tool: chunk.toolName,
              message: `Completed ${chunk.toolName}`,
            }),
          );
        } else if (chunk.type === "error") {
          console.error("[MobileAgent] Stream error:", chunk.error);
          ws.send(
            JSON.stringify({
              type: "error",
              error: chunk.error || "An error occurred during processing",
            }),
          );
        }
      } catch (chunkError) {
        console.error("[MobileAgent] Error processing chunk:", chunkError);
        Sentry.captureException(chunkError);
      }
    }

    // Save conversation to history (in-memory)
    const userTimestamp = new Date();
    const assistantTimestamp = new Date();

    conversationState.history.push({
      role: "user",
      content: messageContent,
      timestamp: userTimestamp,
    });
    conversationState.history.push({
      role: "assistant",
      content: fullResponse,
      timestamp: assistantTimestamp,
    });

    // Limit history to last 20 messages
    if (conversationState.history.length > 20) {
      conversationState.history = conversationState.history.slice(-20);
    }

    // Persist messages to MongoDB via interworky-core
    try {
      console.log("[MobileAgent] Persisting messages to MongoDB...");
      const apiUrl = `${process.env.NODE_PUBLIC_API_URL}/api/conversation/${conversationId}/messages`;

      await axios.post(
        apiUrl,
        {
          role: "user",
          content: messageContent,
          timestamp: userTimestamp,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
            "Content-Type": "application/json",
          },
        },
      );

      await axios.post(
        apiUrl,
        {
          role: "assistant",
          content: fullResponse,
          timestamp: assistantTimestamp,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
            "Content-Type": "application/json",
          },
        },
      );

      console.log("[MobileAgent] Messages persisted to MongoDB");
    } catch (persistError) {
      console.error(
        "[MobileAgent] Failed to persist messages:",
        persistError.message,
      );
      Sentry.captureException(persistError);
    }

    // Send completion signal
    console.log("[MobileAgent] Agent execution completed");
    console.log("[MobileAgent] Response length:", fullResponse.length);
    console.log("========== MOBILE AGENT EXECUTION FINISHED ==========\n");

    ws.send(
      JSON.stringify({
        type: "complete",
        content: fullResponse || "No response generated",
      }),
    );
  } catch (error) {
    console.error("[MobileAgent] Execution failed:", error);
    console.log("========== MOBILE AGENT EXECUTION FAILED ==========\n");
    Sentry.captureException(error);

    ws.send(
      JSON.stringify({
        type: "error",
        error: `${error.message || "An unexpected error occurred"}, please contact hello@interworky.com if the issue persists.`,
      }),
    );
  }
}

/**
 * Clear conversation state for a specific user/organization
 * Useful when starting a new conversation
 */
function clearConversationState(organizationId, conversationId) {
  const stateKey = `${organizationId}:${conversationId}`;
  if (conversationStates.has(stateKey)) {
    console.log("[CarlaAgent] Clearing conversation state:", stateKey);
    conversationStates.delete(stateKey);
    return true;
  }
  return false;
}

/**
 * Fetch GitHub App installation token for an organization
 * Returns installation token and repository information
 * @param {string} organizationId - Organization ID
 * @returns {Promise<{token: string, repository: object}|null>}
 */
async function fetchGitHubInstallationToken(organizationId) {
  try {
    console.log(
      "[GitHub] Fetching installation token for organization:",
      organizationId,
    );

    const apiUrl = `${process.env.NODE_PUBLIC_API_URL}/api/organization-version-control/${organizationId}/token`;
    console.log("[GitHub] API URL:", apiUrl);

    const response = await axios.get(apiUrl, {
      headers: {
        Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    if (response.data.success && response.data.data) {
      console.log("[GitHub] ✓ Installation token retrieved successfully");
      console.log(
        "[GitHub] Repository:",
        response.data.data.repository.full_name,
      );
      console.log("[GitHub] Token expires:", response.data.data.expires_at);

      return {
        token: response.data.data.token,
        repository: response.data.data.repository,
        permissions: response.data.data.permissions,
        expires_at: response.data.data.expires_at,
      };
    }

    console.log("[GitHub] ✗ No GitHub App installation found for organization");
    return null;
  } catch (error) {
    if (error.response?.status === 404) {
      console.log("[GitHub] ✗ GitHub App not installed for this organization");
    } else {
      console.error(
        "[GitHub] ✗ Failed to fetch installation token:",
        error.message,
      );
      if (error.response) {
        console.error("[GitHub] Response status:", error.response.status);
        console.error("[GitHub] Response data:", error.response.data);
      }
    }
    return null;
  }
}

module.exports = {
  runInterworkyAssistant,
  runInterworkyAssistantLM,
  runCarlaAgent,
  runMobileAgent,
  clearConversationState,
  fetchGitHubInstallationToken,
};
