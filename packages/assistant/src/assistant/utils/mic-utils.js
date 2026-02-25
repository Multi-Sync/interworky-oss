// voice-utils.js

// Function to request mic permission
export async function requestMicPermission() {
  try {
    await navigator.mediaDevices.getUserMedia({ audio: true });
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}
