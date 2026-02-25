import { marked } from 'marked';
import { createAssistantMessage } from '../../ui/messages/builder';
import {
  createLoadingAnimation,
  hideLoadingAnimation,
} from '../../ui/templates/loadingAnimationText';
import { promptAndSend } from '../../ui/text/promptAndSend';
import { handleFunctionCall } from '../../utils/functionCallHandler';
import { getAssistantSetupMessagesArray } from '../../utils/knowledge-utils';
import { getAssistantInfo, getOrganization } from '../../utils/state';
import {
  getLoadingAnimationIsActive,
  getRealtimeClient as getRealtimeClientText,
  setLoadingAnimationIsActive,
} from '../../utils/text-state';
import { getRealtimeClient as getRealtimeClientVoice } from '../../utils/voice-state';
import { getWebsiteKnowledgeTool } from '../../../utils/tools/getWebsiteKnowledge';
import { saveMessage } from '../../../utils/api/conversationApi';
import { logger } from '../../../utils/logger';
import visitorJourneyAnalytics from '../../../utils/analytics/VisitorJourneyAnalytics';

/**
 * Unified message handler for both text and voice modes
 * @param {Object} data - The message data from InterworkyRTAgent
 * @param {Object} client - The InterworkyRTAgent client
 * @param {string} mode - 'text' or 'voice' mode
 */
