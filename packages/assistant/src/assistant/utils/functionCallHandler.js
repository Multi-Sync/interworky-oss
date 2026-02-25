import {
  getSiteKnowledge,
  getSitemapUrl,
  readPageContent,
} from './knowledge-utils';
import {
  getOrganization,
  getPatient,
  setPatient,
  getPatientId,
  getOrgMethods,
} from './state';
import { updatePatientInfo } from '../../utils/api/clientApi';
import { createAppointmentOnServer } from '../../utils/api/appointmentApi';
import { updateConversationEmail } from '../../utils/api/conversationApi';
import { sendPatientEmailSystemMessage } from '../../utils/sendPatientEmailSystemMessage';
import {
  getPatientEmailSentToAgent,
  setPatientEmailSentToAgent,
} from './voice-state';
import logger from '../../utils/logger';
import { executeDynamicTool } from '../../utils/tools/dynamicTools';
import visitorJourneyAnalytics from '../../utils/analytics/VisitorJourneyAnalytics';

export async function handleFunctionCall(name, call_id, args, realtimeClient) {
  // convert args to an object if it's a string
  if (typeof args === 'string') {
    try {
      args = JSON.parse(args);
    } catch (error) {
      console.error('Error parsing function call arguments:', error);
      return;
    }
  }
  switch (name) {
    case 'get_website_knowledge':
      // Handle the function call for getting website knowledge
      try {
        const organization = getOrganization();
        const organizationId = organization.id;
        const organizationWebsite = organization.organization_website;
        const knowledge = await getSiteKnowledge(
          organizationId,
          organizationWebsite
        );
        if (knowledge) {
          sendFunctionResponse(realtimeClient, call_id, knowledge);
        } else {
          sendFunctionResponse(
            realtimeClient,
            call_id,
            'Unable to retrieve website knowledge at this time.'
          );
        }
      } catch (error) {
        logger.error('IW057', 'Error getting website knowledge:', { error });
        sendFunctionResponse(
          realtimeClient,
          call_id,
          'Error retrieving website knowledge.'
        );
      }
      break;
    case 'get_website_sitemap':
      // Handle the function call for getting sitemap
      try {
        const sitemapUrl = await getSitemapUrl();
        if (sitemapUrl) {
          sendFunctionResponse(realtimeClient, call_id, sitemapUrl);
        } else {
          sendFunctionResponse(
            realtimeClient,
            call_id,
            'Unable to retrieve sitemap at this time.'
          );
        }
      } catch (error) {
        logger.error('IW058', 'Error getting sitemap:', { error });
        sendFunctionResponse(
          realtimeClient,
          call_id,
          'Error retrieving sitemap.'
        );
      }
      break;
    case 'read_page_content':
      // Handle the function call for reading page content
      try {
        const url = args.url;
        if (!url) {
          logger.warn('IW059', 'No URL provided for read_page_content');
          sendFunctionResponse(
            realtimeClient,
            call_id,
            'No URL provided for reading page content.'
          );
          return;
        }
        const pageContent = await readPageContent(url);
        if (pageContent) {
          sendFunctionResponse(realtimeClient, call_id, pageContent);
        } else {
          sendFunctionResponse(
            realtimeClient,
            call_id,
            'Unable to read page content at this time.'
          );
        }
      } catch (error) {
        logger.error('IW060', 'Error reading page content:', { error });
        sendFunctionResponse(
          realtimeClient,
          call_id,
          'Error reading page content.'
        );
      }
      break;
    case 'capture_email':
      // Handle the function call for capturing user email
      try {
        const email = args.email;
        if (!email) {
          logger.warn(
            'IW045',
            'No email provided for capture_email function call'
          );
          sendFunctionResponse(
            realtimeClient,
            call_id,
            'Email address is required.'
          );
          return;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          logger.warn('IW046', 'Invalid email format provided', { email });
          sendFunctionResponse(
            realtimeClient,
            call_id,
            'Invalid email format. Please provide a valid email address.'
          );
          return;
        }

        // Update patient with email
        await updatePatientInfo({ email: email.toLowerCase().trim() });
        await updateConversationEmail(email.toLowerCase().trim());

        // Update localStorage patient record to prevent duplicate email requests
        const currentPatient = getPatient();
        if (currentPatient) {
          await setPatient({
            ...currentPatient,
            email: email.toLowerCase().trim(),
          });
        }

        // Track email capture as conversion event
        await visitorJourneyAnalytics.trackConversionEvent('email_captured');

        logger.info('IW047', 'Email captured successfully via voice tool', {
          email,
        });

        // Send patient email as system message to agent (only once)
        if (!getPatientEmailSentToAgent()) {
          sendPatientEmailSystemMessage(realtimeClient, email);
          setPatientEmailSentToAgent(true);
        }

        sendFunctionResponse(
          realtimeClient,
          call_id,
          `Thank you! I've successfully captured your email address: ${email}. I can now help you better and reconnect if needed.`
        );
      } catch (error) {
        logger.error('IW048', 'Error capturing email via voice tool:', {
          error,
        });
        sendFunctionResponse(
          realtimeClient,
          call_id,
          'I apologize, but there was an error saving your email. Please try again later.'
        );
      }
      break;
    case 'get_client_info':
      return handleGetClientInfo(call_id, realtimeClient);
    case 'request_appointment':
      return handleAppointmentRequest(args, call_id, realtimeClient);
    default:
      // Check if this is a dynamic tool from organization_methods
      return await handleDynamicToolCall(name, call_id, args, realtimeClient);
  }
}

