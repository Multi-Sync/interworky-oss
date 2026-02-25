import {
  alertBoxStyle,
  assistantContainerStyle,
  assistantIconStyle,
  assistantMessageStyle,
  assistantNameStyle,
  bubbleStyle,
  calendarContainerStyle,
  calendarDaysStyle,
  calendarHeaderStyle,
  chatPopupClosedViewStyle,
  closeButtonVoiceMode,
  darkThemeContainerGlass,
  darkThemeMessageGlass,
  fullScreenContainerStyles,
  iconLabelStyle,
  iconStyle,
  lightThemeContainerGlass,
  lightThemeMessageGlass,
  lightThemeMessageSecondGlass,
  menuDotsStyle,
  multipleOptionPopupStyle,
  muteButtonStyles,
  noticeTextStyle,
  optionTextStyle,
  popupNoticeStyle,
  poweredByContainerStyle,
  privacyLinkStyle,
  tooltipStyle,
  userMessageStyle,
  xButtonStyle,
} from './styles';

// This function is duplicated from styles.js to avoid circular dependencies
// and to centralize theme logic here.
export function detectDarkTheme() {
  // Use matchMedia to check for prefers-color-scheme: dark
  const prefersDark =
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches;

  // Check document or body background color as a fallback
  if (document && document.documentElement) {
    const bodyStyles = window.getComputedStyle(document.documentElement);
    const bgColor = bodyStyles.backgroundColor;

    // Parse the background color to get RGBA values
    const colorMatch = bgColor.match(
      /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/
    );

    if (colorMatch) {
      const r = parseInt(colorMatch[1]);
      const g = parseInt(colorMatch[2]);
      const b = parseInt(colorMatch[3]);
      const a = colorMatch[4] !== undefined ? parseFloat(colorMatch[4]) : 1;

      // If the background is transparent, we can't determine the theme from it.
      // In this case, we rely solely on the prefers-color-scheme media query.
      if (a === 0) {
        return prefersDark;
      }

      // Calculate perceived brightness using luminance formula
      const brightness = r * 0.299 + g * 0.587 + b * 0.114;

      // If brightness is less than 128, it's considered dark
      return brightness < 128 || prefersDark;
    }
  }

  // Fallback to media query if color can't be parsed
  return prefersDark;
}

export function applyTheme(theme) {
  const {
    assistant_image_url: assistant_image_url,
    primary_color: primary_color,
    text_primary_color: text_primary_color,
    error_color: error_color,
    assistant_name: assistantName,
  } = theme;

  // Apply assistant name
  document.documentElement.style.setProperty('--assistant-name', assistantName);

  // Update the assistant image
  chatPopupClosedViewStyle.backgroundImage = `url(${assistant_image_url})`;

  assistantIconStyle.backgroundImage = `url("${assistant_image_url}")`;

  // Helper to apply glass styles property by property
  const applyGlass = (target, glass) => {
    target.backgroundColor = glass.backgroundColor;
    target.backdropFilter = glass.backdropFilter;
    target.WebkitBackdropFilter = glass.WebkitBackdropFilter;
    target.border = glass.border;
    target.boxShadow = glass.boxShadow;
  };

  // Detect theme and apply glass background
  const isDarkTheme = detectDarkTheme();

  import('./icons')
    .then((iconsModule) => {
      if (iconsModule.updateIcons) {
        iconsModule.updateIcons(isDarkTheme);
      }
    })
    .catch((e) => {
      console.warn('Failed to update thumbs icons:', e);
    });

  if (isDarkTheme) {
    applyGlass(assistantContainerStyle, lightThemeContainerGlass);
    applyGlass(fullScreenContainerStyles, lightThemeContainerGlass);
    applyGlass(assistantMessageStyle, darkThemeMessageGlass);
    applyGlass(userMessageStyle, darkThemeMessageGlass);
    applyGlass(muteButtonStyles, darkThemeMessageGlass);
    applyGlass(closeButtonVoiceMode, darkThemeMessageGlass);
  } else {
    applyGlass(assistantContainerStyle, darkThemeContainerGlass);
    applyGlass(fullScreenContainerStyles, darkThemeContainerGlass);
    applyGlass(assistantMessageStyle, lightThemeMessageGlass);
    applyGlass(userMessageStyle, lightThemeMessageSecondGlass);
    applyGlass(muteButtonStyles, darkThemeMessageGlass);
    applyGlass(closeButtonVoiceMode, darkThemeMessageGlass);
  }

  // Set text color based on theme for readability
  const textColor = isDarkTheme ? '#FFFFFF' : '#000000';
  assistantMessageStyle.color = textColor;
  userMessageStyle.color = textColor;

  //assistant
  assistantIconStyle.backgroundColor = primary_color;
  assistantNameStyle.color = text_primary_color;
  multipleOptionPopupStyle.backgroundColor = primary_color;
  noticeTextStyle.color = text_primary_color;
  optionTextStyle.color = text_primary_color;
  popupNoticeStyle.backgroundColor = primary_color;
  popupNoticeStyle.border = text_primary_color;
  popupNoticeStyle.border = `1px solid ${text_primary_color}`;
  privacyLinkStyle.color = text_primary_color;
  iconStyle.backgroundColor = text_primary_color;
  calendarContainerStyle.backgroundColor = primary_color;
  calendarHeaderStyle.color = text_primary_color;
  calendarDaysStyle.color = text_primary_color;
  bubbleStyle.backgroundColor = primary_color;
  bubbleStyle.color = text_primary_color;
  iconLabelStyle.color = text_primary_color;

  menuDotsStyle.color = text_primary_color;
  alertBoxStyle.backgroundColor = primary_color;
  alertBoxStyle.color = text_primary_color;
  //user

  //branding-close-chat
  xButtonStyle.color = text_primary_color;
  poweredByContainerStyle.color = text_primary_color;

  //errors
  tooltipStyle.color = text_primary_color;
  tooltipStyle.backgroundColor = error_color;
}