export const handleMessage = async (data, client, mode = 'text') => {
  logger.debug('IW024', `Handling message in ${mode} mode`, {
    messageType: data.type,
    data,
  });

  const realtimeClient =
    mode === 'text' ? getRealtimeClientText() : getRealtimeClientVoice();

  switch (data.type) {
    case 'session.created':
      const { turn_detection: turnDetection } = data.session;
      const personality = getAssistantInfo().assistant_personality;
      let chatBotInstructions =
        `\n\n${getAssistantInfo()?.real_time_instructions?.join('\n')}
        You are an Interworky customer assistant created by interworky.com,` +
        `you exists on the user website.Please act ${personality} and answer questions, provide information, and assist with customer inquiries.` +
        `\n\nYou can use the following tools: \n\n` +
        `get_website_knowledge returns the full website knowledge, it can be a lot of information` +
        `\nget_website_sitemap returns the full website sitemap, it can be useful to get the structure of the website` +
        `\nread_page_content reads the page content from the url, it can be useful to get the content of a specific page` +
        `\nget_client_info returns current client information to understand what data is already collected` +
        `\nrequest_appointment allows clients to book appointments with their preferred date and time` +
        `\n\nIMPORTANT: Always check get_client_info first to see what information you already have before asking for it again.` +
        `\n\nPlease LIMIT YOUR ANSWERS TO TWO SENTENCES AND IF YOU CANT ASK CLARIFYING QUESTIONS`;
      const sessionUpdateEvent = {
        type: 'session.update',
        session: {
          type: 'realtime',
          modalities: mode === 'text' ? ['text'] : ['audio'],
          instructions: chatBotInstructions,
          turn_detection: turnDetection,
          tools: [getWebsiteKnowledgeTool],
        },
      };
      client.send(sessionUpdateEvent);
      break;

    case 'session.updated':
      const setupAgentMessagesArray = getAssistantSetupMessagesArray(
        getAssistantInfo().assistant_name,
        getAssistantInfo().assistant_personality,
        getAssistantInfo().assistant_knowledge,
        getOrganization().organization_name,
        getOrganization().organization_website,
        mode,
        window.location.hostname == 'interworky.com'
          ? 'Interworky.com the user is probably testing you'
          : window.location.hostname,
        navigator.userAgent,
        window.location.href,
        navigator.language || 'Unknown',
        new Date().toLocaleTimeString(),
        new Date().toLocaleDateString(),
        Intl.DateTimeFormat().resolvedOptions().timeZone,
        navigator.language || 'en-US'
      );

      for (const message of setupAgentMessagesArray) {
        let conversationItemCreateEvent = {
          type: 'conversation.item.create',
          item: {
            type: 'message',
            role: 'system',
            content: [{ type: 'input_text', text: message }],
          },
        };
        client.send(conversationItemCreateEvent);
      }

      // Only show prompt for text mode
      if (mode === 'text') {
        promptAndSend();
      }
      break;

    case 'conversation.item.created':
      let conversationItemCreatedOutputItem = data.item;
      logger.debug('IW025', 'Conversation item created', {
        item: conversationItemCreatedOutputItem,
      });

      // Save user messages to API
      if (
        conversationItemCreatedOutputItem &&
        conversationItemCreatedOutputItem.type === 'message' &&
        conversationItemCreatedOutputItem.role === 'user'
      ) {
        logger.debug('IW026', 'Saving user message', {
          message: conversationItemCreatedOutputItem,
        });

        // Extract text content from user message
        const userText =
          conversationItemCreatedOutputItem.content?.[0]?.text ||
          conversationItemCreatedOutputItem.content?.[0]?.transcript ||
          '';

        if (userText) {
          // Save user message to API
          try {
            await saveMessage(userText, 'user');
            logger.debug('IW028', 'User message saved to API');
          } catch (error) {
            logger.error('IW029', 'Error saving user message to API', {
              error: error.message,
            });
          }

          // Track chat interaction in analytics
          await visitorJourneyAnalytics.trackChatInteraction();

          logger.debug('IW027', 'User message saved');
        }

        // Trigger response for user messages
        const responseCreateEvent = {
          type: 'response.create',
          response: {
            instructions:
              'Please use conversation context to answer questions and limit answers to one sentence',
            temperature: 1.0,
            tool_choice: 'required',
          },
        };
        await client.send(responseCreateEvent);
        if (!getLoadingAnimationIsActive()) {
          createLoadingAnimation();
          setLoadingAnimationIsActive(true);
        }
      }
      break;

    case 'response.done':
      logger.debug('IW030', 'Response.done received', { data });
      const outputItem = data.response?.output[0];
      if (!outputItem) {
        logger.warn('IW031', 'No output item found in response.done', {
          response: data.response,
        });
        hideLoadingAnimation();
        setLoadingAnimationIsActive(false);
        if (mode === 'text') {
          promptAndSend();
        }
        return;
      }

      logger.debug('IW032', 'Output item details', { outputItem });

      if (
        outputItem.type === 'function_call' &&
        outputItem.name &&
        outputItem.arguments
      ) {
        handleFunctionCall(
          outputItem.name,
          outputItem.call_id,
          outputItem.arguments,
          realtimeClient
        );
      }
      if (
        outputItem &&
        outputItem.type === 'message' &&
        outputItem.role === 'assistant'
      ) {
        logger.debug('IW033', 'Message content details', {
          content: outputItem.content,
        });
        const transcript =
          outputItem.content[0]?.transcript ||
          outputItem.content[0]?.text ||
          (outputItem.content[0]?.type === 'text'
            ? outputItem.content[0].text
            : null);

        logger.debug('IW034', 'Extracted transcript', { transcript });

        if (!transcript) {
          logger.warn('IW035', 'No transcript or text found in response', {
            outputItem,
          });
          hideLoadingAnimation();
          setLoadingAnimationIsActive(false);
          if (mode === 'text') {
            promptAndSend();
          }
          return;
        }

        hideLoadingAnimation();
        const rendered = marked.parse(transcript || '');

        // Save assistant message to API
        try {
          await saveMessage(transcript || '', 'assistant');
          logger.debug('IW036', 'Assistant message saved to API');
        } catch (error) {
          logger.error('IW037', 'Error saving assistant message to API', {
            error: error.message,
          });
        }

        createAssistantMessage(
          rendered,
          false,
          true,
          () => {
            if (mode === 'text') {
              promptAndSend();
            }
          },
          false,
          realtimeClient,
          true
        );

        hideLoadingAnimation();
        setLoadingAnimationIsActive(false);
        if (mode === 'text') {
          promptAndSend();
        }
      }
      break;

    case 'conversation.item.retrieved':
      logger.debug('IW038', 'Conversation item retrieved', { data });
      let conversationItemRetrievedOutputItem = data.item;

      // Save retrieved user messages to API
      if (
        conversationItemRetrievedOutputItem &&
        conversationItemRetrievedOutputItem.type === 'message' &&
        conversationItemRetrievedOutputItem.role === 'user'
      ) {
        logger.debug('IW039', 'Saving retrieved user message', {
          message: conversationItemRetrievedOutputItem,
        });

        // Extract text content from retrieved user message
        const userText =
          conversationItemRetrievedOutputItem.content?.[0]?.text ||
          conversationItemRetrievedOutputItem.content?.[0]?.transcript ||
          '';

        if (userText) {
          // Save user message to API
          try {
            await saveMessage(userText, 'user');
            logger.debug('IW040', 'Retrieved user message saved to API');
          } catch (error) {
            logger.error(
              'IW041',
              'Error saving retrieved user message to API',
              { error: error.message }
            );
          }

          logger.debug('IW042', 'Retrieved user message saved');
        }
      }
      break;

    case 'function_call':
      logger.debug('IW043', 'Function call received', { data });
      // Function calls are handled by the existing handleFunctionCall
      break;

    default:
      logger.debug('IW044', `Unhandled message type in ${mode} mode`, {
        messageType: data.type,
      });
      break;
  }
};
