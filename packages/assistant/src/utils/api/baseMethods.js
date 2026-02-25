import logger from '../logger';

/**
 * Sends a POST request to the given path with the specified body.
 * Adds the Authorization header using the bearer token from environment variables.
 *
 * @param {string} path - The API path to send the request to.
 * @param {object} body - The request payload to send.
 * @returns {Promise<object>} - The response data from the API.
 */
export async function sendPostRequest(
  path,
  body,
  url = '',
  token = '',
  contentType = 'application/json'
) {
  let authToken = process.env.ACCESS_TOKEN;
  if (token && token !== '') {
    authToken = token;
  }
  let requestUrl =
    url === '' ? `${process.env.NODE_PUBLIC_API_URL}/${path}` : url;
  try {
    const response = await fetch(requestUrl, {
      method: 'POST',
      headers: {
        'Content-Type': contentType,
        Authorization: `Bearer ${authToken}`,
      },
      body: contentType == 'application/sdp' ? body : JSON.stringify(body),
    });

    if (response.status === 409) {
      // Handle 409 conflict by returning the response to the caller
      return { status: 409 };
    }

    if (!response.ok) {
      logger.warn('IW_API_001', 'HTTP POST request failed', {
        status: response.status,
        statusText: response.statusText,
        url: requestUrl,
        path,
      });
      return null;
    }

    if (contentType == 'application/sdp') {
      return response.text();
    }
    const responseData = await response.json();
    return responseData;
  } catch (error) {
    logger.warn('IW_API_002', 'POST request error', {
      error: error.message,
      url: requestUrl,
      path,
    });
    return null;
  }
}

/**
 * Sends a GET request to the given path with optional query parameters.
 * Adds the Authorization header using the bearer token from environment variables.
 *
 * @param {string} path - The API path to send the request to.
 * @param {string} url - Optional full URL (overrides path).
 * @param {string} token - Optional custom auth token (overrides ACCESS_TOKEN).
 * @returns {Promise<object>} - The response data from the API.
 */
export async function sendGetRequest(path, url = '', token = '') {
  let authToken = process.env.ACCESS_TOKEN;
  if (token && token !== '') {
    authToken = token;
  }
  let requestUrl =
    url === '' ? `${process.env.NODE_PUBLIC_API_URL}/${path}` : url;

  try {
    const response = await fetch(requestUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (response.status === 404) {
      return { statusCode: 404 };
    }

    if (!response.ok) {
      logger.warn('IW_API_003', 'HTTP GET request failed', {
        status: response.status,
        statusText: response.statusText,
        url: requestUrl,
        path,
      });
      return null;
    }

    const responseData = await response.json();
    return responseData;
  } catch (error) {
    logger.warn('IW_API_004', 'GET request error', {
      error: error.message,
      url: requestUrl,
      path,
    });
    return null;
  }
}

export async function sendPutRequest(path, body) {
  const url = `${process.env.NODE_PUBLIC_API_URL}/${path}`;
  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
      },
      body: JSON.stringify(body),
    });

    if (response.status === 404) {
      return { statusCode: 404 };
    }

    if (!response.ok) {
      logger.warn('IW_API_005', 'HTTP PUT request failed', {
        status: response.status,
        statusText: response.statusText,
        url,
        path,
      });
      return null;
    }

    const responseData = await response.json();
    return responseData;
  } catch (error) {
    logger.warn('IW_API_006', 'PUT request error', {
      error: error.message,
      url,
      path,
    });
    return null;
  }
}
