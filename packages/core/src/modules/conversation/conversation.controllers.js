const { asyncHandler } = require('../../utils/asyncHandler');
const HttpError = require('../../utils/HttpError');
const { getEmailProvider } = require('@interworky/providers');
const Conversation = require('./conversation.model');
const User = require('../user/user.model');
const Organization = require('../organization/organization.model');
const { getConfig } = require('dotenv-handler');
const assistant_infoModel = require('../assistant_info/assistant_info.model');

const SENDGRID_TEMPLATES = {
  NEW_LEAD_ALERT: getConfig('SENDGRID_TEMPLATE_NEW_LEAD_ALERT'),
  NEW_CONVERSATION: getConfig('SENDGRID_TEMPLATE_NEW_CONVERSATION'),
};

/**
 * Create a new conversation
 */
const createConversation = asyncHandler(async (req, res) => {
  const { organizationId, patientId } = req.body;

  // Validate that patientId is provided
  if (!patientId) {
    throw new HttpError('Patient ID is required').BadRequest();
  }

  const conversation = new Conversation({
    organizationId,
    patientId,
    messages: [],
  });
  await conversation.save();
  return res.status(201).json(conversation);
});
/**
 * Add a message to a conversation
 */
const addMessage = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const { role, content, reaction, metadata, timestamp = new Date() } = req.body;

  const conversation = await Conversation.findOne({ id: conversationId });
  if (!conversation) {
    throw new HttpError('Conversation not found').NotFound();
  }

  if (role == 'assistant') {
    const assistantInfo = await assistant_infoModel.findOne({ organization_id: conversation.organizationId });
    const organization = await Organization.findOne({ id: conversation.organizationId });

    const firstMessage = assistantInfo.first_message;
    const textOrVoiceChoice = 'I can assist to you via text or voice, which one do you prefer?';

    if (content !== firstMessage && content !== textOrVoiceChoice) {
      organization.message_count += 1;
      await organization.save();
    }
  }
  conversation.messages.push({ role, content, reaction, metadata, timestamp });
  await conversation.save();

  return res.status(200).json(conversation);
});

const updateConversation = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const { organizationId, patientId } = req.body;

  const updateData = {};
  if (organizationId) updateData.organizationId = organizationId;
  if (patientId) updateData.patientId = patientId;

  const conversation = await Conversation.findOneAndUpdate({ id: conversationId }, updateData, { new: true });
  if (!conversation) {
    throw new HttpError('Conversation not found').NotFound();
  }
  return res.status(200).json(conversation);
});

/**
 * Get all conversations (customer conversations only, excludes dashboard)
 */
const getConversations = asyncHandler(async (req, res) => {
  const conversations = await Conversation.find({
    dashboardConversation: { $ne: true },
  });
  return res.status(200).json(conversations);
});

/**
 * Get a specific conversation by ID
 */
const getConversationById = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const conversation = await Conversation.findOne({ id: conversationId });
  if (!conversation) {
    return res.status(404).json({ message: 'Conversation not found' });
  }
  return res.status(200).json(conversation);
});

const getConversationsByPatientId = asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  const conversations = await Conversation.find({
    patientId,
    dashboardConversation: { $ne: true },
  });
  return res.status(200).json(conversations);
});

const getConversationsByOrganizationId = asyncHandler(async (req, res) => {
  const { organizationId } = req.params;
  const { skip = 0, limit = 100 } = req.query;
  const query = {
    organizationId,
    dashboardConversation: { $ne: true },
  };
  const [conversations, total] = await Promise.all([
    Conversation.find(query).skip(skip).limit(limit),
    Conversation.countDocuments(query),
  ]);
  return res.status(200).json({ conversations, total });
});

