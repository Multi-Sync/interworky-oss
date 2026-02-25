/**
 * Mobile Tools - Productivity tools for the mobile agent
 * All tools call the interworky-functions REST API
 */

const { tool, webSearchTool } = require("@openai/agents");
const { z } = require("zod");
const axios = require("axios");

const FUNCTIONS_API_URL = process.env.FUNCTIONS_API_URL;

/**
 * Create all mobile tools scoped to a user/organization
 * @param {string} organizationId - Organization ID
 * @param {Object} userContext - User context
 * @param {string} userContext.userId - User ID
 * @param {string} userContext.email - User email
 * @param {string} userContext.name - User display name
 * @param {string} userContext.timezone - User timezone
 * @returns {Array} Array of tool definitions
 */
function createMobileTools(organizationId, userContext) {
  const { userId } = userContext;

  const mobileTools = [
    // ==================== TASK & REMINDER TOOLS ====================
    tool({
      name: "create_reminder",
      description:
        "Schedule a reminder that will send a push notification to the user's phone at the specified time. Use this when the user wants to be reminded about something.",
      parameters: z.object({
        title: z
          .string()
          .describe("Short, clear reminder title (e.g., 'Call dentist', 'Team standup')"),
        description: z
          .string()
          .nullable()
          .describe("Additional details about the reminder"),
        scheduledFor: z
          .string()
          .describe(
            "When to send the reminder in UTC ISO 8601 format (e.g., '2025-01-15T18:00:00.000Z'). Convert from user's timezone to UTC."
          ),
      }),
      execute: async (input) => {
        try {
          const response = await axios.post(`${FUNCTIONS_API_URL}/api/mobile/tasks`, {
            userId,
            organizationId,
            title: input.title,
            description: input.description || null,
            taskType: "reminder",
            scheduledFor: input.scheduledFor,
            parameters: {
              reminderMessage: input.description || input.title,
            },
          });
          return JSON.stringify({
            success: true,
            task: response.data,
            message: `Reminder "${input.title}" scheduled`,
          });
        } catch (error) {
          return JSON.stringify({
            success: false,
            error: error.response?.data?.error || error.message,
          });
        }
      },
    }),

    tool({
      name: "create_task",
      description:
        "Create a task of any type (email, sms, reminder, fileOperation, custom). Use this for general task creation when a more specific tool isn't appropriate.",
      parameters: z.object({
        title: z.string().describe("Task title"),
        description: z.string().nullable().describe("Task description"),
        taskType: z
          .enum(["email", "sms", "reminder", "fileOperation", "custom"])
          .describe("Type of task"),
        scheduledFor: z
          .string()
          .nullable()
          .describe(
            "When to execute the task in UTC ISO 8601 format. Null to run immediately."
          ),
        parameters: z
          .string()
          .nullable()
          .describe("JSON string of additional key-value parameters for the task executor"),
      }),
      execute: async (input) => {
        try {
          let taskParams = {};
          if (input.parameters) {
            try {
              taskParams = JSON.parse(input.parameters);
            } catch {
              taskParams = {};
            }
          }
          const response = await axios.post(`${FUNCTIONS_API_URL}/api/mobile/tasks`, {
            userId,
            organizationId,
            title: input.title,
            description: input.description || null,
            taskType: input.taskType,
            scheduledFor: input.scheduledFor || null,
            parameters: taskParams,
          });
          return JSON.stringify({
            success: true,
            task: response.data,
          });
        } catch (error) {
          return JSON.stringify({
            success: false,
            error: error.response?.data?.error || error.message,
          });
        }
      },
    }),

    tool({
      name: "send_email",
      description:
        "Queue an email to be sent via SendGrid. The email will be sent from the organization's configured sender.",
      parameters: z.object({
        to: z.string().describe("Recipient email address"),
        subject: z.string().describe("Email subject line"),
        body: z.string().describe("Email body content (plain text or HTML)"),
        scheduledFor: z
          .string()
          .nullable()
          .describe("Schedule email for later in UTC ISO 8601 format, or null to send now"),
      }),
      execute: async (input) => {
        try {
          const response = await axios.post(`${FUNCTIONS_API_URL}/api/mobile/tasks`, {
            userId,
            organizationId,
            title: `Email to ${input.to}: ${input.subject}`,
            description: input.body,
            taskType: "email",
            scheduledFor: input.scheduledFor || null,
            parameters: {
              to: input.to,
              subject: input.subject,
              body: input.body,
              fromName: userContext.name,
              fromEmail: userContext.email,
            },
          });
          return JSON.stringify({
            success: true,
            task: response.data,
            message: `Email to ${input.to} queued`,
          });
        } catch (error) {
          return JSON.stringify({
            success: false,
            error: error.response?.data?.error || error.message,
          });
        }
      },
    }),

    // ==================== FILE TOOLS ====================
    tool({
      name: "create_file",
      description:
        "Create or update a text file in the user's storage. Good for saving notes, documents, research, or any text content.",
      parameters: z.object({
        path: z
          .string()
          .describe("File path starting with / (e.g., '/notes/meeting.md', '/documents/todo.txt')"),
        content: z.string().describe("File content (text, markdown, etc.)"),
      }),
      execute: async (input) => {
        try {
          const response = await axios.post(`${FUNCTIONS_API_URL}/api/mobile/files`, {
            userId,
            organizationId,
            path: input.path,
            content: input.content,
          });
          return JSON.stringify({
            success: true,
            file: response.data,
            message: `File created: ${input.path}`,
          });
        } catch (error) {
          return JSON.stringify({
            success: false,
            error: error.response?.data?.error || error.message,
          });
        }
      },
    }),

    tool({
      name: "read_file",
      description: "Read the content of a file from the user's storage.",
      parameters: z.object({
        path: z.string().describe("File path to read (e.g., '/notes/meeting.md')"),
      }),
      execute: async (input) => {
        try {
          const response = await axios.get(`${FUNCTIONS_API_URL}/api/mobile/files/read`, {
            params: { userId, path: input.path },
          });
          return JSON.stringify({
            success: true,
            file: response.data,
          });
        } catch (error) {
          if (error.response?.status === 404) {
            return JSON.stringify({
              success: false,
              error: `File not found: ${input.path}`,
            });
          }
          return JSON.stringify({
            success: false,
            error: error.response?.data?.error || error.message,
          });
        }
      },
    }),

    tool({
      name: "list_files",
      description: "List files and folders in a directory. Defaults to root if no path given.",
      parameters: z.object({
        path: z
          .string()
          .describe("Directory path to list (e.g., '/' for root, '/notes' for notes folder)"),
      }),
      execute: async (input) => {
        try {
          const response = await axios.get(`${FUNCTIONS_API_URL}/api/mobile/files`, {
            params: { userId, path: input.path || "/" },
          });
          return JSON.stringify({
            success: true,
            ...response.data,
          });
        } catch (error) {
          return JSON.stringify({
            success: false,
            error: error.response?.data?.error || error.message,
          });
        }
      },
    }),

    tool({
      name: "delete_file",
      description: "Delete a file or empty folder from the user's storage.",
      parameters: z.object({
        path: z.string().describe("File path to delete"),
      }),
      execute: async (input) => {
        try {
          const response = await axios.delete(`${FUNCTIONS_API_URL}/api/mobile/files`, {
            params: { userId, path: input.path },
          });
          return JSON.stringify({
            success: true,
            message: `Deleted: ${input.path}`,
          });
        } catch (error) {
          return JSON.stringify({
            success: false,
            error: error.response?.data?.error || error.message,
          });
        }
      },
    }),

    // ==================== WEB SEARCH ====================
    webSearchTool(),
  ];

  return mobileTools;
}

module.exports = { createMobileTools };