/**
 * Handles dynamic tool calls from organization_methods
 */
async function handleDynamicToolCall(name, call_id, args, realtimeClient) {
  try {
    const orgMethods = getOrgMethods();
    if (!orgMethods || !Array.isArray(orgMethods)) {
      logger.warn(
        'IW052',
        'No organization methods available for dynamic tool call',
        { toolName: name }
      );
      sendFunctionResponse(
        realtimeClient,
        call_id,
        JSON.stringify({
          error: true,
          message: 'Tool not found',
        })
      );
      return;
    }

    // Find the matching method
    const method = orgMethods.find((m) => m.method_name === name);
    if (!method) {
      logger.warn('IW053', 'Dynamic tool not found in organization methods', {
        toolName: name,
      });
      sendFunctionResponse(
        realtimeClient,
        call_id,
        JSON.stringify({
          error: true,
          message: `Tool ${name} not found`,
        })
      );
      return;
    }

    logger.info('IW054', 'Executing dynamic tool', {
      toolName: name,
      capabilityType: method.capability_type,
      method: method.method_verb,
      endpoint: method.method_endpoint,
      receivedArgs: args,
      expectedParams: method.dynamic_params?.map((p) => p.field_name),
    });
    // Execute the dynamic tool
    const result = await executeDynamicTool(method, args);

    logger.debug('IW055', 'Dynamic tool execution complete', {
      toolName: name,
      resultLength: result.length,
    });

    // Send result back to assistant
    sendFunctionResponse(realtimeClient, call_id, result);
  } catch (error) {
    logger.error('IW056', 'Error executing dynamic tool', {
      toolName: name,
      error: error.message,
    });
    sendFunctionResponse(
      realtimeClient,
      call_id,
      JSON.stringify({
        error: true,
        message: error.message || 'Tool execution failed',
      })
    );
  }
}

/**
 * Handles get_client_info function calls
 * Returns current client information to help agent understand what data is already collected
 */
