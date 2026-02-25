export const formatDateWithDay = date => {
  const validDate = new Date(date);

  if (isNaN(validDate)) {
    return '';
  }

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayName = days[validDate.getDay()];

  const day = validDate.getDate();
  const month = validDate.toLocaleString('en-US', { month: 'short' });
  const year = validDate.getFullYear();
  return `${dayName}, ${day} ${month} ${year}`;
};

//  View Chat utils
export const getMessageDay = timestamp => {
  // Convert seconds to milliseconds for correct date
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const formatMessageTime = timestamp => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const groupMessagesByDay = messages => {
  return messages.reduce((groups, message) => {
    const day = getMessageDay(message.timestamp);
    if (!groups[day]) {
      groups[day] = [];
    }
    groups[day].push(message);
    return groups;
  }, {});
};

export const extractDomain = url => {
  if (!url || typeof url !== 'string') return '';

  const regex = /^(https?:\/\/)?(www\.)?([\w-]+)(\.[\w-]+)+/;
  const match = url.match(regex);
  return match ? match[3] : '';
};

export async function decodeApiKey(apiKey) {
  const decodedData = atob(apiKey);
  let parts = decodedData.split('$$');
  if (!parts || parts.length < 2) {
    parts = decodedData.split(':');
  }
  // Check if it's for LM Studio or OpenAI
  if (parts.length === 4) {
    // LM Studio API key: orgId:lmStudioUrl:modelName
    const [orgId, lmStudioUrl, modelName, systemMessage] = parts;
    return { orgId, lmStudioUrl, modelName, systemMessage };
  } else if (parts.length === 2) {
    // OpenAI API key: orgId:assistantId
    const [orgId, assistantId] = parts;
    return { orgId, assistantId };
  } else {
    throw new Error('Invalid API key format.');
  }
}

/**
 * Check if a website URL is a placeholder value (example.com or https://example.com)
 * @param {string} website - The website URL to check
 * @returns {boolean} - True if the website is a placeholder value
 */
export const isPlaceholderWebsite = website => {
  if (!website || typeof website !== 'string') return true;
  const trimmed = website.trim().toLowerCase();
  return trimmed === 'example.com' || trimmed === 'https://example.com' || trimmed === 'http://example.com';
};
