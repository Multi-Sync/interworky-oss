// src/utils/api/conversationApi.js
import {
  getConversationId,
  getOrgId,
  getPatient,
  getPatientId,
  generatePatientId,
  setConversationId,
} from '../../assistant/utils/state';
import { sendGetRequest, sendPostRequest, sendPutRequest } from './baseMethods';
import { createPatientOnServer } from './clientApi';
import { sendReport } from './sendReportApi';
import logger from '../logger';

export const createConversation = async (patientId, organizationId) => {
  // get website url from window object
  const websiteUrl = window.location.href;
  const conversationNotificationStr = `Conversation created: ${websiteUrl}`;
  await sendReport(conversationNotificationStr);
  return sendPostRequest('api/conversation', {
    organizationId: organizationId,
    patientId: patientId,
  });
};

/**
 * Saves a message to a conversation.
 *
 * @param {string} message - The content of the message.
 * @param {string} role - The role of the message, either 'assistant' or 'user'.
 * @param {string} conversationId - The ID of the conversation to which the message belongs.
 * @returns {Promise<Object>} The response from the API.
 */
export const saveMessageToConversation = async (
  message,
  role,
  conversationId
) => {
  return sendPostRequest(`api/conversation/${conversationId}/messages`, {
    content: message,
    role, // 'assistant' or 'user'
    timestamp: new Date().toISOString(),
    metadata: {
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      userAgent: navigator.userAgent,
    },
  });
};

/**
 * Saves a message to the conversation.
 *
 * This function ensures a patient ID exists and creates a patient record if needed.
 * If a conversation ID does not exist, it creates a new conversation using the patient ID.
 *
 * @param {string} message - The message to be saved.
 * @param role — The role of the sender, either 'assistant' or 'user'.
 */
export const saveMessage = async (message, role) => {
  // Ensure patient ID exists
  let patientId = getPatientId();
  if (!patientId) {
    patientId = generatePatientId();
  }

  // Create patient record if it doesn't exist
  if (!getPatient()) {
    const patientData = {
      first_name: null,
      last_name: null,
      email: null,
      phone: null,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
    await createPatientOnServer(patientData);
  }

  const orgId = getOrgId();
  if (getPatient() && orgId) {
    try {
      if (!getConversationId()) {
        const conversation = await createConversation(patientId, orgId);
        setConversationId(conversation.id);
      }
      const response = await saveMessageToConversation(
        message,
        role,
        getConversationId()
      );
      return response;
    } catch (error) {
      console.error(`Error saving ${role} message:`, error);
    }
  } else {
    console.error('Error 1001');
  }
};

export const updateConversationEmail = async (patientEmail) => {
  const conversationId = getConversationId();

  if (conversationId) {
    const res = await sendPutRequest(`api/conversation/${conversationId}`, {
      patientEmail: patientEmail,
    });
    return res;
  }
};

/**
 * Updates conversation with patient ID
 * @param {string} patientId - The patient ID to associate with the conversation
 */
export const updateConversationPatientId = async (patientId) => {
  const conversationId = getConversationId();

  if (conversationId) {
    const res = await sendPutRequest(`api/conversation/${conversationId}`, {
      patientId: patientId,
    });
    return res;
  }
};

/**
 * Updates the reaction for a message in the conversation
 * @param {number} reaction - The reaction value (1 for like, 2 for dislike)
 * @param {string} messageId - The ID of the message to update
 * @returns {Promise<Object>} The response from the API
 */
export const updateMessageReaction = async (reaction, messageId) => {
  const conversationId = getConversationId();
  if (!conversationId) return;

  return sendPutRequest(
    `api/conversation/${conversationId}/messages/${messageId}/reaction`,
    {
      reaction: reaction,
    }
  );
};

/**
 * Closes the current conversation and sends email notification
 * This function now uses patientId instead of patientEmail to work with the fixed core API
 * @returns {Promise<Object>} The response from the API
 */
export const closeConversation = async () => {
  const patientEmail = getPatient()?.email;
  const organizationId = getOrgId();
  const conversationId = getConversationId();
  const patientId = getPatientId();

  // Only attempt to close if we have the required parameters
  if (!patientId || !organizationId) {
    logger.warn(
      'IW052',
      'Cannot close conversation: missing required parameters',
      {
        hasPatientId: !!patientId,
        hasOrganizationId: !!organizationId,
      }
    );
    return null;
  }

  try {
    logger.info(
      'IW053',
      'Closing conversation and sending email notification',
      {
        patientEmail,
        organizationId,
        conversationId,
        patientId,
      }
    );

    // Update the conversation with the patient email if available
    if (patientEmail) {
      await updateConversationEmail(patientEmail);
    }

    // First check if there are any open conversations for this patient
    const openConversationsResponse = await sendGetRequest(
      `api/conversation/patient/${patientId}`
    );

    const openConversations = openConversationsResponse.filter(
      (conv) => !conv.isClosed
    );

    if (openConversations.length === 0) {
      logger.info('IW057', 'No open conversations found to close', {
        patientId,
        organizationId,
        totalConversations: openConversationsResponse.length,
      });
      return { message: 'No open conversations to close' };
    }

    // Close the conversation using the fixed core API with patientId
    const response = await sendPostRequest(
      `api/conversation/close/patient/${patientId}/organization/${organizationId}`
    );

    logger.info('IW054', 'Conversation closed and email sent successfully', {
      response,
    });
    return response;
  } catch (error) {
    logger.error('IW055', 'Error closing conversation', {
      error: error.message,
      patientEmail,
      organizationId,
      conversationId,
      patientId,
    });
    // Don't throw the error to avoid breaking the UI cleanup
    return null;
  }
};
