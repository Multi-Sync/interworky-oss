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
