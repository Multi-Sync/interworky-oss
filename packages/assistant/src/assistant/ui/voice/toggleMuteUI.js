import {
  getIsMuted,
  getRealtimeClient,
  toggleIsMuted,
} from '../../utils/voice-state';
import { updateMuteUI } from './updateMuteUI';

export function toggleMuteUI() {
  toggleIsMuted();

  // Update mic state using OpenAI Agents SDK
  const client = getRealtimeClient();
  if (client) {
    if (getIsMuted()) {
      // Mute the microphone
      if (client.muteMic) {
        client.muteMic();
      } else if (client.micStream) {
        // Fallback for old implementation
        client.micStream.getAudioTracks().forEach((track) => {
          track.enabled = false;
        });
      }
    } else {
      // Unmute the microphone
      if (client.unMuteMic) {
        client.unMuteMic();
      } else if (client.micStream) {
        // Fallback for old implementation
        client.micStream.getAudioTracks().forEach((track) => {
          track.enabled = true;
        });
      }
    }
  }

  // Update UI based on current mode
  updateMuteUI();
}
