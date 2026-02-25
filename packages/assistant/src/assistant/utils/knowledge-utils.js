import { getEnvironment } from '../../utils/common';
import {
  getAssistantInfo,
  getOrganization,
  getPatient,
  getOrgMethods,
} from './state';

export async function getSiteKnowledge(organizationId, organizationWebsite) {
  const ENVIRONMENT = getEnvironment();
  //remove http/https and www from the website
  let orgDomainName = normalizeDomain(organizationWebsite);
  // Example URL:
  // https://storage.googleapis.com/multisync/interworky/interworky-orgs/development/15bf24a2-8406-4f3e-9b44-fe330c71021c/1748293726577_knowledge-interworky.gitbook.txt
  const siteKnowledgeFilePath = `https://storage.googleapis.com/multisync/interworky/interworky-orgs/${ENVIRONMENT}/${organizationId}/knowledge-${orgDomainName}.txt`;
  try {
    const response = await fetch(siteKnowledgeFilePath);
    if (!response.ok) {
      throw new Error(`Failed to fetch site knowledge: ${response.statusText}`);
    }
    return await response.text();
  } catch (error) {
    console.error('Error fetching site knowledge:', error);
    return 'No site knowledge available.';
  }
}

// given a domain name return the sitemap xml url
export async function getSitemapUrl() {
  const domainName = getOrganization().organization_website;
  // Normalize the domain name
  const normalizedDomain = normalizeDomain(domainName);
  // Construct the sitemap URL
  //use https://interworky.com/functions/api/get-sitemap?domain=${normalizedDomain} to get the sitemap url
  const url = `https://interworky.com/functions/api/get-sitemap?domain=${encodeURIComponent(normalizedDomain)}`;
  //read the sitemap xml file from the url and return the content (using axios)
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch sitemap: ${response.statusText}`);
    }
    return response.text();
  } catch (error) {
    console.error('Error fetching sitemap:', error);
    return null; // or handle the error as needed
  }
}

//https://interworky.com/functions/api/read-page?url=interworky.com/product returns the page content
export async function readPageContent(url) {
  try {
    const response = await fetch(
      `https://interworky.com/functions/api/read-page?url=${encodeURIComponent(url)}`
    );
    if (response.status !== 200) {
      throw new Error(`Failed to fetch page content: ${response.statusText}`);
    }
    const content = await response.text();
    return content;
  } catch (error) {
    console.error('Error fetching page content:', error);
    return null; // or handle the error as needed
  }
}

