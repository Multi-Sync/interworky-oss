const { getConfig } = require('dotenv-handler');

const MAX_RETRIES = parseInt(getConfig('MAX_RETRIES_SCRAPER'), 10) || 3;
const POLL_DELAY_MS = parseInt(getConfig('POLL_DELAY_MS'), 10) || 50000; //FIXME add POLL_DELAY_MS to env vars
const { getAIProvider } = require('@interworky/providers');
const openai = getAIProvider().getClient();

const crawlWebsite = async (organization_data, token) => {
  const assistantConfig = {
    assistantName: `${organization_data.organizationName} assistant`,
    assistantPersonality: 'Welcoming',
    organizationType: 'Business',
  };

  const enrichedData = {
    ...organization_data,
    ...assistantConfig,
  };

  try {
    const url = getConfig('SCRAPER_URL');

    // Step 1: Initiate the crawl and retrieve jobId
    const response = await fetch(`${url}/api/crawl`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(enrichedData),
    });

    if (!response.ok) {
      throw new Error(`Failed to initiate crawl: ${response.statusText}`);
    }

    const { jobId } = await response.json();

    if (!jobId) {
      throw new Error('Job ID not returned from the scraper');
    }

    console.log(`Crawl initiated for jobId: ${jobId}`);

    // Step 2: Poll job status
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const statusData = await checkJobStatus(jobId, token);

        if (statusData.status === 'completed') {
          console.log(`Job ${jobId} completed successfully`);

          if (statusData.result) {
            const data = {
              assistantId: organization_data.assistantId,
              instructions: statusData.result,
              domain: organization_data.url,
            };
            return statusData.result;
          } else {
            throw new Error('No knowledge returned from the scraper');
          }
        }
        console.log(`Job ${jobId} not completed yet. Status: ${statusData.status}`);
      } catch (statusError) {
        console.error(`Error polling jobId ${jobId} (Attempt ${attempt}):`, statusError.message);
      }

      if (attempt < MAX_RETRIES) {
        console.log(`Retrying job status check for jobId ${jobId} (Attempt ${attempt + 1}/${MAX_RETRIES})`);
        await new Promise(resolve => setTimeout(resolve, POLL_DELAY_MS));
      }
    }

    throw new Error(`Job ${jobId} did not complete within ${MAX_RETRIES} attempts`);
  } catch (error) {
    console.error('Crawl process failed:', {
      error: error.message,
      organization_data,
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
};

const checkJobStatus = async (jobId, token) => {
  try {
    const url = getConfig('SCRAPER_URL');
    const statusResponse = await fetch(`${url}/api/status/${jobId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!statusResponse.ok) {
      throw new Error(`Failed to fetch job status: ${statusResponse.statusText}`);
    }

    return await statusResponse.json();
  } catch (error) {
    console.error(`Error fetching status for jobId ${jobId}:`, error.message);
    throw error;
  }
};

const updateAssistantInfoOnOpenAI = async data => {
  const FILE_SEARCH_INSTRUCTIONS =
    ' USE YOUR KNOWLEDGE BASE (AND ATTACHED VECTOR STORES) TO ANSWER QUESTIONS, if you do not know the answer, say "I dont have this in my knowledge" and do not make up an answer.';

  try {
    const { assistant_id, assistant_name, assistant_knowledge, assistant_personality } = data;
    if (!assistant_id) {
      return false;
    }

    // Build the updated instructions string
    let updatedInstructions = '';
    if (assistant_name) {
      updatedInstructions += `YOUR NAME IS ${assistant_name} `;
    }
    if (assistant_personality) {
      updatedInstructions += `YOUR PERSONALITY IS ${assistant_personality} `;
    }
    if (assistant_knowledge) {
      updatedInstructions += assistant_knowledge;
    }
    updatedInstructions += FILE_SEARCH_INSTRUCTIONS;

    // Retrieve the current assistant configuration to preserve existing tools
    const currentAssistant = await openai.beta.assistants.retrieve(assistant_id);
    const existingTools = currentAssistant.tools || [];

    // Define the new tool(s) to add (without replacing the current ones)
    const newTools = [{ type: 'file_search' }];

    // Append new tools to the existing tools list
    const updatedTools = [...existingTools, ...newTools];

    // Update the assistant with the new instructions, name, model, and the appended tools list
    await openai.beta.assistants.update(assistant_id, {
      instructions: updatedInstructions,
      name: assistant_name,
      model: 'gpt-4o',
      tools: updatedTools,
    });
    return true;
  } catch (err) {
    console.error(`Error Updating AssistantInfo On OpenAI, Error: ${err}`);
    return false;
  }
};

const createExtensiveKnowledge = async (body, token) => {
  const url = getConfig('SCRAPER_URL');
  try {
    const response = await fetch(`${url}/api/create-extensive-knowledge`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    console.log('Knowledge base creation successful:', response.status);
  } catch (error) {
    if (error instanceof TypeError) {
      console.error('Network or fetch error:', error.message);
    } else {
      console.error('Error creating knowledge base:', error.message);
    }
    throw error;
  }
};

module.exports = {
  crawlWebsite,
  updateAssistantInfoOnOpenAI,
  createExtensiveKnowledge,
};
