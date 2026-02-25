const axios = require("axios");

async function getGeoData(ip) {
  try {
    const response = await axios.get(`http://ip-api.com/json/${ip}`);
    if (response.data && response.data.status === "success") {
      return {
        city: response.data.city,
        region: response.data.regionName,
        country: response.data.country,
        timezone: response.data.timezone,
      };
    } else {
      return { error: "Unable to retrieve geolocation data" };
    }
  } catch (error) {
    console.error("Error fetching geolocation data:", error.message);
    return { error: "Geolocation service unavailable" };
  }
}

module.exports = { getGeoData };
