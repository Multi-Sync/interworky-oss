import { fetchAssistantInfo } from '../utils/api/assistantApi';
import { getOrganizationById, getUser } from '../utils/api/organizationApi';
import { getOrgMethodsByOrganizationId } from '../utils/api/organizationMehodsApi';
import {
  registerPluginInstallation,
  startHeartbeatInterval,
} from '../utils/api/pluginStatusApi';
import { decodeApiKey } from '../utils/common';
import { initializeInterworkyAssistant } from './initialize';
import {
  getOrganization,
  getScriptTags,
  setAssistantId,
  setAssistantInfo,
  setLMStudioModelName,
  setLMStudioSystemMessage,
  setLMStudioUrl,
  setOrganization,
  setOrganizationEmail,
  setOrgMethods,
} from './utils/state';
import packageJson from '../../package.json';
import logger from '../utils/logger';
import { ERROR_CODES } from '../utils/errorCodes';
import ARIAEnhancementEngine, { extractDomain } from '../utils/ariaEnhancement';

export const startInterworkyAssistant = async () => {
  const version = packageJson.version;
  if (!getScriptTags() || !getScriptTags().apiKey) {
    logger.error(
      ERROR_CODES.INIT_NO_API_KEY,
      'API key not added during initialization'
    );
    return;
  }

  const { orgId, assistantId, lmStudioUrl, modelName, systemMessage } =
    await decodeApiKey(getScriptTags().apiKey);
  if (assistantId) {
    setAssistantId(assistantId);
  } else if (lmStudioUrl && modelName && systemMessage) {
    setLMStudioModelName(modelName);
    setLMStudioUrl(lmStudioUrl);
    setLMStudioSystemMessage(systemMessage);
  } else {
    logger.error(ERROR_CODES.AUTH_INVALID_API_KEY, 'Invalid API key format');
    return;
  }
  // Fetch Assistant Info
  try {
    const assistantInfo = await fetchAssistantInfo(orgId);
    setAssistantInfo(assistantInfo);
  } catch (error) {
    logger.error(
      ERROR_CODES.AUTH_INVALID_API_KEY,
      'Failed to fetch assistant info - invalid API key',
      {
        error: error.message,
      }
    );
    return;
  }

  // Fetch Organization Info
  try {
    const organizationData = await getOrganizationById(orgId);
    if (organizationData.organization) {
      setOrganization(organizationData.organization);

      // Register plugin installation and start heartbeat
      try {
        await registerPluginInstallation(orgId, version);
        startHeartbeatInterval(orgId);
      } catch (error) {
        logger.error(
          ERROR_CODES.API_PLUGIN_STATUS_FAILED,
          'Error connecting to Interworky, please report to hello@interworky.com',
          { error: error.message, orgId }
        );
      }
    }
  } catch (error) {
    logger.error(
      ERROR_CODES.AUTH_INVALID_API_KEY,
      'Failed to fetch organization - invalid API key',
      {
        error: error.message,
        orgId,
      }
    );
    return;
  }

  // Fetch Organization Methods
  try {
    let orgMethods = await getOrgMethodsByOrganizationId(orgId);
    setOrgMethods(orgMethods);
  } catch (error) {
    logger.error(
      ERROR_CODES.AUTH_INVALID_API_KEY,
      'Failed to fetch organization methods - invalid API key',
      {
        error: error.message,
        orgId,
      }
    );
    return;
  }

  // Fetch Organization Email
  try {
    const userData = await getUser(getOrganization().creator_user_id);
    if (userData) {
      setOrganizationEmail(userData.email);
    }
  } catch (error) {
    logger.error(
      ERROR_CODES.AUTH_INVALID_API_KEY,
      'Failed to fetch user data - invalid API key',
      {
        error: error.message,
        userId: getOrganization().creator_user_id,
      }
    );
    return;
  }

  // Initialize ARIA Enhancement Engine
  // try {
  //   const organization = getOrganization();
  //   if (organization && organization.website) {
  //     const domain = extractDomain(organization.website);
  //     if (domain) {
  //       // const ariaEngine = new ARIAEnhancementEngine(domain);

  //       // Initialize when DOM is ready
  //       if (document.readyState === 'loading') {
  //         document.addEventListener('DOMContentLoaded', () => ariaEngine.init());
  //       } else {
  //         // DOM already loaded
  //         ariaEngine.init();
  //       }

  //       // Store engine instance for cleanup if needed
  //       window.interworkyARIAEngine = ariaEngine;

  //       logger.info(
  //         'ARIA_ENHANCEMENT_INITIALIZED',
  //         'ARIA Enhancement Engine initialized',
  //         { domain }
  //       );
  //     }
  //   }
  // } catch (error) {
  //   // Non-blocking error - don't prevent assistant from loading
  //   logger.warn(
  //     'ARIA_ENHANCEMENT_FAILED',
  //     'Failed to initialize ARIA Enhancement Engine',
  //     { error: error.message }
  //   );
  // }

  initializeInterworkyAssistant();
};
