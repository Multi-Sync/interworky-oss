const { getAIProvider } = require('@interworky/providers');
const openai = getAIProvider().getClient();
const AssistantData = require('./assistant_data.model');
const createAssistantDataUtil = async (
  name,
  image_url,
  opening_statement,
  personality,
  type,
  organizationInfo = null,
) => {
  let instructions = '';
  if (organizationInfo) {
    const { orgName, orgWebsite, orgAdmin } = organizationInfo;
    instructions = `
      You are a customer assistant at ${orgName}, 
      You exist on ${orgWebsite} as a chatbot, 
      You should help the website visitors respond to questions, use file search and knowledge attached to respond to questions.
    `;
  }

  // Create an assistant on OpenAI
  const assistant = await openai.beta.assistants.create({
    instructions,
    name,
    model: 'gpt-4o',
  });

  // Create assistant data in the database
  const assistantData = new AssistantData({
    id: assistant.id,
    name,
    image_url,
    opening_statement,
    personality,
    type,
    assistant_id: assistant.id,
  });

  await Promise.all([assistantData.save()]);

  return assistantData;
};

module.exports = {
  createAssistantDataUtil,
};
