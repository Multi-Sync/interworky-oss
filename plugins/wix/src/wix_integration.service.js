const axios = require('axios');
const jwt = require('jsonwebtoken');
const WixIntegration = require('./wix_integration.model');

const WIX_APP_ID = process.env.WIX_APP_ID;
const WIX_APP_SECRET = process.env.WIX_APP_SECRET;
const WIX_PUBLIC_KEY = process.env.WIX_PUBLIC_KEY;

const WIX_OAUTH_URL = 'https://www.wixapis.com/oauth/access';
const WIX_INSTALL_URL = 'https://www.wix.com/installer/install';

/**
 * Generate the Wix app installation URL
 */
function getInstallUrl(token, redirectUrl, state = '') {
  const params = new URLSearchParams({
    token,
    appId: WIX_APP_ID,
    redirectUrl,
    ...(state && { state }),
  });
  return `${WIX_INSTALL_URL}?${params.toString()}`;
}

/**
 * Exchange authorization code for access and refresh tokens
 */
async function exchangeCodeForTokens(authCode) {
  try {
    const response = await axios.post(WIX_OAUTH_URL, {
      grant_type: 'authorization_code',
      client_id: WIX_APP_ID,
      client_secret: WIX_APP_SECRET,
      code: authCode,
    });

    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      expiresIn: response.data.expires_in,
    };
  } catch (error) {
    console.error('Error exchanging code for tokens:', error.response?.data || error.message);
    throw new Error('Failed to exchange authorization code');
  }
}

/**
 * Refresh access token using refresh token
 */
async function refreshAccessToken(refreshToken) {
  try {
    const response = await axios.post(WIX_OAUTH_URL, {
      grant_type: 'refresh_token',
      client_id: WIX_APP_ID,
      client_secret: WIX_APP_SECRET,
      refresh_token: refreshToken,
    });

    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token || refreshToken,
      expiresIn: response.data.expires_in,
    };
  } catch (error) {
    console.error('Error refreshing access token:', error.response?.data || error.message);
    throw new Error('Failed to refresh access token');
  }
}

/**
 * Get valid access token for an organization (refreshes if expired)
 */
async function getAccessToken(organizationId) {
  const integration = await WixIntegration.findOne({
    organization_id: organizationId,
    status: 'active',
  });

  if (!integration) {
    throw new Error('Wix integration not found for organization');
  }

  // Check if token is still valid (with 5 min buffer)
  const now = new Date();
  const bufferTime = 5 * 60 * 1000; // 5 minutes
  if (integration.access_token && integration.access_token_expires_at > new Date(now.getTime() + bufferTime)) {
    return integration.access_token;
  }

  // Refresh the token
  const tokens = await refreshAccessToken(integration.refresh_token);

  // Update stored tokens
  await WixIntegration.findOneAndUpdate(
    { id: integration.id },
    {
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      access_token_expires_at: new Date(Date.now() + tokens.expiresIn * 1000),
    },
  );

  return tokens.accessToken;
}

/**
 * Verify Wix webhook signature
 */
function verifyWebhookSignature(body, signature) {
  try {
    const decoded = jwt.verify(signature, WIX_PUBLIC_KEY, {
      algorithms: ['RS256'],
    });
    return decoded;
  } catch (error) {
    console.error('Webhook signature verification failed:', error.message);
    return null;
  }
}

/**
 * Decode Wix instance token (from install flow)
 */
function decodeInstanceToken(token) {
  try {
    // Wix instance tokens are base64 encoded JSON
    const decoded = Buffer.from(token, 'base64').toString('utf8');
    return JSON.parse(decoded);
  } catch (error) {
    console.error('Error decoding instance token:', error.message);
    return null;
  }
}

/**
 * Create or update Wix integration for an organization
 */
async function createOrUpdateIntegration(data) {
  const existing = await WixIntegration.findOne({
    wix_instance_id: data.wix_instance_id,
  });

  if (existing) {
    return WixIntegration.findOneAndUpdate(
      { wix_instance_id: data.wix_instance_id },
      data,
      { new: true },
    );
  }

  return WixIntegration.create(data);
}

