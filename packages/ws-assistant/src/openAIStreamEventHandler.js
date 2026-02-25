const { EventEmitter } = require("events");
const {
  getOrganizationMethodsByOrgId,
} = require("./services/organizationMethodService");
const axios = require("axios");
const { normalizeParams } = require("./parsing-utils");

class EventHandler extends EventEmitter {
  constructor(client, organizationId, voiceEnabled = false) {
    super();
    this.client = client;
    this.organizationId = organizationId;
    this.voiceEnabled = voiceEnabled;
  }

  async onEvent(event) {
    try {
      if (event.event === "thread.run.requires_action") {
        await this.handleRequiresAction(
          event.data,
          event.data.id,
          event.data.thread_id,
          this.organizationId,
        );
      } else if (event.event === "thread.message.completed") {
        await this.handleCompletedMessageEvent(
          event,
          this.ws,
          this.voiceEnabled,
        );
      } else if (event.event === "thread.run.created") {
        this.handleRunCreatedEvent(
          event,
          this.threadId,
          this.clientData,
          this.clientKey,
          this.clients,
        );
      } else if (event.event === "thread.run.failed") {
        this.handleRunFailedEvent(event, this.ws);
      }
    } catch (error) {
      console.error("Error handling event:", error);
    }
  }

  async handleRequiresAction(data, runId, threadId, organizationId) {
    let toolOutputs = [];
    try {
      // Fetch organization methods by organization ID
      const organizationMethods =
        await getOrganizationMethodsByOrgId(organizationId);

      // Map organization methods by their method names for quick lookup
      const methodsMap = organizationMethods.reduce((map, method) => {
        map[method.method_name] = method;
        return map;
      }, {});
      // Process each tool call dynamically
      toolOutputs = await Promise.all(
        data.required_action.submit_tool_outputs.tool_calls.map(
          async (toolCall) => {
            try {
              const method = methodsMap[toolCall.function.name];
              if (!method) {
                console.warn(
                  `No method found for function name: ${toolCall.function.name}`,
                );
                return {
                  tool_call_id: toolCall.id,
                  output: "null",
                };
              }

              // Parse arguments from the tool call
              let args = JSON.parse(toolCall.function.arguments);

              // Transform args object to use field_name as keys when applicable

              if (method.fixed_params) {
                const fixed = normalizeParams(method.fixed_params);
                args = { ...args, ...fixed };
              }

              let endpoint = method.method_endpoint;

              // Replace colon-prefixed placeholders in the endpoint.
              endpoint = endpoint.replace(/:([a-zA-Z0-9_-]+)/g, (match, p1) => {
                const key = `${p1}_INPATH`;
                if (args.hasOwnProperty(key)) {
                  const val = encodeURIComponent(args[key]);
                  delete args[key];
                  return val;
                }
                return match;
              });

              // Append any remaining _INPATH args to the endpoint.
              for (const key in args) {
                if (key.endsWith("_INPATH")) {
                  endpoint += "/" + encodeURIComponent(args[key]);
                  delete args[key];
                }
              }

              // Use IW_TOKEN from args (if provided) as the bearer token; otherwise fallback to method.auth.
              let bearerToken;
              if (args.IW_TOKEN) {
                bearerToken = args.IW_TOKEN;
                delete args.IW_TOKEN;
              } else if (method.auth) {
                bearerToken = method.auth;
              }
              const headers = bearerToken
                ? { Authorization: `Bearer ${bearerToken}` }
                : undefined;

              // Handle the method call based on its HTTP verb
              let response;
              if (method.method_verb === "POST") {
                response = await axios.post(endpoint, args, { headers });
              } else if (method.method_verb === "PUT") {
                response = await axios.put(endpoint, args, { headers });
              } else if (method.method_verb === "GET") {
                // const queryParams = new URLSearchParams(args).toString();
                // const finalEndpoint = queryParams
                //   ? `${endpoint}?${queryParams}`
                //   : endpoint;
                const queryParams = [];
                for (const key in args) {
                  queryParams.push(
                    `${encodeURIComponent(key)}=${encodeURIComponent(args[key])}`,
                  );
                }
                if (queryParams.length > 0) {
                  // Check if the endpoint already contains query parameters.
                  endpoint +=
                    (endpoint.indexOf("?") === -1 ? "?" : "&") +
                    queryParams.join("&");
                }

                response = await axios.get(endpoint, { headers });
              } else if (method.method_verb === "DELETE") {
                response = await axios.delete(endpoint, {
                  data: args,
                  headers,
                });
              } else {
                console.warn(`Unsupported method verb: ${method.method_verb}`);
                response = { data: null };
              }

              // Ensure the output is a string
              const output =
                typeof response?.data === "string"
                  ? response.data
                  : JSON.stringify(response?.data);

              return {
                tool_call_id: toolCall.id,
                output,
              };
            } catch (toolError) {
              console.error(
                `Error processing tool call ${toolCall.id}:`,
                toolError.message,
              );
              // Return the error message along with the tool_call_id so it gets submitted
              return {
                tool_call_id: toolCall.id,
                output: toolError.message || "An error occurred.",
              };
            }
          },
        ),
      );
      // Submit the tool outputs
      await this.submitToolOutputs(toolOutputs, runId, threadId);
    } catch (error) {
      console.error("Error processing required action:", error.message);
      // If a global error occurs, generate fallback outputs for each tool call using cached IDs.
      const fallbackToolOutputs =
        data.required_action.submit_tool_outputs.tool_calls.map((toolCall) => ({
          tool_call_id: toolCall.id,
          output: error.message || "An unknown error occurred.",
        }));
      await this.submitToolOutputs(fallbackToolOutputs, runId, threadId);
    }
  }

