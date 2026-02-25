const express = require('express');
const wixService = require('./wix_integration.service');
const WixIntegration = require('./wix_integration.model');
// These are core dependencies — lazy require to avoid tight coupling
const getOrganizationModel = () => require('mongoose').model('Organization');
const sendSlackMessage = (msg) => {
  try { require('../../../packages/core/src/utils/slackCVP')(msg); } catch { console.log('[Wix Plugin]', msg); }
};

const wixRouter = express.Router();

const APP_URL = process.env.APP_URL || 'https://api.interworky.com';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://interworky.com';

// =============================================================================
// OAuth Flow Endpoints
// =============================================================================

/**
 * App URL - Wix redirects here when user starts installation
 * GET /api/wix/install?token=XXX&instanceId=YYY
 */
wixRouter.get('/install', async (req, res) => {
  try {
    const { token, instanceId, state } = req.query;

    if (!token) {
      return res.status(400).json({ error: 'Missing token parameter' });
    }

    // Store the token temporarily (could use session/cache)
    // Then redirect to Wix consent screen
    const redirectUrl = `${APP_URL}/api/wix/callback`;
    const installUrl = wixService.getInstallUrl(token, redirectUrl, state);

    console.log('[Wix Install] Redirecting to Wix consent screen');
    res.redirect(installUrl);
  } catch (error) {
    console.error('[Wix Install] Error:', error.message);
    res.status(500).json({ error: 'Installation failed' });
  }
});

/**
 * OAuth Callback - Wix redirects here after user grants permissions
 * GET /api/wix/callback?code=XXX&instanceId=YYY&state=ZZZ
 */
wixRouter.get('/callback', async (req, res) => {
  try {
    const { code, instanceId, state } = req.query;

    if (!code) {
      return res.status(400).json({ error: 'Missing authorization code' });
    }

    console.log('[Wix Callback] Exchanging code for tokens...');

    // Exchange authorization code for tokens
    const tokens = await wixService.exchangeCodeForTokens(code);

    // Decode the instance to get site info
    // Note: You may need to call Wix API to get site details
    const siteId = instanceId || 'unknown';

    // For now, create a pending integration
    // The organization_id will be linked later via the frontend
    const integration = await wixService.createOrUpdateIntegration({
      organization_id: state || 'pending', // Use state to pass org ID if available
      wix_site_id: siteId,
      wix_instance_id: instanceId,
      refresh_token: tokens.refreshToken,
      access_token: tokens.accessToken,
      access_token_expires_at: new Date(Date.now() + tokens.expiresIn * 1000),
      status: state ? 'active' : 'pending',
    });

    console.log('[Wix Callback] Integration created:', integration.id);

    // Send Slack notification
    await sendSlackMessage(
      `🔗 New Wix Integration installed\nInstance: ${instanceId}\nStatus: ${integration.status}`,
    );

    // Redirect to frontend success page
    res.redirect(`${FRONTEND_URL}/dashboard/integrations?wix=success&instanceId=${instanceId}`);
  } catch (error) {
    console.error('[Wix Callback] Error:', error.message);
    res.redirect(`${FRONTEND_URL}/dashboard/integrations?wix=error&message=${encodeURIComponent(error.message)}`);
  }
});

/**
 * Link Wix integration to an Interworky organization
 * POST /api/wix/link
 */
wixRouter.post('/link', async (req, res) => {
  try {
    const { instanceId, organizationId } = req.body;

    if (!instanceId || !organizationId) {
      return res.status(400).json({ error: 'Missing instanceId or organizationId' });
    }

    // Verify organization exists
    const org = await getOrganizationModel().findOne({ id: organizationId });
    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    // Update integration
    const integration = await WixIntegration.findOneAndUpdate(
      { wix_instance_id: instanceId },
      {
        organization_id: organizationId,
        status: 'active',
      },
      { new: true },
    );

    if (!integration) {
      return res.status(404).json({ error: 'Wix integration not found' });
    }

    console.log(`[Wix Link] Linked instance ${instanceId} to org ${organizationId}`);

    res.json({
      success: true,
      integration: {
        id: integration.id,
        wix_site_id: integration.wix_site_id,
        status: integration.status,
      },
    });
  } catch (error) {
    console.error('[Wix Link] Error:', error.message);
    res.status(500).json({ error: 'Failed to link integration' });
  }
});