/**
 * Get integration by organization ID
 */
async function getIntegrationByOrganizationId(organizationId) {
  return WixIntegration.findOne({
    organization_id: organizationId,
    status: 'active',
  });
}

/**
 * Get integration by Wix site ID
 */
async function getIntegrationBySiteId(siteId) {
  return WixIntegration.findOne({
    wix_site_id: siteId,
    status: 'active',
  });
}

/**
 * Revoke integration
 */
async function revokeIntegration(instanceId) {
  return WixIntegration.findOneAndUpdate(
    { wix_instance_id: instanceId },
    { status: 'revoked' },
    { new: true },
  );
}

// =============================================================================
// Wix Restaurants API Methods
// =============================================================================

const WIX_API_BASE = 'https://www.wixapis.com';

/**
 * Make authenticated request to Wix API
 */
async function wixApiRequest(organizationId, method, endpoint, data = null) {
  const accessToken = await getAccessToken(organizationId);
  const integration = await getIntegrationByOrganizationId(organizationId);

  const config = {
    method,
    url: `${WIX_API_BASE}${endpoint}`,
    headers: {
      Authorization: accessToken,
      'wix-site-id': integration.wix_site_id,
      'Content-Type': 'application/json',
    },
  };

  if (data && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
    config.data = data;
  }

  try {
    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error('Wix API request failed:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Get available reservation time slots
 */
async function getReservationTimeSlots(organizationId, date, partySize) {
  return wixApiRequest(
    organizationId,
    'POST',
    '/table-reservations/v1/time-slots/query',
    {
      query: {
        filter: {
          date: date, // Format: "2024-01-15"
          partySize: partySize,
        },
      },
    },
  );
}

/**
 * Create a reservation
 */
async function createReservation(organizationId, reservationData) {
  return wixApiRequest(
    organizationId,
    'POST',
    '/table-reservations/v1/reservations',
    {
      reservation: {
        details: {
          partySize: reservationData.partySize,
          startDate: reservationData.startDate, // ISO 8601 format
        },
        reservee: {
          firstName: reservationData.firstName,
          lastName: reservationData.lastName,
          email: reservationData.email,
          phone: reservationData.phone,
        },
      },
    },
  );
}

/**
 * Get restaurant orders
 */
async function getOrders(organizationId, status = null) {
  const filter = status ? { status } : {};
  return wixApiRequest(
    organizationId,
    'POST',
    '/restaurants/v3/orders/query',
    {
      query: { filter },
    },
  );
}

/**
 * Accept an order
 */
async function acceptOrder(organizationId, orderId) {
  return wixApiRequest(
    organizationId,
    'POST',
    `/restaurants/v3/orders/${orderId}/accept`,
    {},
  );
}

/**
 * Fulfill an order
 */
async function fulfillOrder(organizationId, orderId) {
  return wixApiRequest(
    organizationId,
    'POST',
    `/restaurants/v3/orders/${orderId}/fulfill`,
    {},
  );
}

/**
 * Cancel an order
 */
async function cancelOrder(organizationId, orderId) {
  return wixApiRequest(
    organizationId,
    'POST',
    `/restaurants/v3/orders/${orderId}/cancel`,
    {},
  );
}

module.exports = {
  // OAuth
  getInstallUrl,
  exchangeCodeForTokens,
  refreshAccessToken,
  getAccessToken,
  verifyWebhookSignature,
  decodeInstanceToken,

  // Integration CRUD
  createOrUpdateIntegration,
  getIntegrationByOrganizationId,
  getIntegrationBySiteId,
  revokeIntegration,

  // Wix Restaurants API
  wixApiRequest,
  getReservationTimeSlots,
  createReservation,
  getOrders,
  acceptOrder,
  fulfillOrder,
  cancelOrder,
};
