export class ChatManager {
  static instance = null;
  isChatting = false;
  lastToggleTime = 0;
  DEBOUNCE_TIME = 500; // 500ms debounce

  static getInstance() {
    if (!ChatManager.instance) {
      ChatManager.instance = new ChatManager();
    }
    return ChatManager.instance;
  }

  reinject() {
    if (window.Interworky) {
      window.Interworky.reinject();
    }
  }

  toggleChat() {
    // Check if enough time has passed since last toggle
    const now = Date.now();
    if (now - this.lastToggleTime < this.DEBOUNCE_TIME) {
      return this.isChatting;
    }
    this.lastToggleTime = now;

    if (window.Interworky) {
      if (this.isChatting) {
        window.Interworky.remove();
        this.isChatting = false;
      } else {
        window.Interworky.init();
        this.isChatting = true;
      }
    } else {
      window?.Interworky?.init();
    }
    return this.isChatting;
  }

  getStatus() {
    return this.isChatting;
  }
}
