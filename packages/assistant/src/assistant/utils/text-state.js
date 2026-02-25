let realtimeClient = null;
let loadingAnimationIsActive = false;
let patientEmailSentToAgent = false; // Track if patient email has been sent as system message

export function setRealtimeClient(client) {
  realtimeClient = client;
}

export function getRealtimeClient() {
  return realtimeClient;
}

export function getLoadingAnimationIsActive() {
  return loadingAnimationIsActive;
}

export function setLoadingAnimationIsActive(value) {
  loadingAnimationIsActive = value;
}

// Patient email system message tracking
export function getPatientEmailSentToAgent() {
  return patientEmailSentToAgent;
}

export function setPatientEmailSentToAgent(sent) {
  patientEmailSentToAgent = sent;
}