/**
 * Get Wix integration status for an organization
 * GET /api/wix/status/:organizationId
 */
wixRouter.get('/status/:organizationId', async (req, res) => {
  try {
    const { organizationId } = req.params;

    const integration = await wixService.getIntegrationByOrganizationId(organizationId);

    if (!integration) {
      return res.json({ connected: false });
    }

    res.json({
      connected: true,
      status: integration.status,
      wix_site_id: integration.wix_site_id,
      created_at: integration.created_at,
    });
  } catch (error) {
    console.error('[Wix Status] Error:', error.message);
    res.status(500).json({ error: 'Failed to get integration status' });
  }
});

// =============================================================================
// Webhook Endpoints
// =============================================================================

/**
 * Wix Webhook handler - receives events from Wix
 * POST /api/wix/webhook
 */
wixRouter.post('/webhook', express.json(), async (req, res) => {
  try {
    const signature = req.headers['x-wix-signature'];
    const body = req.body;

    // Verify webhook signature if present
    if (signature) {
      const verified = wixService.verifyWebhookSignature(JSON.stringify(body), signature);
      if (!verified) {
        console.warn('[Wix Webhook] Signature verification failed');
        // Continue anyway for now, but log warning
      }
    }

    const { eventType, instanceId, data } = body;

    console.log(`[Wix Webhook] Received event: ${eventType}`);

    // Find the integration
    const integration = await WixIntegration.findOne({ wix_instance_id: instanceId });

    switch (eventType) {
      case 'AppInstalled':
        console.log('[Wix Webhook] App installed');
        await sendSlackMessage(`🎉 Wix App Installed\nInstance: ${instanceId}`);
        break;

      case 'AppRemoved':
        console.log('[Wix Webhook] App removed');
        await wixService.revokeIntegration(instanceId);
        await sendSlackMessage(`❌ Wix App Removed\nInstance: ${instanceId}`);
        break;

      case 'wix.restaurants.v3.new_order':
        await handleNewOrder(integration, data);
        break;

      case 'wix.restaurants.v3.order_accepted':
        await handleOrderAccepted(integration, data);
        break;

      case 'wix.restaurants.v3.order_canceled':
        await handleOrderCanceled(integration, data);
        break;

      case 'wix.restaurants.v3.order_fulfilled':
        await handleOrderFulfilled(integration, data);
        break;

      case 'wix.table_reservations.reservation_created':
        await handleReservationCreated(integration, data);
        break;

      default:
        console.log(`[Wix Webhook] Unhandled event type: ${eventType}`);
    }

    // Wix expects a quick response
    res.json({ received: true });
  } catch (error) {
    console.error('[Wix Webhook] Error:', error.message);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// =============================================================================
// Webhook Event Handlers
// =============================================================================

async function handleNewOrder(integration, data) {
  console.log('[Wix Webhook] New order received:', data?.order?.id);

  if (!integration) {
    console.warn('[Wix Webhook] No integration found for order');
    return;
  }

  const order = data?.order;
  if (!order) return;

  // Format order summary
  const items = order.orderItems?.map((item) => `${item.quantity}x ${item.title}`).join(', ') || 'N/A';
  const total = order.price ? `$${(order.price / 100).toFixed(2)}` : 'N/A';
  const customer = order.contact?.firstName || 'Unknown';
  const phone = order.contact?.phone || 'N/A';
  const type = order.delivery?.type || 'pickup';

  await sendSlackMessage(
    `🍽️ *New Wix Restaurant Order*\n` +
      `Order ID: ${order.id}\n` +
      `Customer: ${customer}\n` +
      `Phone: ${phone}\n` +
      `Type: ${type}\n` +
      `Items: ${items}\n` +
      `Total: ${total}`,
  );

  // TODO: Store order in database for assistant context
  // TODO: Trigger any automations/notifications
}

async function handleOrderAccepted(integration, data) {
  console.log('[Wix Webhook] Order accepted:', data?.order?.id);
  // TODO: Update order status, notify customer
}

async function handleOrderCanceled(integration, data) {
  console.log('[Wix Webhook] Order canceled:', data?.order?.id);
  // TODO: Update order status, notify customer
}

async function handleOrderFulfilled(integration, data) {
  console.log('[Wix Webhook] Order fulfilled:', data?.order?.id);
  // TODO: Update order status, notify customer
}

async function handleReservationCreated(integration, data) {
  console.log('[Wix Webhook] Reservation created:', data?.reservation?.id);

  if (!integration) {
    console.warn('[Wix Webhook] No integration found for reservation');
    return;
  }

  const reservation = data?.reservation;
  if (!reservation) return;

  const name = `${reservation.reservee?.firstName || ''} ${reservation.reservee?.lastName || ''}`.trim();
  const phone = reservation.reservee?.phone || 'N/A';
  const email = reservation.reservee?.email || 'N/A';
  const partySize = reservation.details?.partySize || 'N/A';
  const dateTime = reservation.details?.startDate || 'N/A';

  await sendSlackMessage(
    `📅 *New Wix Reservation*\n` +
      `Name: ${name}\n` +
      `Phone: ${phone}\n` +
      `Email: ${email}\n` +
      `Party Size: ${partySize}\n` +
      `Date/Time: ${dateTime}`,
  );
}

// =============================================================================
// API Endpoints for Assistant Integration
// =============================================================================

/**
 * Check reservation availability (called by assistant)
 * POST /api/wix/reservations/availability
 */
wixRouter.post('/reservations/availability', async (req, res) => {
  try {
    const { organizationId, date, partySize } = req.body;

    if (!organizationId || !date || !partySize) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const slots = await wixService.getReservationTimeSlots(organizationId, date, partySize);
    res.json(slots);
  } catch (error) {
    console.error('[Wix Reservations] Error:', error.message);
    res.status(500).json({ error: 'Failed to get availability' });
  }
});

/**
 * Create reservation (called by assistant)
 * POST /api/wix/reservations/create
 */
wixRouter.post('/reservations/create', async (req, res) => {
  try {
    const { organizationId, ...reservationData } = req.body;

    if (!organizationId) {
      return res.status(400).json({ error: 'Missing organizationId' });
    }

    const reservation = await wixService.createReservation(organizationId, reservationData);
    res.json(reservation);
  } catch (error) {
    console.error('[Wix Reservations] Error:', error.message);
    res.status(500).json({ error: 'Failed to create reservation' });
  }
});

/**
 * Get orders (called by assistant or dashboard)
 * GET /api/wix/orders/:organizationId
 */
wixRouter.get('/orders/:organizationId', async (req, res) => {
  try {
    const { organizationId } = req.params;
    const { status } = req.query;

    const orders = await wixService.getOrders(organizationId, status);
    res.json(orders);
  } catch (error) {
    console.error('[Wix Orders] Error:', error.message);
    res.status(500).json({ error: 'Failed to get orders' });
  }
});

/**
 * Accept order (called by dashboard or automation)
 * POST /api/wix/orders/:orderId/accept
 */
wixRouter.post('/orders/:orderId/accept', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { organizationId } = req.body;

    if (!organizationId) {
      return res.status(400).json({ error: 'Missing organizationId' });
    }

    const result = await wixService.acceptOrder(organizationId, orderId);
    res.json(result);
  } catch (error) {
    console.error('[Wix Orders] Error:', error.message);
    res.status(500).json({ error: 'Failed to accept order' });
  }
});

module.exports = wixRouter;