const closeConversation = asyncHandler(async (req, res) => {
  const { patientId, organizationId } = req.params;
  const conversations = await Conversation.find({
    patientId,
    isClosed: false,
    dashboardConversation: { $ne: true },
  });
  if (!conversations.length) {
    throw new HttpError(`No open conversations found for patient ${patientId}`).NotFound();
  }

  // Get patient information to retrieve email
  const { models: { Patient } } = require('@interworky/plugin-patients');
  const patient = await Patient.findOne({ id: patientId });
  if (!patient) {
    throw new HttpError(`Patient not found for ID ${patientId}`).NotFound();
  }

  const organization = await Organization.findOne({ id: organizationId });
  const owner = await User.findOne({ id: organization.creator_user_id });

  // OSS: All features always available
  const isSubscribed = true;

  const regex = /^([a-z]{2})-([\w.-]+)@interworky\.com$/i;

  // Helper function to convert a country code into its corresponding flag emoji.
  function countryToFlag(countryCode) {
    // The Unicode for regional indicator symbols starts at 0x1F1E6 (for 'A')
    return countryCode
      .toUpperCase()
      .split('')
      .map(char => String.fromCodePoint(char.charCodeAt(0) - 65 + 0x1f1e6))
      .join('');
  }

  // Use patient email or fallback to anonymous if no email
  const patientEmail = patient.email || 'anonymous@interworky.com';
  const email = regex.test(patientEmail.toLowerCase().trim())
    ? patientEmail.replace(regex, (match, country) => {
        const flag = countryToFlag(country);
        return `anonymous - ${flag}`;
      })
    : patientEmail;

  // Format the date for email
  const formatDate = date => {
    return new Date(date).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  const mailService = getEmailProvider();
  const assistantInfo = await assistant_infoModel.findOne({ organization_id: organizationId });
  const dashboardUrl = process.env.DASHBOARD_URL || 'https://interworky.com/dashboard';

  // Mark conversations as closed
  for (const conversation of conversations) {
    conversation.isClosed = true;
    conversation.sentToOwner = true;
    await conversation.save();
  }

  // Get the first conversation for email data
  const conversation = conversations[0];
  const conversationId = conversation.id;

  let subjectLine;

  if (isSubscribed) {
    // For subscribed users, use the old approach with direct HTML/text content
    const getRoleEmoji = role => {
      switch (role) {
        case 'assistant':
          return '<div style="height:56px; width:56px; border-radius: 6px; background-color: #000; color: #fff; font-size: 24px; font-weight: 700; text-align: center; line-height: 56px;">AI</div>';
        case 'user':
          return '<div style="height:56px; width:56px; border-radius: 6px; background-color: #E1F1EF; color: #058A7C; font-size: 24px; font-weight: 700; text-align: center; line-height: 56px;">U</div>';
        case 'owner':
          return '👨‍⚕️';
        default:
          return '💬';
      }
    };

    let messagesText = '';
    let messagesHtml = '';
    const thumbsUpLink = `${dashboardUrl}/reactions/${conversationId}/${patientId}/thumbsup`;
    const thumbsDownLink = `${dashboardUrl}/reactions/${conversationId}/${patientId}/thumbsdown`;

    messagesText += `
    📋 Conversation Summary
    =====================
    👤 Client: ${email}
    📝 Total Messages: ${conversation.messages.length}
    🕐 Closed: ${formatDate(new Date())}
    💬 Message History:
    ${conversation.messages
      .map(
        (msg, idx) => `
    #${idx + 1} ${getRoleEmoji(msg.role)} ${msg.role.charAt(0).toUpperCase() + msg.role.slice(1)}
    ⏰ ${formatDate(msg.timestamp)}
    ${msg.content}
    ${msg.reaction ? `${msg.reaction === 1 ? '👍 Liked' : '👎 Disliked'}` : ''}
    `,
      )
      .join('----------------------------------------')}`;

    messagesHtml += `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 700px; margin: 0 auto; background: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); padding: 20px;">
    <h3 style="padding-top:10px; padding-bottom:10px; font-size: 24px; font-weight: 700;">Hi ${owner.first_name}</h3>
    
    <p style="font-size: 20px; color: #000000">
    Great news! Your AI Agent just had a conversation with a website visitor, review the conversation below.
    Please provide your feedback on the conversation to enhance your AI Agent performance.
    This a chance to update your AI Agent custom knowledge base for more accurate responses, and also to learn what your customers are looking for.
    You can update the custom knowledge base at https://interworky.com/dashboard
    </p>


    <div>
    <p style="font-size: 24px;">
    How did your AI ChatBot do?
    </p>

    <div style="margin-top: 40px;">
        <div style="display: inline-block; margin-right: 20px;">
          <a href="${thumbsUpLink}" style="text-decoration: none;">
            <div style="font-size: 20px; margin-bottom: 5px; border: 1px solid #D9D9D9; border-radius: 40px; padding: 10px; padding-left: 40px; padding-right: 40px;">👍</div>
          </a>
        </div>
        <div style="display: inline-block;">
          <a href="${thumbsDownLink}" style="text-decoration: none;">
            <div style="font-size: 20px; margin-bottom: 5px; border: 1px solid #D9D9D9; border-radius: 40px; padding: 10px; padding-left: 40px; padding-right: 40px;">👎</div>
          </a>
        </div>
      </div>
    </div>


    <div>
    <h3 style="margin-bottom: 0px;">Conversation log:</h3>

    <div style="background-color:#F7F7F7; overflow-y:scroll; max-height: 500px;">
         ${conversation.messages
           .map(
             msg => `
            <div style="padding: 15px;
                        border-radius: 4px;
                        margin: 15px 0;
                        box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
              <div style="display: flex; align-items: center; margin-bottom: 10px; color: #586069;">
                <div style="font-size: 20px; margin-right: 8px;">${getRoleEmoji(msg.role)}</div>
                <div>
                <div style="display: flex; align-items: center;">
                <strong>${msg.role === 'assistant' ? 'ChatBot' : msg.role.charAt(0).toUpperCase() + msg.role.slice(1)}</strong>
                <span style="margin: 0 8px;">•</span>
                <span style="font-size: 0.9em;">${formatDate(msg.timestamp)}</span>
                ${
                  msg.reaction
                    ? `
                  <span style="margin-left: auto; font-size: 18px;">
                    ${msg.reaction === 1 ? '👍' : '👎'}
                  </span>
                `
                    : ''
                }
                </div>
                <div style=" color: #24292e; line-height: 1.5;">
                ${msg.content}
              </div>
              </div>
              </div>
            </div>`,
           )
           .join('')}
    </div>
    </div>

    <div style="margin-top: 20px;">
    <p>Regards,<p>
    <small>The Interworky team</small>
    </div>
    </div>
    `;

    subjectLine = `Conversation Summary - Interworky`;

    // Send email using direct HTML/text content
    await mailService.send(owner.email, subjectLine, messagesHtml, {
      from: process.env.SENDGRID_FROM_EMAIL,
      text: messagesText,
    });
  } else {
    // For non-subscribed users, use the SendGrid templates
    let templateId;
    let templateData;

    if (assistantInfo && assistantInfo.contact_info_required) {
      // Free users with contact_info_required get the lead alert
      subjectLine = `New Lead Alert - Interworky`;
      templateId = SENDGRID_TEMPLATES.NEW_LEAD_ALERT;

      templateData = {
        email: email,
        dashboardUrl: dashboardUrl,
        msgsCount: conversation.messages.length,
        conversationTime: formatDate(new Date()),
      };
    } else {
      // Free users without contact_info_required get the conversation notification
      subjectLine = `New Conversation Notification - Interworky`;
      templateId = SENDGRID_TEMPLATES.NEW_CONVERSATION;

      templateData = {
        dashboardUrl: dashboardUrl,
        msgsCount: conversation.messages.length,
        conversationTime: formatDate(new Date()),
      };
    }

    // Send email using SendGrid template
    await mailService.sendTemplate(owner.email, templateId, templateData, {
      from: process.env.SENDGRID_FROM_EMAIL,
      subject: subjectLine,
    });
  }

  return res.status(200).json({ message: 'Conversations closed successfully' });
});

const updateMessageReaction = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const { conversationId } = req.params;
  const { reaction } = req.body;

  const message = await Conversation.findOne({ id: conversationId });
  if (!message) {
    throw new HttpError('Message not found').NotFound();
  }
  const messageToUpdate = message.messages.find(m => m.id.toString() === messageId);
  if (!messageToUpdate) {
    throw new HttpError('Message not found').NotFound();
  }
  messageToUpdate.reaction = reaction;
  await message.save();
  return res.status(200).json(message);
});

