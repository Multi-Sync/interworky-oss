// src/utils/state.js
const { v4: uuidv4 } = require('uuid');
const stateEventTarget = new EventTarget();

let connectionState = 'closed';
let isVoiceChatActive = false;
let isChatActive = false;
let isHomeBubbleVisible = false;
let isResumeMode = false;
let resumeData = {
  contactInfo: {},
  education: [],
  workExperience: [],
  skills: { technical: [], soft: [], certifications: [], languages: [] },
};
let chatPopUpClosedView,
  chatPopUpOpenView,
  voiceChatContainer,
  voiceChatLog,
  voiceChatMessages,
  assistantInfo,
  organization,
  organizationEmail,
  assistantId,
  scriptTags,
  lmStudioUrl,
  lmStudioUrlModelName,
  lmStudioSystemMessage,
  orgMethods,
  lastElementBottomPosition;

export const getConnectionState = () => connectionState;

export const setConnectionState = (newState) => {
  connectionState = newState;
};

export const getScriptTags = () => scriptTags;

export const setScriptTags = (newState) => {
  scriptTags = newState;
};

export const getIsVoiceChatActive = () => isVoiceChatActive;

export const setIsVoiceChatActive = (newState) => {
  isVoiceChatActive = newState;
};

export const getIsChatActive = () => isChatActive;

export const setIsChatActive = (newState) => {
  isChatActive = newState;
  const event = new Event('chatIsActiveChanged');
  stateEventTarget.dispatchEvent(event);
};

export const addChatIsActiveListener = (listener) => {
  stateEventTarget.addEventListener('chatIsActiveChanged', listener);
};

export const removeChatIsActiveListener = (listener) => {
  stateEventTarget.removeEventListener('chatIsActiveChanged', listener);
};

export const getIsHomeBubbleVisible = () => isHomeBubbleVisible;

export const setIsHomeBubbleVisible = (newState) => {
  isHomeBubbleVisible = newState;
  const event = new Event('homeBubbleVisibilityChanged');
  stateEventTarget.dispatchEvent(event);
};

export const addHomeBubbleVisibilityListener = (listener) => {
  stateEventTarget.addEventListener('homeBubbleVisibilityChanged', listener);
};

export const removeHomeBubbleVisibilityListener = (listener) => {
  stateEventTarget.removeEventListener('homeBubbleVisibilityChanged', listener);
};

export const getLMStudioUrl = () => lmStudioUrl;

export const setLMStudioUrl = (newState) => {
  lmStudioUrl = newState;
  return lmStudioUrl;
};

export const getLMStudioModelName = () => lmStudioUrlModelName;

export const setLMStudioModelName = (newState) => {
  lmStudioUrlModelName = newState;
  return lmStudioUrlModelName;
};

export const getLMStudioSystemMessage = () => lmStudioSystemMessage;

export const setLMStudioSystemMessage = (newState) => {
  lmStudioSystemMessage = newState;
  return lmStudioSystemMessage;
};

export const getAssistantId = () => assistantId;

export const setAssistantId = (newState) => {
  assistantId = newState;
  return assistantId;
};

export const getAssistantInfo = () => assistantInfo;

export const setAssistantInfo = (newState) => {
  assistantInfo = newState;
  return assistantInfo;
};

export const getOrgMethods = () => orgMethods;

export const setOrgMethods = (newState) => {
  orgMethods = newState;
  return orgMethods;
};

export const getOrganization = () => organization;

export const setOrganization = (newState) => {
  organization = newState;
  return organization;
};

export const getOrganizationEmail = () => organizationEmail;

export const setOrganizationEmail = (newState) => {
  organizationEmail = newState;
  return organizationEmail;
};

export const getChatPopUpClosedView = () => chatPopUpClosedView;

export const setChatPopUpClosedView = (newState) => {
  chatPopUpClosedView = newState;
  return chatPopUpClosedView;
};

export const getChatPopUpOpenView = () => chatPopUpOpenView;

