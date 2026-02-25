import {
  setIsChatActive,
  setIsHomeBubbleVisible,
  getAssistantInfo,
  getScriptTags,
} from '../../utils/state';
import { removeAllChatElements } from '../baseMethods';
import { getRealtimeClient as getRealtimeClientVoice } from '../../utils/voice-state';
import { getRealtimeClient as getRealtimeClientText } from '../../utils/text-state';
import logger from '../../../utils/logger';
import visitorJourneyAnalytics from '../../../utils/analytics/VisitorJourneyAnalytics';

export const closeChatButtonClickHandler = async (event) => {
  const chatPopupClosedViewButton = document.getElementById(
    'interworky-customer-assistant-popup'
  );
  if (event) {
    event.stopPropagation();
  }
  if (!getRealtimeClientVoice() && !getRealtimeClientText()) {
    logger.warn('IW049', 'Realtime client is not initialized');
    return;
  } else {
    if (getRealtimeClientVoice()) {
      getRealtimeClientVoice().close();
    }
    if (getRealtimeClientText()) {
      getRealtimeClientText().close();
    }
  }
  setIsChatActive(false);
  removeAllChatElements();

  // Track session end
  await visitorJourneyAnalytics.endSession('natural');
  // Only show home bubble if not badge view
  const viewType =
    getAssistantInfo().view_type || getScriptTags().viewType || 'normal';
  const isBadgeView = viewType === 'badge';

  if (chatPopupClosedViewButton) {
    // Badge view needs flex display, others use block
    if (isBadgeView) {
      chatPopupClosedViewButton.style.display = 'flex';
    } else {
      chatPopupClosedViewButton.style.display = 'block';
    }
  }

  if (!isBadgeView) {
    setIsHomeBubbleVisible(true);
  }
};
