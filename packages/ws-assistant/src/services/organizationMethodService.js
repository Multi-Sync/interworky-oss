// src/services/organizationMethodService.js

const axios = require("axios");

// Helper function to retrieve organization methods by organization ID
async function getOrganizationMethodsByOrgId(orgId) {
  try {
    const response = await axios.get(
      `${process.env.NODE_PUBLIC_API_URL}/api/organization-methods/organization/${orgId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
        },
      },
    );
    return response.data;
  } catch (error) {
    console.error("Error retrieving organization methods:", error.message);
    throw new Error("Failed to retrieve organization methods");
  }
}

module.exports = {
  getOrganizationMethodsByOrgId,
};