function normalizeDomain(input) {
  let url = input.trim();

  // If the user didn't include a protocol, assume https://
  if (!/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(url)) {
    url = 'https://' + url;
  }

  try {
    // URL will now parse cleanly
    const { hostname } = new URL(url);
    // Strip a leading www.
    return hostname.replace(/^www\./i, '');
  } catch (err) {
    console.error('Invalid URL in normalizeDomain():', input, err);
    // Fallback: strip protocol, path, and www via regex
    return input
      .replace(/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//, '') // remove scheme
      .split(/[/?#]/)[0] // drop path or query
      .replace(/^www\./i, ''); // drop www
  }
}

export function getAssistantSetupMessagesArray(
  assistantName,
  assistantPersonality,
  summary,
  organization_name,
  organizationWebsite,
  mode_enabled,
  env_description,
  browser,
  windowUrl,
  country,
  time,
  date,
  timezone,
  language
) {
  const whoAreYou = `
  You are an **Interworky AI Agent**, created by Interworky.com (the future of web browsing).
  Your name is **${assistantName}**.
  Your personality is **${assistantPersonality}**.
  You now work for **${organization_name}**, and your subscription cost (i.e., your “salary”) is **$20/month**.
  You are hired to be a genius customer support agent for **${organizationWebsite}**.
`;
  const howToRespond = `
  Please **limit your answers to two sentences**.
  If the user’s question is very general and requires a long answer, **ask clarifying questions** to narrow down their request.
`;
  const getUserContext = `
  You exist on **${env_description}**.
  The user is interacting via **${mode_enabled}**.
  The website owner added you to **${organizationWebsite}** using interworky.com—the best tool for AI customer support.
  The goal of your presence is to help visitors learn more about **${organization_name}**, answer their questions, and showcase **${organizationWebsite}**.

  The user is on **${browser}**, viewing page **${windowUrl}**.
  The user’s country is **${country}**, current time is **${time}**, current date is **${date}**, and timezone is **${timezone}** (from browser settings).
  The user’s preferred language is **${language}**.
`;
  const underStandTheTools = `
  When you need to answer questions, rely on the **conversation context** and **session instructions**.  
  If you don’t know an answer, use the following tools to find it:

  1. **get_website_knowledge**  
     - Returns the entire website content.  


`;
  // 2. **get_website_sitemap**
  //    - Returns a list of all pages on the site.
  //    - Helps identify which page to read.
  //    - Use to verify if a page exists before reading it.
  const getWebsiteSitemap = `
  2. **get_website_sitemap**
     - Returns a list of all pages on the site.
     - Helps identify which page to read.
     - Use to verify if a page exists before reading it.

     IF THE SITEMAP IS NOT AVAILABLE, YOU CAN USE THE **read_page_content** TOOL TO READ THE PAGE THE USER IS SPEAKING YOU FROM, OR USE THE **get_website_knowledge** TOOL TO GET THE ENTIRE WEBSITE CONTENT.
  `;

  // 3. **read_page_content**
  //    - Takes a URL and returns all text from that page.
  //    - Best practice: call 'get_website_sitemap' first to find the relevant page, then use this tool.
  //    - use get_website_sitemap to get the url of the page you want to read.
  const readPageContent = `
  3. **read_page_content**
     - Takes a URL and returns all text from that page.
     - Best practice: call 'get_website_sitemap' first to find the relevant page, then use this tool.
     - Use 'get_website_sitemap' to get the URL of the page you want to read.
  `;

  // 4. **get_knowledge_urls**
  //    - Returns a list of URLs that contain knowledge snippets.

  // 5. **get_knowledge_files**
  //    - Returns files (PDF, TXT, etc.) with stored knowledge.
  const whatToDoWhenYouDontKnow = `
  If you don’t know the answer to a question:
  1. **Ask the user to contact the website via email** (retrieve the email from your knowledge).  
  2. Inform them that ** Interworky will send a follow-up email to the website management ** containing the conversation log.

  Please **avoid guessing** or making up facts. Be transparent: if you don’t know, let the user know.
`;
  const guardRailsOffBrand = `
  - Stay **focused on ${organization_name}** and **${organizationWebsite}**—no off-topic conversations.  
  - If the user strays, **politely remind** them that you can only discuss topics related to ${organization_name} or ${organizationWebsite}.  
  - Always bring the conversation back to **${organization_name}**.
  - PLEASE AVOID TELLING THE USER TO VISIT THE WEBSITE, AS THEY ARE ALREADY ON IT.
  - IF YOU DONT HAVE AN ANSWER TO A QUESTION, PLEASE INFORM THE USER THAT YOU DONT HAVE THE ANSWER, AND TELL THEM THAT YOU WILL INFORM THE WEBSITE MANAGEMENT ABOUT THEIR QUESTION, AND THEY WILL GET BACK TO THEM VIA EMAIL.
`;

  const knowledgeSummary = `Here is a summary of your knowledge about ${organization_name}:
  ${summary}
  If you need to answer questions, use the tools provided to find the information.`;

  // Build dynamic tools section from organization methods
  const orgMethods = getOrgMethods();
  let dynamicToolsSection = '';
  if (orgMethods && Array.isArray(orgMethods) && orgMethods.length > 0) {
    // Limit to 5 tools as per current implementation
    const limitedMethods = orgMethods.slice(0, 5);
    const toolDescriptions = limitedMethods
      .map((method, index) => {
        return `  ${index + 4}. **${method.method_name}**
     - ${method.method_description}
     - Endpoint: ${method.method_verb} ${method.method_endpoint}`;
      })
      .join('\n\n');

    dynamicToolsSection = `
Additional custom tools available for ${organization_name}:

${toolDescriptions}

These tools are specific to ${organization_name} and can help you provide more detailed assistance.`;
  }

  const setupMessages = [
    whoAreYou,
    howToRespond,
    getUserContext,
    underStandTheTools,
    whatToDoWhenYouDontKnow,
    getWebsiteSitemap,
    readPageContent,
    ...(dynamicToolsSection ? [dynamicToolsSection] : []), // Only add if tools exist
    guardRailsOffBrand,
    knowledgeSummary,
  ];

  return setupMessages;
}

export function getInstructions() {
  const setupAgentMessagesArray = getAssistantSetupMessagesArray(
    getAssistantInfo().assistant_name,
    getAssistantInfo().assistant_personality,
    getAssistantInfo().assistant_knowledge,
    getOrganization().organization_name,
    getOrganization().organization_website,
    'voice',
    window.location.hostname == 'interworky.com'
      ? 'Interworky.com the user is probably testing you'
      : window.location.hostname,
    navigator.userAgent,
    window.location.href,
    navigator.language || 'USA', // FIXME Country is replaced with language
    new Date().toLocaleTimeString(),
    new Date().toLocaleDateString(),
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    navigator.language || 'en-US'
  );
  const personality = getAssistantInfo().assistant_personality;
  const contactInfoRequired = getAssistantInfo().contact_info_required;

  // Build instructions based on contact info requirements
  let contactInfoInstructions = '';
  if (contactInfoRequired && !getPatient()?.email) {
    contactInfoInstructions = `\n\nIMPORTANT: Contact information is required for this conversation. You MUST capture the user's email address early in the conversation using the capture_email tool. Politely ask for their email and explain that it's needed to provide better assistance and follow-up if needed.`;
  }

  let customInstructions =
    getAssistantInfo()?.real_time_instructions?.join('\n') || '';
  customInstructions = customInstructions.toUpperCase();
  return (
    `\n\n${customInstructions}
      You are an Interworky customer assistant created by interworky.com,` +
    `you exists on the user website.Please act ${personality} and answer questions, provide information, and assist with customer inquiries.` +
    contactInfoInstructions +
    `\n\nYou can use the following tools: \n\n` +
    `get_website_knowledge returns the full website knowledge, it can be a lot of information` +
    `\n\nPlease LIMIT YOUR ANSWERS TO TWO SENTENCES AND IF YOU CANT ASK CLARIFYING QUESTIONS` +
    `\n\n ${setupAgentMessagesArray.join('\n\n')}`
  );
}