async function handleGetClientInfo(call_id, realtimeClient) {
  try {
    const client = getPatient();
    const clientInfo = {
      has_email: !!client?.email,
      has_phone: !!client?.phone,
      has_first_name: !!client?.first_name,
      has_last_name: !!client?.last_name,
      client_id: client?.id,
      timezone: client?.timezone,
      // Include actual values if they exist for better context
      ...(client?.email && { email: client.email }),
      ...(client?.phone && { phone: client.phone }),
      ...(client?.first_name && { first_name: client.first_name }),
      ...(client?.last_name && { last_name: client.last_name }),
    };

    // Add context about what information is still needed
    const missingInfo = [];
    if (!client?.email) missingInfo.push('email');
    if (!client?.phone) missingInfo.push('phone');
    if (!client?.first_name) missingInfo.push('first_name');
    if (!client?.last_name) missingInfo.push('last_name');

    if (missingInfo.length > 0) {
      clientInfo.missing_info = missingInfo;
      clientInfo.context = `Client is missing: ${missingInfo.join(', ')}. You may need to collect this information.`;
    } else {
      clientInfo.context =
        'Client has all basic information. You can proceed with their request.';
    }

    sendFunctionResponse(realtimeClient, call_id, JSON.stringify(clientInfo));
  } catch (error) {
    logger.error('IW049', 'Error getting client info:', { error });
    sendFunctionResponse(
      realtimeClient,
      call_id,
      'Error retrieving client information'
    );
  }
}

/**
 * Handles request_appointment function calls
 * Creates appointment request and updates client information if needed
 */
async function handleAppointmentRequest(args, call_id, realtimeClient) {
  try {
    const { preferred_date, preferred_time, ...clientData } = args;

    // Validate required fields
    if (!preferred_date || !preferred_time) {
      sendFunctionResponse(
        realtimeClient,
        call_id,
        'Preferred date and time are required for appointment requests'
      );
      return;
    }

    // Update client info if provided
    await updateClientInfoIfNeeded(clientData);

    // Create appointment
    await createAppointment({
      date: new Date(`${preferred_date}T${preferred_time}`).toISOString(),
      patient_id: getPatientId(),
      organization_id: getOrganization().id,
    });

    // Track appointment booking as conversion event
    await visitorJourneyAnalytics.trackConversionEvent('appointment_booked', 1);

    sendFunctionResponse(
      realtimeClient,
      call_id,
      `Appointment requested for ${preferred_date} at ${preferred_time}. You'll receive confirmation shortly.`
    );
  } catch (error) {
    logger.error('IW050', 'Error creating appointment request:', { error });
    sendFunctionResponse(
      realtimeClient,
      call_id,
      'Error processing appointment request. Please try again or contact us directly.'
    );
  }
}

/**
 * Updates client information if new data is provided and not already collected
 */
async function updateClientInfoIfNeeded(clientData) {
  const currentClient = getPatient();
  const updates = {};

  Object.entries(clientData).forEach(([key, value]) => {
    if (value && key.startsWith('client_')) {
      const fieldName = key.replace('client_', '');
      if (!currentClient?.[fieldName]) {
        updates[fieldName] = value;
      }
    }
  });

  if (Object.keys(updates).length > 0) {
    await updatePatientInfo(updates);

    // Track contact information collection as conversion events
    if (updates.phone) {
      await visitorJourneyAnalytics.trackConversionEvent('phone_captured');
    }
    if (updates.first_name || updates.last_name) {
      await visitorJourneyAnalytics.trackConversionEvent('name_captured');
    }
  }
}

/**
 * Creates an appointment with the provided data
 */
async function createAppointment(appointmentData) {
  return await createAppointmentOnServer({
    ...appointmentData,
    status: 'Requested',
  });
}

/**
 * Sends function call response to the realtime client
 */
function sendFunctionResponse(realtimeClient, call_id, output) {
  if (!realtimeClient || !realtimeClient.isConnected()) {
    logger.warn('Realtime client not connected, cannot send function response');
    return;
  }

  logger.debug('IW061', 'Sending function response', { call_id });
  const response = {
    type: 'function_call_output',
    call_id: call_id,
    output: output,
  };

  realtimeClient.send({
    type: 'conversation.item.create',
    item: response,
  });

  setTimeout(() => {
    // Add system message with function output to trigger response
    realtimeClient.send({
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'system',
        content: [
          {
            type: 'input_text',
            text: `The function has been executed and returned the following output: ${output}. Use this data to respond to the user's question.`,
          },
        ],
      },
    });
    realtimeClient.send({
      type: 'response.create',
    });
  }, 4000);

  realtimeClient.send({
    type: 'response.create',
  });
}