export const setChatPopUpOpenView = (newState) => {
  chatPopUpOpenView = newState;
  return chatPopUpOpenView;
};

export const getLastElementBottomPosition = () => lastElementBottomPosition;

export const setLastElementBottomPosition = (newState) => {
  lastElementBottomPosition = newState;
};

export const getVoiceChatContainer = () => voiceChatContainer;
export const setVoiceChatContainer = (newState) => {
  voiceChatContainer = newState;
};

export const getVoiceChatLog = () => voiceChatLog;
export const setVoiceChatLog = (newState) => {
  voiceChatLog = newState;
};

export const getVoiceChatMessages = () => voiceChatMessages;
export const clearVoiceChatMessages = () => (voiceChatMessages = []);
export const addToVoiceChatMessages = (type, text) => {
  if (!voiceChatMessages) {
    voiceChatMessages = [];
    voiceChatMessages.push({ type, text });
  } else {
    voiceChatMessages.push({ type, text });
  }
};

export const getMessagesAnimationDelayInMilliSeconds = () => 1000;
export const getMessagesPadding = () => 10;
export const getAssistantMessagesExtraPadding = () => 50;
export const getMaxReconnectAttempts = () => 5;

export const setConversationId = (conversationId) => {
  localStorage.setItem('conversationId', conversationId);
};

export const getConversationId = () => {
  return localStorage.getItem('conversationId');
};

export const getOrgId = () => {
  return localStorage.getItem('orgId');
};

export const setOrgId = (id) => {
  return localStorage.setItem('orgId', id);
};

export const setPatient = (patient) => {
  return new Promise((resolve) => {
    localStorage.setItem('patient', JSON.stringify(patient));
    resolve();
  });
};

export const getPatient = () => {
  const patient = JSON.parse(localStorage.getItem('patient'))?.patient;
  return patient;
};

/**
 * Generates a unique patient ID and stores it in localStorage
 * @returns {string} - A unique patient ID
 */
export const generatePatientId = () => {
  const existingId = localStorage.getItem('patientId');
  if (existingId) return existingId;
  const newId = uuidv4();
  localStorage.setItem('patientId', newId);
  return newId;
};

/**
 * Retrieves the patient ID from localStorage
 * @returns {string|null} - The patient ID or null if not found
 */
export const getPatientId = () => {
  return localStorage.getItem('patientId');
};

/**
 * Sets the patient ID in localStorage
 * @param {string} patientId - The patient ID to store
 */
export const setPatientId = (patientId) => {
  localStorage.setItem('patientId', patientId);
};

// Resume Mode State
export const getIsResumeMode = () => isResumeMode;

export const setIsResumeMode = (newState) => {
  isResumeMode = newState;
  const event = new Event('resumeModeChanged');
  stateEventTarget.dispatchEvent(event);
};

export const getResumeData = () => resumeData;

export const setResumeData = (newState) => {
  resumeData = newState;
  return resumeData;
};

export const updateResumeContactInfo = (contactInfo) => {
  resumeData.contactInfo = { ...resumeData.contactInfo, ...contactInfo };
  return resumeData;
};

export const addResumeEducation = (education) => {
  resumeData.education.push(education);
  return resumeData;
};

export const addResumeWorkExperience = (workExperience) => {
  resumeData.workExperience.push(workExperience);
  return resumeData;
};

export const updateResumeSkills = (skills) => {
  if (skills.technical)
    resumeData.skills.technical.push(...skills.technical);
  if (skills.soft) resumeData.skills.soft.push(...skills.soft);
  if (skills.certifications)
    resumeData.skills.certifications.push(...skills.certifications);
  if (skills.languages)
    resumeData.skills.languages.push(...skills.languages);
  return resumeData;
};

export const clearResumeData = () => {
  resumeData = {
    contactInfo: {},
    education: [],
    workExperience: [],
    skills: { technical: [], soft: [], certifications: [], languages: [] },
  };
  return resumeData;
};
