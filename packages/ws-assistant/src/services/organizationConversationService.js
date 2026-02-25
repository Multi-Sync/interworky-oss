// src/services/organizationConversationService.js

const axios = require("axios");

// Helper function to create a new organization conversation
async function saveThreadIdToOrganizationConversationThreads(
  orgId,
  email,
  threadId,
) {
  try {
    const response = await axios.post(
      `${process.env.NODE_PUBLIC_API_URL}/api/organization-conversations`,
      {
        organization_id: orgId,
        email,
        thread_id: threadId,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
        },
      },
    );
    return response.data;
  } catch (error) {
    console.error("Error saving thread ID:", error.message);
    throw new Error("Failed to save thread ID");
  }
}

// Helper function to retrieve the thread ID
async function getThreadIdFromOrganizationConversationThreads(orgId, email) {
  try {
    const response = await axios.get(
      `${process.env.NODE_PUBLIC_API_URL}/api/organization-conversations/organization/${orgId}/email/${email}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
        },
      },
    );
    return response.data.thread_id;
  } catch (error) {
    console.error("Error retrieving thread ID:", error.message);
    return null;
  }
}

module.exports = {
  getThreadIdFromOrganizationConversationThreads,
  saveThreadIdToOrganizationConversationThreads,
};