export function setChatClosedViewBackground(mediaUrl, parent) {
  const isVideo = /\.(mp4)$/i.test(mediaUrl);
  const chatElement = parent;

  if (isVideo) {
    // Remove any existing background image
    chatElement.style.backgroundImage = 'none';

    // Check for and remove existing video elements to avoid duplication
    const existingVideo = chatElement.querySelector('video');
    if (existingVideo) {
      chatElement.removeChild(existingVideo);
    }

    // Create a video element for the background
    const videoElement = document.createElement('video');
    videoElement.src = mediaUrl;
    videoElement.autoplay = true;
    videoElement.loop = true;
    videoElement.muted = true;
    videoElement.playsInline = true; // Essential for inline playback on iOS Safari
    videoElement.controls = false; // Disable controls
    videoElement.setAttribute('preload', 'auto'); // Preload for better performance
    videoElement.controlsList = 'nodownload nofullscreen noremoteplayback'; // Additional restrictions

    // Add inline styles
    videoElement.style.position = 'absolute';
    videoElement.style.width = '100%';
    videoElement.style.height = '100%';
    videoElement.style.objectFit = 'cover';
    videoElement.style.borderRadius = '50%';
    videoElement.style.pointerEvents = 'none'; // Ensure clicks pass through the video
    videoElement.style.userSelect = 'none'; // Prevent selection or interaction
    videoElement.setAttribute('playsinline', 'true'); // Added attribute for redundancy on iOS

    // Append to the chat element
    chatElement.appendChild(videoElement);

    // Dynamically add CSS to hide controls for this video element only
    const style = document.createElement('style');
    style.textContent = `
      .custom-video-interworky::-webkit-media-controls {
        display: none;
      }
      .custom-video::-webkit-media-controls-enclosure {
        display: none;
      }
    `;

    // Add a unique class to the video for CSS targeting
    videoElement.classList.add('custom-video-interworky');

    // Append the style to the document head
    document.head.appendChild(style);
  } else {
    // Remove existing video elements
    const existingVideo = chatElement.querySelector('video');
    if (existingVideo) {
      chatElement.removeChild(existingVideo);
    }

    // Apply background image for non-video URLs
    chatElement.style.backgroundImage = `url(${mediaUrl})`;
    chatElement.style.backgroundSize = 'cover';
    chatElement.style.backgroundPosition = 'center';
  }
}

export function setAssistantIcon(mediaUrl, parent) {
  const isVideo = /\.(mp4)$/i.test(mediaUrl);
  const iconElement = parent;

  if (isVideo) {
    // Remove any existing background image
    iconElement.style.backgroundImage = 'none';

    // Check for and remove existing video elements to avoid duplication
    const existingVideo = iconElement.querySelector('video');
    if (existingVideo) {
      iconElement.removeChild(existingVideo);
    }

    // Create and append a video element for the background
    const videoElement = document.createElement('video');
    videoElement.src = mediaUrl;
    videoElement.autoplay = true;
    videoElement.loop = true;
    videoElement.muted = true;
    videoElement.playsInline = true; // Prevent fullscreen on mobile Safari
    videoElement.controlsList = 'nodownload nofullscreen noremoteplayback';
    videoElement.style.width = '100%';
    videoElement.style.height = '100%';
    videoElement.style.objectFit = 'cover';
    videoElement.style.borderRadius = '50%';
    videoElement.style.pointerEvents = 'none'; // Ensure clicks pass through the video

    iconElement.appendChild(videoElement);
  } else {
    // Remove existing video elements
    const existingVideo = iconElement.querySelector('video');
    if (existingVideo) {
      iconElement.removeChild(existingVideo);
    }

    // Apply background image for non-video URLs
    iconElement.style.backgroundImage = `url(${mediaUrl})`;
    iconElement.style.backgroundSize = 'cover';
    iconElement.style.backgroundPosition = 'center';
  }
}

export function setVisualizerBackground(mediaUrl, parent) {
  const isVideo = /\.(mp4)$/i.test(mediaUrl);
  const iconElement = parent;

  if (isVideo) {
    // Remove any existing background image
    iconElement.style.backgroundImage = 'none';

    // Check for and remove existing video elements to avoid duplication
    const existingVideo = iconElement.querySelector('video');
    if (existingVideo) {
      iconElement.removeChild(existingVideo);
    }

    // Create and append a video element for the background
    const videoElement = document.createElement('video');
    videoElement.src = mediaUrl;
    videoElement.autoplay = true;
    videoElement.loop = true;
    videoElement.muted = true;
    videoElement.playsInline = true; // Prevent fullscreen on mobile Safari
    videoElement.controlsList = 'nodownload nofullscreen noremoteplayback';
    videoElement.style.width = '100%';
    videoElement.style.height = '100%';
    videoElement.style.objectFit = 'cover';
    videoElement.style.borderRadius = '50%';
    videoElement.style.pointerEvents = 'none'; // Ensure clicks pass through the video

    iconElement.appendChild(videoElement);
  } else {
    // Remove existing video elements
    const existingVideo = iconElement.querySelector('video');
    if (existingVideo) {
      iconElement.removeChild(existingVideo);
    }

    // Apply background image for non-video URLs
    iconElement.style.backgroundImage = `url(${mediaUrl})`;
    iconElement.style.backgroundSize = 'cover';
    iconElement.style.backgroundPosition = 'center';
  }
}
