/**
 * Dynamic Tools Utility
 *
 * Converts organization_methods from the database into OpenAI Realtime API tool format
 */

import logger from '../logger';

/**
 * Converts an organization_method to OpenAI tool format
 * @param {Object} method - Organization method from database
 * @returns {Object} - OpenAI tool definition
 */
export function convertMethodToTool(method) {
  // Build parameters schema from dynamic_params
  const properties = {};
  const required = [];

  method.dynamic_params.forEach((param) => {
    properties[param.field_name] = {
      type: param.field_type,
      description: param.field_description,
    };

    if (param.field_required) {
      required.push(param.field_name);
    }
  });

  return {
    type: 'function',
    name: method.method_name,
    description: method.method_description,
    parameters: {
      type: 'object',
      properties,
      required,
    },
    strict: true,
  };
}

/**
 * Converts array of organization_methods to OpenAI tools array
 * @param {Array} methods - Array of organization methods
 * @returns {Array} - Array of OpenAI tool definitions
 */
export function convertMethodsToTools(methods) {
  if (!methods || !Array.isArray(methods)) {
    return [];
  }

  return methods
    .filter((method) => method.public !== false) // Only include enabled methods
    .map((method) => convertMethodToTool(method));
}

/**
 * Execute a dynamic tool call by making HTTP request to the endpoint
 * @param {Object} method - Organization method definition
 * @param {Object} args - Tool call arguments
 * @returns {Promise<string>} - Tool execution result
 */
export async function executeDynamicTool(method, args) {
  try {
    const capabilityType = method.capability_type || 'http';

    // Email capabilities are executed via backend
    if (capabilityType === 'email') {
      return await executeViaBackend(method, args);
    }

    // HTTP capabilities execute directly (existing logic)
    return await executeHttpDirectly(method, args);
  } catch (error) {
    logger.debug('IW027', 'Dynamic tool execution error', {
      error: error.message,
    });
    return JSON.stringify({
      error: true,
      message: error.message || 'Tool execution failed',
    });
  }
}

/**
 * Execute email capability via backend API
 * @param {Object} method - Organization method definition
 * @param {Object} args - Tool call arguments
 * @returns {Promise<string>} - Tool execution result
 */
async function executeViaBackend(method, args) {
  try {
    const baseUrl = process.env.NODE_PUBLIC_API_URL || '';
    const url = `${baseUrl}/api/organization-methods/execute`;

    // Merge fixed params with provided args
    const params = { ...args };
    if (method.fixed_params && Array.isArray(method.fixed_params)) {
      method.fixed_params.forEach((param) => {
        params[param.field_name] = param.field_value;
      });
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        method_id: method.id,
        params: params,
      }),
    });

    if (!response.ok) {
      throw new Error(`Backend execution failed: HTTP ${response.status}`);
    }

    const result = await response.json();
    return JSON.stringify(result);
  } catch (error) {
    logger.debug('IW027', 'Backend execution error', {
      error: error.message,
    });
    logger.error(
      'IW_DYNAMIC_TOOL_001',
      'Failed to execute email tool via backend',
      {
        error: error.message,
      }
    );
  }
}

/**
 * Execute HTTP capability directly to external endpoint
 * @param {Object} method - Organization method definition
 * @param {Object} args - Tool call arguments
 * @returns {Promise<string>} - Tool execution result
 */
async function executeHttpDirectly(method, args) {
  try {
    const { method_verb, method_endpoint, fixed_params, auth } = method;

    // Build URL with base from environment
    const baseUrl = process.env.NODE_PUBLIC_API_URL || '';
    let url = method_endpoint.startsWith('http')
      ? method_endpoint
      : `${baseUrl}${method_endpoint.startsWith('/') ? '' : '/'}${method_endpoint}`;

    // Merge fixed params with provided args
    const params = { ...args };
    if (fixed_params && Array.isArray(fixed_params)) {
      fixed_params.forEach((param) => {
        params[param.field_name] = param.field_value;
      });
    }

    // Build headers
    const headers = {
      'Content-Type': 'application/json',
    };

    // Add authentication if required
    if (auth) {
      if (auth === 'bearer' && process.env.ACCESS_TOKEN) {
        headers['Authorization'] = `Bearer ${process.env.ACCESS_TOKEN}`;
      }
    }

    // Make the request
    const fetchOptions = {
      method: method_verb,
      headers,
    };

    // Add body for POST/PUT/PATCH requests
    if (['POST', 'PUT', 'PATCH'].includes(method_verb)) {
      fetchOptions.body = JSON.stringify(params);
    } else if (method_verb === 'GET' && Object.keys(params).length > 0) {
      // Add query parameters for GET requests
      const queryString = new URLSearchParams(params).toString();
      url += `?${queryString}`;
    }

    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    // Return stringified result for function call output
    return JSON.stringify(result);
  } catch (error) {
    logger.debug('IW027', 'HTTP execution error', {
      error: error.message,
    });
    logger.error(
      'IW_DYNAMIC_TOOL_002',
      'Failed to execute HTTP tool directly',
      {
        error: error.message,
        stack: error.stack,
      }
    );
  }
}
