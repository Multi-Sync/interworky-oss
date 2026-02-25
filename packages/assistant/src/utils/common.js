import { DateTime } from 'luxon';
import {
  chatPopupClosedViewInterworkyStyle,
  chatPopupClosedViewStyle,
  chatPopupClosedViewBadgeStyle,
} from '../styles/styles';
import { getAssistantByOrganizationId } from './api/organizationApi';

/**
 * Splits the full name into first name and last name with edge cases.
 * If only one word is provided, it's considered as the first name.
 *
 * @param {string} fullName - The full name of the user.
 * @returns {object} - An object containing firstName and lastName.
 */
export function splitFullName(fullName) {
  const nameParts = fullName.trim().split(' ');
  const firstName = nameParts[0];
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : ' - '; // Handle case where there's no last name
  return { firstName, lastName };
}

/**
 * parses the feedback from a formatted string - used in received post visit survey from the server
 *
 * @param {string} feedbackString - The feedback string to parse.
 * @returns {object} - The parsed feedback object.
 */
export function parseFeedback(feedbackString) {
  // Use a regular expression to find the JSON-like string after $REPORT_READY$
  const regex = /\$REPORT_READY\$\s*\{(.+?)\}/;
  const match = feedbackString.match(regex);

  if (match && match[1]) {
    try {
      // Extract the key-value pairs and split them into an array
      const keyValuePairs = match[1].split(',').map((pair) => pair.trim());

      // Initialize an object to hold the parsed feedback
      const feedbackObject = {};

      // Iterate over each key-value pair and add it to the feedbackObject
      keyValuePairs.forEach((pair) => {
        const [key, value] = pair.split(':').map((str) => str.trim());

        // Remove quotes from the keys and values
        const cleanedKey = key.replace(/['"]+/g, '');
        let cleanedValue = value.replace(/['"]+/g, '');

        // Convert specific values to the correct types for your validator
        if (cleanedKey === 'rating') {
          cleanedValue = Number(cleanedValue);
        } else if (
          cleanedKey ===
          'can_we_add_you_as_a_happy_customer_on_our_social_website'
        ) {
          cleanedValue = cleanedValue.toLowerCase() === 'true';
        }

        // Add the key-value pair to the feedback object
        feedbackObject[cleanedKey] = cleanedValue;
      });

      return feedbackObject;
    } catch (error) {
      console.error('Error parsing feedback:', error);
      return null;
    }
  } else {
    console.error('No feedback found in the string.');
    return null;
  }
}

/**
 * Converts a given date, time, and timezone to ISO 8601 format.
 * @param {string} dateStr - The date string (e.g., "Wed Oct 30 2024 00:00:00 GMT-0700 (Pacific Daylight Time)").
 * @param {string} timeStr - The time string (e.g., "12:00 PM").
 * @param {string} timezone - The timezone (e.g., "America/Los_Angeles").
 * @returns {string} - The ISO 8601 formatted date-time string.
 */
export function convertToIsoTime(dateStr, timeStr, timezone) {
  const date = new Date(dateStr); // Parse the date string
  const [time, period] = timeStr.split(' '); // Split time and period (AM/PM)
  let [hours, minutes] = time.split(':').map(Number); // Extract hours and minutes

  // Convert 12-hour format to 24-hour format
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;

  // Use Luxon to create a DateTime object in the specified timezone
  const dateTime = DateTime.fromObject(
    {
      year: date.getFullYear(),
      month: date.getMonth() + 1, // Luxon uses 1-based months
      day: date.getDate(),
      hour: hours,
      minute: minutes,
    },
    { zone: timezone }
  );

  return dateTime.toUTC().toISO(); // Convert to UTC and return ISO 8601 string
}

/**
 * Decodes an API key from Base64 and extracts the organization and assistant IDs.
 *
 * @param {string} apiKey - The API key encoded in Base64 format.
 * @returns {Object} - An object containing `orgId` and `assistantId`.
 */
export async function decodeApiKey(apiKey) {
  const decodedData = atob(apiKey);
  let parts = decodedData.split('$$');
  if (!parts || parts.length < 2) {
    parts = decodedData.split(':');
  }
  // Check if it’s for LM Studio or OpenAI
  if (parts.length === 4) {
    // LM Studio API key: orgId:lmStudioUrl:modelName
    const [orgId, lmStudioUrl, modelName, systemMessage] = parts;
    return { orgId, lmStudioUrl, modelName, systemMessage };
  } else if (parts.length === 2) {
    // OpenAI API key: orgId:assistantId
    const [orgId, assistantId] = parts;
    // Fetch assistant ID if needed (ensure it's still valid)
    const updatedAssistantData = await getAssistantByOrganizationId(orgId);
    if (
      updatedAssistantData &&
      updatedAssistantData.organizationAssistants.length > 0
    ) {
      const updatedAssistantId =
        updatedAssistantData.organizationAssistants[0].assistant_id;
      return { orgId, assistantId: updatedAssistantId };
    }
    return { orgId, assistantId };
  } else {
    throw new Error('Invalid API key format.');
  }
}

export function fetchScriptTags() {
  const scriptTag = document.querySelector('script[data-api-key]');
  const apiKey = scriptTag ? scriptTag.getAttribute('data-api-key') : null;

  const voiceTag = document.querySelector('script[data-voice-only]');
  const voiceModeOnly =
    voiceTag && voiceTag.getAttribute('data-voice-only') === 'true'
      ? true
      : false;

  // Check for view type (supports both old data-landing and new data-view)
  const viewTypeTag = document.querySelector('script[data-view]');
  const landingTag = document.querySelector('script[data-landing]');

  let viewType = 'normal'; // default
  if (viewTypeTag) {
    viewType = viewTypeTag.getAttribute('data-view') || 'normal';
  } else if (landingTag && landingTag.getAttribute('data-landing')) {
    // Backward compatibility with old data-landing attribute
    viewType = 'landing';
  }

  const interworkyLandingTag = viewType === 'landing';

  const scriptPositionTag = document.querySelector('script[data-position]');
  const positionAttr = scriptPositionTag
    ? scriptPositionTag.getAttribute('data-position')
    : 'bottom-90 right-50';
  const [verticalPosition, horizontalPosition] = positionAttr.split(' ');

  // Select the appropriate style based on view type
  let closedPopupViewStyle;
  if (viewType === 'badge') {
    closedPopupViewStyle = chatPopupClosedViewBadgeStyle;
  } else if (viewType === 'landing') {
    closedPopupViewStyle = chatPopupClosedViewInterworkyStyle;
  } else {
    closedPopupViewStyle = chatPopupClosedViewStyle;
  }

  const chatPopupClosedViewDynamicStyle = updatePositionStyle(
    closedPopupViewStyle,
    verticalPosition,
    horizontalPosition
  );

  const nativeTag = document.querySelector('script[data-native-code]');
  const native =
    nativeTag && nativeTag.getAttribute('data-native-code') == 'true'
      ? true
      : false;

  // Check for resume builder mode
  const resumeTag = document.querySelector('script[data-resume]');
  const resumeMode =
    resumeTag && resumeTag.getAttribute('data-resume') === 'true'
      ? true
      : false;

  // Check for flow mode (dynamic flows from backend)
  const flowTag = document.querySelector('script[data-flow-id]');
  const flowId = flowTag ? flowTag.getAttribute('data-flow-id') : null;

  return {
    apiKey,
    chatPopupClosedViewDynamicStyle,
    voiceModeOnly,
    native,
    interworkyLandingTag,
    viewType,
    resumeMode,
    flowId,
  };
}

// Function to update the style object with the extracted position
export function updatePositionStyle(
  style,
  verticalPosition,
  horizontalPosition
) {
  if (verticalPosition.includes('top')) {
    style.top = verticalPosition.replace('top-', '') + 'px';
    delete style.bottom;
  } else if (verticalPosition.includes('bottom')) {
    style.bottom = verticalPosition.replace('bottom-', '') + 'px';
    delete style.top;
  }

  if (horizontalPosition.includes('left')) {
    style.left = horizontalPosition.replace('left-', '') + 'px';
    delete style.right;
  } else if (horizontalPosition.includes('right')) {
    style.right = horizontalPosition.replace('right-', '') + 'px';
    delete style.left;
  }
  return style;
}

/**
 * Gets the appropriate closed view style based on view type
 * @param {string} viewType - The view type ('normal', 'landing', 'badge')
 * @returns {object} - The corresponding style object
 */
export function getClosedViewStyleByType(viewType) {
  let closedPopupViewStyle;

  if (viewType === 'badge') {
    // Badge view always stays at right edge, centered vertically
    // No custom positioning applied
    closedPopupViewStyle = { ...chatPopupClosedViewBadgeStyle };
  } else if (viewType === 'landing') {
    const positionAttr = 'bottom-0 right-50';
    const [verticalPosition, horizontalPosition] = positionAttr.split(' ');

    closedPopupViewStyle = chatPopupClosedViewInterworkyStyle;

    closedPopupViewStyle = updatePositionStyle(
      { ...closedPopupViewStyle },
      verticalPosition,
      horizontalPosition
    );
  } else {
    // For normal apply custom positioning
    const scriptPositionTag = document.querySelector('script[data-position]');
    const positionAttr = scriptPositionTag
      ? scriptPositionTag.getAttribute('data-position')
      : 'bottom-90 right-50';
    const [verticalPosition, horizontalPosition] = positionAttr.split(' ');

    if (viewType === 'landing') {
      closedPopupViewStyle = chatPopupClosedViewInterworkyStyle;
    } else {
      closedPopupViewStyle = chatPopupClosedViewStyle;
    }

    closedPopupViewStyle = updatePositionStyle(
      { ...closedPopupViewStyle },
      verticalPosition,
      horizontalPosition
    );
  }

  return closedPopupViewStyle;
}

export function getEnvironment() {
  const url = process.env.NODE_PUBLIC_API_URL;
  switch (url) {
    case 'https://staging.interworky.com/api-core':
      return 'staging';
    case 'https://interworky.com/api-core':
      return 'production';
    default:
    case 'http://localhost:3015':
      return 'development';
  }
}

/**
 * Fetches the user's country information using the IP geolocation API.
 *
 * @async
 * @function getUserCountry
 * @returns {Promise<{countryName: string, countryCode: string} | null>} An object containing the country name and country code, or null if an error occurs.
 * @throws {Error} If there is an issue with the API request.
 */
export const getUserCountry = async () => {
  try {
    // Make a request to the IP geolocation API
    const response = await fetch('https://ipapi.co/json/');
    const json = await response.json();

    // Extract the country information
    const { country_name, country_code } = json;

    return {
      countryName: country_name,
      countryCode: country_code,
    };
  } catch (error) {
    console.error('Error fetching geolocation data:', error);
    return null;
  }
};
/**
 * Generate a unique user ID based on timezone and a random factor, or retrieve it from localStorage.
 * @returns {string} - A unique user ID.
 */
export const generateEmail = async () => {
  // Generate exactly 13 random alphanumeric characters
  const generateRandomString = (length = 13) => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
  };

  const randomValue = generateRandomString(13);
  const { countryCode } = await getUserCountry();
  let prefix = countryCode || 'anonymous';
  const userId = `${prefix}-${randomValue}@interworky.com`.toLowerCase();

  return userId;
};
