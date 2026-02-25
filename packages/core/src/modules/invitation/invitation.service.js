const Invitation = require('./invitation.model');
const Organization = require('../organization/organization.model');
const User = require('../user/user.model');
const { getEmailProvider, getSMSProvider } = require('@interworky/providers');
const pushService = require('../device_token/push_notification.service');

const LOG_PREFIX = '[InvitationService]';
const APP_URL = process.env.APP_URL || 'https://api.interworky.com';

async function createInvitation(organizationId, userId, { email, phone, channel, role }) {
  const invitation = await Invitation.create({
    organization_id: organizationId,
    invited_by_user_id: userId,
    invitee_email: email,
    invitee_phone: phone,
    channel: channel || (email ? 'email' : phone ? 'sms' : 'link'),
    role: role || 'member',
  });

  invitation.invite_link = `interworky://invite/${invitation.invite_code}`;
  await invitation.save();

  // Send via appropriate channel
  if (channel === 'email' || (email && !channel)) {
    await sendEmailInvitation(invitation, userId);
  } else if (channel === 'sms' && phone) {
    await sendSMSInvitation(invitation, userId);
  }

  console.log(`${LOG_PREFIX} Created invitation ${invitation.invite_code} for org ${organizationId}`);
  return invitation;
}

async function createBulkInvitations(organizationId, userId, invitees) {
  const results = [];
  for (const invitee of invitees) {
    try {
      const invitation = await createInvitation(organizationId, userId, invitee);
      results.push({ success: true, invitation });
    } catch (error) {
      results.push({ success: false, error: error.message, invitee });
    }
  }
  return results;
}

async function sendEmailInvitation(invitation, inviterUserId) {
  const inviter = await User.findOne({ id: inviterUserId });
  const org = await Organization.findOne({ id: invitation.organization_id });

  const inviterName = inviter ? `${inviter.first_name || ''} ${inviter.last_name || ''}`.trim() : 'Someone';
  const orgName = org ? org.organization_name : 'their team';

  try {
    const emailProvider = getEmailProvider();
    await emailProvider.send(
      invitation.invitee_email,
      `${inviterName} invited you to join ${orgName} on Interworky`,
      `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; padding: 30px;">
          <img src="https://interworky.com/logo.png" alt="Interworky" style="height: 32px; margin-bottom: 24px;" />
          <h2 style="color: #111827;">You've been invited!</h2>
          <p style="color: #4B5563; font-size: 16px;">${inviterName} invited you to join <strong>${orgName}</strong> on Interworky — the AI-powered work hub.</p>
          <a href="interworky://invite/${invitation.invite_code}" style="display: inline-block; background: #058A7C; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 20px 0;">Join Team</a>
          <p style="color: #9CA3AF; font-size: 13px;">This invitation expires in 7 days. Invite code: ${invitation.invite_code}</p>
        </div>
      `,
    );
    console.log(`${LOG_PREFIX} Email invitation sent to ${invitation.invitee_email}`);
  } catch (error) {
    console.error(`${LOG_PREFIX} Email invitation failed:`, error.message);
  }
}

async function sendSMSInvitation(invitation, inviterUserId) {
  const inviter = await User.findOne({ id: inviterUserId });
  const inviterName = inviter ? inviter.first_name || 'Someone' : 'Someone';

  try {
    const smsProvider = getSMSProvider();
    await smsProvider.send(
      invitation.invitee_phone,
      `${inviterName} invited you to join their team on Interworky! Join here: https://interworky.com/invite/${invitation.invite_code}`,
    );
    console.log(`${LOG_PREFIX} SMS invitation sent to ${invitation.invitee_phone}`);
  } catch (error) {
    console.error(`${LOG_PREFIX} SMS invitation failed:`, error.message);
  }
}

async function acceptInvitation(inviteCode, userId) {
  const invitation = await Invitation.findOne({ invite_code: inviteCode, status: 'pending' });
  if (!invitation) throw new Error('Invitation not found or already used');

  if (invitation.expires_at < new Date()) {
    invitation.status = 'expired';
    await invitation.save();
    throw new Error('Invitation has expired');
  }

  // Add user to organization
  await Organization.findOneAndUpdate(
    { id: invitation.organization_id },
    {
      $addToSet: {
        users: { userId, role: invitation.role },
      },
    },
  );

  invitation.status = 'accepted';
  invitation.accepted_by_user_id = userId;
  await invitation.save();

  // Notify the inviter
  try {
    const accepter = await User.findOne({ id: userId });
    const accepterName = accepter ? `${accepter.first_name || ''} ${accepter.last_name || ''}`.trim() : 'Someone';
    const org = await Organization.findOne({ id: invitation.organization_id });
    await pushService.notifyInvitation(
      invitation.invited_by_user_id,
      accepterName,
      org?.organization_name || 'your team',
    );
  } catch (err) {
    console.warn(`${LOG_PREFIX} Failed to notify inviter:`, err.message);
  }

  console.log(`${LOG_PREFIX} Invitation ${inviteCode} accepted by user ${userId}`);
  return invitation;
}

async function listInvitations(organizationId) {
  return Invitation.find({ organization_id: organizationId }).sort({ created_at: -1 });
}

async function cancelInvitation(invitationId) {
  return Invitation.findOneAndUpdate(
    { $or: [{ _id: invitationId }, { id: invitationId }] },
    { status: 'cancelled' },
    { new: true },
  );
}

async function checkInviteCode(code) {
  const invitation = await Invitation.findOne({ invite_code: code });
  if (!invitation) return null;

  const org = await Organization.findOne({ id: invitation.organization_id });

  return {
    valid: invitation.status === 'pending' && invitation.expires_at > new Date(),
    status: invitation.status,
    organizationName: org?.organization_name || '',
    role: invitation.role,
    expiresAt: invitation.expires_at,
  };
}

module.exports = {
  createInvitation,
  createBulkInvitations,
  sendEmailInvitation,
  sendSMSInvitation,
  acceptInvitation,
  listInvitations,
  cancelInvitation,
  checkInviteCode,
};