// ==================== CARLA DASHBOARD CONVERSATION ====================

/**
 * Get or create dashboard conversation for user
 * Supports loading specific conversation by ID or getting/creating active conversation
 */
const getDashboardConversation = asyncHandler(async (req, res) => {
  const { organizationId, userId, conversationId } = req.body;

  // Validate that userId matches authenticated user from JWT token
  if (req.user && req.user.userId && req.user.userId !== userId) {
    throw new HttpError('User ID mismatch - unauthorized access').Forbidden();
  }

  let conversation;

  // If conversationId provided, load specific conversation
  if (conversationId) {
    conversation = await Conversation.findOne({
      id: conversationId,
      organizationId,
      patientId: userId,
      dashboardConversation: true,
    });

    if (!conversation) {
      throw new HttpError('Conversation not found').NotFound();
    }
  } else {
    // Try to find most recent active dashboard conversation
    conversation = await Conversation.findOne({
      organizationId,
      patientId: userId,
      dashboardConversation: true,
      isClosed: false,
    }).sort({ updatedAt: -1 });

    // If no active conversation, create new one
    if (!conversation) {
      conversation = new Conversation({
        organizationId,
        patientId: userId,
        dashboardConversation: true,
        conversationType: 'dashboard-carla',
        title: 'New Conversation',
        messages: [],
        isClosed: false,
        metadata: {
          messageCount: 0,
        },
      });
      await conversation.save();
    }
  }
  return res.status(200).json(conversation);
});