  async submitToolOutputs(toolOutputs, runId, threadId) {
    try {
      const stream = this.client.beta.threads.runs.submitToolOutputsStream(
        threadId,
        runId,
        { tool_outputs: toolOutputs },
      );
      for await (const event of stream) {
        this.emit("event", event);
      }
    } catch (error) {
      console.error("Error submitting tool outputs:", error);
    }
  }

  async handleCompletedMessageEvent(event, ws, voiceEnabled) {
    let lastMessage = event.data.content?.[0]?.text?.value;
    ws.send(
      JSON.stringify(
        lastMessage ||
          "We are having issues now, please contact hello@interworky.com if the issue persists",
      ),
    );
  }

  handleRunFailedEvent(event, ws) {
    console.log(
      `Event failed ${JSON.stringify(event)}, event data ${JSON.stringify(event.data)}`,
    );
    ws.send(
      `We are having issues now, please contact hello@interworky.com if the issue persists`,
    );
  }

  handleRunCreatedEvent(event, threadId, clientData, clientKey, clients) {
    clientData.runId = event.data.id;
    clientData.threadId = threadId;
    clients.set(clientKey, clientData);
    console.log(
      `Saved newly created runId ${clientData.runId} to ${clientKey}`,
    );
  }
}

module.exports = EventHandler;

//createAccount ({ firstName, lastName, email, phone, clinicWebsite, timezone }) -> {organizationId, assistantId} //sends an email for activation
//syncWebsiteKnowledge ({organizationId, assistantId}) -> jobId
//getIntegrationSnippet({organizationId, assistantId}) -> InegrationSnippet

//getAssistantId ({organizationId})
//getOrganization ({organizationId})
//getJobStatus ({jobId})

//login
// end point {{baseUrl}}/api/login
// args {email, password}
// returns
// {"user":{"_id":"67a7e5fbe8c79df11a1d2f8a","id":"73b01743-aed1-4faa-ac58-7b64291db268","email":"ahmed+2hu@interworky.com","password":"$2a$10$AiEzfRxTPDai2faUlgfoaevTQs6CCd03785gzqqzL.qaAsUdqG5fG","status":"active","first_name":"Ahmed","last_name":"Schrute","phone":"+15467189222","timezone":"America/Chicago","resendAttempts":0,"created_at":"2025-02-08T23:17:15.655Z","updated_at":"2025-02-09T20:01:23.030Z","__v":0},"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3M2IwMTc0My1hZWQxLTRmYWEtYWM1OC03YjY0MjkxZGIyNjgiLCJpYXQiOjE3MzkxNTQzMzksImV4cCI6MTczOTE5MDMzOX0.zZ4yW8yW7KqhUxRxZeyWzkjwS-k5i_tzX5NgW3WwR2U"}
