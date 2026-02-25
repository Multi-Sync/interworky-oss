const Organization = require('./organization.model');
const OrganizationAssistants = require('../organization_assistants/organization_assistants.model');
const { createAssistantDataUtil } = require('../assistant_data/assistant_data.utils');
const HttpError = require('../../utils/HttpError');
const { createOrganizationPath } = require('../../utils/gcp');
const AssistantInfo = require('../assistant_info/assistant_info.model');
const jwt = require('jsonwebtoken');
const { syncWebsiteContent } = require('../../services/scraperService');
const { getConfig } = require('dotenv-handler');
const JWT_SECRET = getConfig('JWT_SECRET');
const path = require('path');
const axios = require('axios');

async function createOrganizationUtil({ organization_name, organization_website, creator_user_id }) {
  // Check if an organization with the same creator_user_id already exists
  const existingOrganization = await Organization.findOne({ creator_user_id });
  if (existingOrganization) {
    throw new HttpError('User has already created an organization', 400);
  }

  // Create the organization
  const organization = new Organization({
    organization_name,
    organization_website,
    creator_user_id,
  });
  await organization.save();

  // Ensure creator is added as an admin member for consistency
  if (!Array.isArray(organization.users)) {
    organization.users = [];
  }
  const creatorExists = organization.users.some(u => u.userId === creator_user_id);
  if (!creatorExists) {
    organization.users.push({ userId: creator_user_id, role: 'admin' });
    await organization.save();
  }

  // Define organization-specific details for the assistant
  const organizationInfo = {
    orgName: organization_name,
    orgWebsite: organization_website,
    orgAdmin: creator_user_id,
  };

  const customerAssistantInstructions = `
    You are a customer assistant at ${organizationInfo.orgName}, 
    you are helping people book appointments and send questions to ${organizationInfo.orgName}, 
    IF SOMEONE is ready to BOOK an appointment, please reply with "$date$", 
    once the user books the appointment, you should be minimal in conversation or say good stuff about the ${organizationInfo.orgWebsite}.
  `;

  // Call the reusable function to create assistant data
  const assistantData = await createAssistantDataUtil(
    organization_name + ' Assistant',
    'some_image_url', // Pass the image URL if you have one
    customerAssistantInstructions,
    'friendly assistant on the website',
    'customer_assistant',
    organizationInfo,
  );
  await assistantData.save();

  // Add a row to organization assistants
  const organizationAssistant = new OrganizationAssistants({
    organization_id: organization.id,
    assistant_id: assistantData.assistant_id,
  });

  await organizationAssistant.save();
  //old assisant knowledge -saved for reference - Please keep responses concise (under 30 words). Use natural, conversational language. Format in markdown when appropriate. Ask clarifying questions if needed. Avoid robotic responses.
  const orgAssistantInfo = new AssistantInfo({
    organization_id: organization.id,
    assistant_id: assistantData.assistant_id,
    assistant_name: `Carla`,
    assistant_personality: 'Welcoming',
    assistant_knowledge:
      'This Interworky AI Agent have not been trained yet, please wait for the training to complete or start website syncing.',
    primary_color: '#ffffff',
    secondary_color: '#058A7C',
    error_color: '#ff6666',
    text_primary_color: '#000000',
    text_secondary_color: '#ffffff',
    assistant_image_url: 'https://storage.googleapis.com/multisync/interworky-gpt/Carla.png',
    appointments_enabled: false,
    voice_enabled: true,
    contact_info_required: false,
    opening_statement: 'Thank you for visiting us today',
    first_message: 'Hi, How can I help you?',
    premium: false,
    dim_screen: true,
    // Enable all features by default for new accounts
    cx_enabled: true,
    analytics_enabled: true,
    monitoring_enabled: true,
    auto_fix_enabled: false,
    personalization_enabled: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  await orgAssistantInfo.save();
  await createOrganizationPath(organization.id, orgAssistantInfo);
  if (!organization_website.includes('example.com')) {
    runScraperForRealtimeKnowledeBaseInBackground(organization.id, organization_website, creator_user_id);
  }
  return { organization, assistantData };
}

function runScraperForRealtimeKnowledeBaseInBackground(organizationId, organizationWebsite, creator_user_id) {
  // run in background with setImmediate
  setImmediate(async () => {
    const token = jwt.sign({ userId: creator_user_id }, JWT_SECRET, {
      expiresIn: '10h',
    });
    const scrapingAndUploadingKnowledgebaseCompleted = await syncWebsiteContent(organizationWebsite, token);
    if (!scrapingAndUploadingKnowledgebaseCompleted) {
      console.error(`Failed to scrape and upload knowledge base for organization ${organizationId}`);
      return;
    }

    const orgAssistantInfo = await AssistantInfo.findOne({
      organization_id: organizationId,
    });
    if (!orgAssistantInfo) {
      console.error(`Assistant info not found for organization ${organizationId}`);
      return;
    }

    // knowledgebase is uploaded to Google Cloud Storage,
    // url pattern is:
    // https://storage.googleapis.com/multisync/interworky/interworky-orgs/{environment}/{orgId}/knowledge-{org-website}.txt
    const ENVIRONMENT = process.env.NODE_ENV;
    const ORG_PREFIX = path.posix.join('interworky', 'interworky-orgs', ENVIRONMENT);
    let organizationDomainName = organizationWebsite;

    try {
      const { hostname } = new URL(organizationDomainName);
      organizationDomainName = hostname.replace(/^www\./, '');
    } catch (err) {
      console.error('error parsing organization website URL:', err);
      console.error('Invalid URL:', organizationWebsite);
    }

    const assistantInfoFilePath = path.posix.join(ORG_PREFIX, organizationId, `summary-${organizationDomainName}.txt`);
    console.log(`Fetching knowledge base from: https://storage.googleapis.com/multisync/${assistantInfoFilePath}`);
    // get text from the URL using axios
    //https://storage.googleapis.com/multisync/interworky/interworky-orgs/development/b2655c7a-3c4c-452e-83ab-aab2a8597261/knowledge-interworky.com.txt
    //https://storage.googleapis.com/multisync/interworky/interworky-orgs/development/b2655c7a-3c4c-452e-83ab-aab2a8597261/knowledge-interworky.com.txt
    let response;
    try {
      response = await axios.get(`https://storage.googleapis.com/multisync/${assistantInfoFilePath}`);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        console.error(`Failed to fetch knowledge base: ${err.response.status} ${err.response.statusText}`);
      } else {
        console.error('Unexpected error:', err);
      }
    }

    const knowledgeBaseText = response.data;

    // Update the assistant info with the knowledge base text
    orgAssistantInfo.assistant_knowledge = knowledgeBaseText;
    orgAssistantInfo.save();
    console.log(`Knowledge base updated for organization ${organizationId}`);
  });
}

module.exports = {
  createOrganizationUtil,
};