/**
 * Get all Carla dashboard conversations for a user
 */
const getCarlaConversations = asyncHandler(async (req, res) => {
  const { organizationId, userId } = req.query;
  const { limit = 50, status = 'active' } = req.query;

  // Validate user ownership
  if (req.user && req.user.userId && req.user.userId !== userId) {
    throw new HttpError('Unauthorized access').Forbidden();
  }

  const query = {
    organizationId,
    patientId: userId,
    dashboardConversation: true,
  };

  if (status === 'active') {
    query.isClosed = false;
  } else if (status === 'archived') {
    query.isClosed = true;
  }

  const conversations = await Conversation.find(query)
    .sort({ updatedAt: -1 })
    .limit(parseInt(limit))
    .select('id title metadata createdAt updatedAt messages')
    .lean();

  // Format response with preview and message count
  const formatted = conversations.map(conv => ({
    id: conv.id,
    title: conv.title || 'New Conversation',
    messageCount: conv.messages?.length || 0,
    lastMessageAt: conv.updatedAt,
    preview: conv.metadata?.firstMessage || conv.messages?.[0]?.content?.substring(0, 100) || '',
    createdAt: conv.createdAt,
  }));

  return res.status(200).json({
    conversations: formatted,
    total: formatted.length,
  });
});

/**
 * Create new Carla dashboard conversation
 */
const createCarlaConversation = asyncHandler(async (req, res) => {
  const { organizationId, userId } = req.body;

  // Validate user ownership
  if (req.user && req.user.userId && req.user.userId !== userId) {
    throw new HttpError('Unauthorized access').Forbidden();
  }

  const conversation = new Conversation({
    organizationId,
    patientId: userId,
    dashboardConversation: true,
    conversationType: 'dashboard-carla',
    title: 'New Conversation',
    messages: [],
    isClosed: false,
    metadata: {
      messageCount: 0,
    },
  });

  await conversation.save();

  return res.status(201).json({
    id: conversation.id,
    title: conversation.title,
    messages: [],
    createdAt: conversation.createdAt,
  });
});

/**
 * Update Carla conversation title
 */
const updateCarlaConversationTitle = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const { title } = req.body;

  const conversation = await Conversation.findOne({
    id: conversationId,
    dashboardConversation: true,
  });

  if (!conversation) {
    throw new HttpError('Conversation not found').NotFound();
  }

  // Validate user ownership
  if (req.user && req.user.userId && req.user.userId !== conversation.patientId) {
    throw new HttpError('Access denied').Forbidden();
  }

  conversation.title = title;
  await conversation.save();

  return res.status(200).json({
    id: conversation.id,
    title: conversation.title,
  });
});

/**
 * Archive Carla conversation
 */
const archiveCarlaConversation = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;

  const conversation = await Conversation.findOne({
    id: conversationId,
    dashboardConversation: true,
  });

  if (!conversation) {
    throw new HttpError('Conversation not found').NotFound();
  }

  // Validate user ownership
  if (req.user && req.user.userId && req.user.userId !== conversation.patientId) {
    throw new HttpError('Access denied').Forbidden();
  }

  conversation.isClosed = true;
  await conversation.save();

  return res.status(200).json({
    id: conversation.id,
    archived: true,
  });
});

/**
 * Get Carla conversation messages for WebSocket sync
 */
const getCarlaConversationMessages = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;

  const conversation = await Conversation.findOne({
    id: conversationId,
    dashboardConversation: true,
  }).select('messages patientId');

  if (!conversation) {
    throw new HttpError('Conversation not found').NotFound();
  }

  // Validate user ownership
  if (req.user && req.user.userId && req.user.userId !== conversation.patientId) {
    throw new HttpError('Access denied - this conversation belongs to another user').Forbidden();
  }

  return res.status(200).json({
    success: true,
    messages: conversation.messages || [],
    conversationId,
  });
});

module.exports = {
  createConversation,
  addMessage,
  getConversations,
  getConversationById,
  getConversationsByOrganizationId,
  closeConversation,
  getConversationsByPatientId,
  updateConversation,
  updateMessageReaction,
  getDashboardConversation,
  getCarlaConversations,
  createCarlaConversation,
  updateCarlaConversationTitle,
  archiveCarlaConversation,
  getCarlaConversationMessages,
};
