// src/styles.js

import { getAssistantInfo } from '../assistant/utils/state';
import { detectDarkTheme } from './themeManager';

const isDarkTheme = detectDarkTheme();
// Light Theme Glass Styles
export const lightThemeContainerGlass = {
  backgroundColor: 'rgba(245, 245, 245, 0.6)', // Neutral light gray, semi-transparent
  backdropFilter: 'blur(8px) saturate(60%) brightness(120%)',
  WebkitBackdropFilter: 'blur(8px) saturate(60%) brightness(120%)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
};

export const lightThemeMessageGlass = {
  backgroundColor: 'rgba(255, 255, 255, 0.5)', // Lighter, more translucent for messages
  backdropFilter: 'blur(35px) saturate(200%) brightness(1000%)',
  WebkitBackdropFilter: 'blur(35px) saturate(200%) brightness(1000%)',
  border: '1px solid rgba(255, 255, 255, 0.3)',
  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
};

export const lightThemeMessageSecondGlass = {
  backgroundColor: 'rgba(255, 255, 255, 0.5)', // Lighter, more translucent for messages
  backdropFilter: 'blur(35px) saturate(800%) brightness(1000%)',
  WebkitBackdropFilter: 'blur(35px) saturate(800%) brightness(1000%)',
  border: '1px solid rgba(255, 255, 255, 0.3)',
  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
};
// Dark Theme Glass Styles
export const darkThemeContainerGlass = {
  backgroundColor: 'rgba(50, 55, 65, 0.55)', // Lighter, more translucent for container in dark mode
  backdropFilter: 'blur(8px) saturate(80%) brightness(110%)',
  WebkitBackdropFilter: 'blur(8px) saturate(80%) brightness(110%)',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
};

export const darkThemeMessageGlass = {
  backgroundColor: 'rgba(20, 25, 35, 0.65)', // Darker, more opaque for messages in dark mode
  backdropFilter: 'blur(25px) saturate(150%) brightness(80%)',
  WebkitBackdropFilter: 'blur(25px) saturate(150%) brightness(80%)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
};

export const popupStyles = {
  position: 'fixed',
  bottom: '0',
  left: '0',
  width: '100%',
  height: '66%',
  backgroundColor: 'white',
  borderRadius: '20px 20px 0 0',
  zIndex: '10000',
  boxShadow:
    '0px 4px 15px rgba(0, 0, 0, 0.3), 0px 6px 20px rgba(0, 0, 0, 0.19)',
  overflowY: 'auto',
  maxHeight: '90vh',
};

export const chatPopupClosedViewStyle = {
  position: 'fixed',
  width: '85px',
  height: '85px',
  borderRadius: '50%',
  backgroundColor: 'rgb(41, 86, 81)',
  cursor: 'pointer',
  zIndex: '999999',
  bottom: '24px',
  right: '2px',
  boxShadow:
    '0px 4px 15px rgba(0, 0, 0, 0.3), 0px 6px 20px rgba(0, 0, 0, 0.19)',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  animation: 'bounceEntrance 0.8s ease-out, glowPulse 3s ease-in-out 1s infinite',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
};

const isMobile = () => {
  return window.innerWidth <= 480;
};

export const chatPopupClosedViewInterworkyStyle = {
  position: 'fixed',
  width: isMobile() ? '30%' : '185px',
  height: isMobile() ? '30%' : '285px',
  backgroundColor: 'transparent',
  backgroundImage:
    'url("https://storage.googleapis.com/multisync/interworky/assets/images/carla-pp.png")',
  backgroundSize: 'contain',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
  cursor: 'pointer',
  zIndex: '999999',
  bottom: '100px',
  right: '10px',
};

export const chatPopupClosedViewBadgeStyle = {
  position: 'fixed',
  width: '50px',
  height: '180px',
  borderRadius: '8px 0 0 8px',
  backgroundColor: 'rgb(41, 86, 81)',
  cursor: 'pointer',
  zIndex: '999999',
  top: '50%',
  right: '0',
  transform: 'translateY(-50%)',
  boxShadow: '-2px 0 10px rgba(0, 0, 0, 0.2)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '10px',
  padding: '15px 5px',
  transition: 'all 0.3s ease',
};

export const badgeIconStyle = {
  fontSize: '20px',
  color: '#ffffff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '24px',
  height: '24px',
  cursor: 'pointer',
  transition: 'transform 0.2s ease',
};

export const badgeTextStyle = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#ffffff',
  writingMode: 'vertical-rl',
  textOrientation: 'mixed',
  letterSpacing: '1px',
  textTransform: 'uppercase',
  cursor: 'pointer',
  userSelect: 'none',
};

export const badgeVoiceIconStyle = {
  fontSize: '20px',
  color: '#ffffff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '24px',
  height: '24px',
  cursor: 'pointer',
  transition: 'transform 0.2s ease',
};

export const chatPopupHandStyle = {
  content: '"👋"', // Waving hand emoji
  position: 'absolute',
  top: '-10px', // Adjust position to appear on top of the button
  left: '-20px',
  fontSize: '48px', // Size of the hand emoji
  animation: 'wave 2s infinite', // Apply the waving animation
  backgroundColor: '#ffffff',
  backgroundPosition: 'center',
  boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
};

export const chatPopupOpenViewStyle = {
  position: 'fixed',
  bottom: '40px',
  right: '20px',
  width: '250px',
  height: '50px',
  backgroundColor: 'white',
  borderRadius: '10px',
  boxShadow:
    '0px 4px 15px rgba(0, 0, 0, 0.3), 0px 6px 20px rgba(0, 0, 0, 0.19)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: '10000',
};

export const xButtonStyle = {
  border: 'none',
  backgroundColor: 'transparent',
  cursor: 'pointer',
  padding: '1px',
  borderRadius: '50%',
  justifyContent: 'center',
  display: 'none',
  position: 'absolute',
  right: '0px',
  top: '25px',
  transform: 'translateY(-50%)',
  zIndex: '1000',
};

export const poweredByContainerStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '12px',
  color: '#000000',
  padding: '12px 16px',
  width: '100%',
  zIndex: '999999',
  marginTop: '5px',
};

export const poweredByTextStyle = {
  marginRight: '10px',
};

export const poweredByInterworkyLogoStyle = {
  width: '100px', // Adjust the width of the logo
  height: 'auto', // Maintain aspect ratio of the logo
  marginLeft: '2px',
  marginRight: '28px',
  animation: 'shine 2s infinite ease-in-out', // Add animation
  cursor: 'pointer',
};
export const assistantMessageStyle = {
  position: 'relative',
  alignSelf: 'flex-start',
  display: 'flex', // Use inline-block for flexible width and height adjustment based on content
  flexDirection: 'column',
  alignItems: 'center',
  padding: '10px',
  width: 'fit-content',
  maxWidth: '90%', // Keep the max-width to avoid overflow
  wordWrap: 'break-word', // Ensure long words break correctly within the container
  boxShadow: '0px 4px 15px rgba(0, 0, 0, 0.15)',
  margin: '10px 0px',
  color: '#000000',
  lineHeight: '1.4', // Ensure better vertical spacing between lines of text
  borderRadius: ' 0px 10px 10px',
  fontFamily: 'Arial, sans-serif !important',
  fontSize: '14px',
};

export const messagesTextStyle = {
  fontSize: '14px',
};

export const iconsContainerStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '5px',
  width: 'stretch',
  height: '20px',
  position: 'absolute',
  bottom: '-15px',
  right: '0',
};

export const textToSpeechIconStyle = {
  width: '24px',
  height: '24px',
  border: 'none',
  backgroundColor: 'transparent',
  cursor: 'pointer',
  borderRadius: '50%',
  zIndex: '10',
};

export const assistantIconStyle = {
  width: '31px',
  height: '31px',
  borderRadius: '50%',
  backgroundColor: '#ffffff',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  top: '-15px',
  left: '-35px',
  boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
  border: '2px solid #ffffff',
};

export const userMessageStyle = {
  alignSelf: 'flex-end',
  color: '#000000',
  padding: '12px',
  borderRadius: '10px 0px 10px 10px', // Reduced the border-radius for more natural scaling
  width: 'fit-content',
  maxWidth: '90%', // Keep the max-width to avoid overflow
  height: 'fit-content',
  wordBreak: 'break-word',
  overflowWrap: 'break-word',
  margin: '10px 0',
  display: 'block',
  alignItems: 'center',
  lineHeight: '1.4', // Ensure better vertical spacing between lines of text
  whiteSpace: 'pre-wrap', // Allow the text to wrap and handle newlines
  fontFamily: 'Arial, sans-serif !important',
  fontSize: '14px !important',
};

// Updated styles for the input container and submit button
export const inputContainerStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: '#ffffff',
  borderRadius: '10px', // Use a rounded corner similar to input fields
  boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.1)', // Soften the shadow for a smoother look
  maxHeight: '80px',
  padding: '5px 10px', // Adjust padding for a sleek look
  zIndex: '1000',
  color: '#000000',
  margin: '10px',
};
export const inputVoiceWrapperStyle = {
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
};

export const inputFieldStyle = {
  cursor: 'not-allowed',
  border: 'none', // Remove the border to blend with the container
  outline: 'none',
  flexGrow: 1,
  backgroundColor: '#ffffff',
  resize: 'none', // Disable manual resizing by the user
  minHeight: '20px', // Set a minimum height to look like an input field
  maxHeight: '70px', // Limit the height for multiline input
  overflowY: 'auto', // Enable auto-scroll for excess content
  lineHeight: '1.4', // Adjust line height for better readability
  textAlign: 'left',
  boxShadow: 'none', // Remove inner shadow to maintain input-like simplicity
  fontFamily: 'Arial, sans-serif !important',
  fontSize: '16px',
  margin: '0 5px',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  color: 'black',

  '&::-webkit-input-placeholder': {
    textAlign: 'center',
  },
  '&::-moz-placeholder': {
    /* Firefox 18- */
    textAlign: 'center',
  },
  '&::-moz-placeholder': {
    /* Firefox 19+ */
    textAlign: 'center',
  },
  '&:-ms-input-placeholder': {
    textAlign: 'center',
  },

  // Beautiful thin scrollbar styles
  '&::-webkit-scrollbar': {
    width: '4px',
  },
  '&::-webkit-scrollbar-track': {
    background: 'transparent',
    borderRadius: '2px',
  },
  '&::-webkit-scrollbar-thumb': {
    background: getAssistantInfo.primary_color,
    borderRadius: '2px',
  },
  '&::-webkit-scrollbar-thumb:hover': {
    background: getAssistantInfo.primary_color,
  },

  // Firefox scrollbar
  scrollbarWidth: 'thin',
  scrollbarColor: getAssistantInfo.primary_color,
};

export const submitButtonStyle = {
  cursor: 'not-allowed',
  borderRadius: '50%',
  border: 'none',
  backgroundColor: 'transparent',
  padding: '1px',
  borderRadius: '50%',
  display: 'flex',
  justifyContent: 'center',
};

export const micButtonStyle = {
  border: 'none',
  backgroundColor: 'transparent',
  cursor: 'pointer',
  padding: '1px',
  borderRadius: '50%',
  display: 'flex',
  justifyContent: 'center',
};
export const chatLogStyles = {
  overflowY: 'auto',
  maxHeight: '200px', // Adjust as needed
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: 'rgba(0, 1, 0, 1)', // Optional styling
  color: 'FFA07A', // Text color
  padding: '10px',
  boxSizing: 'border-box',
  marginTop: '10px', // Space between modes and chat log
};

// Tooltip style remains the same
export const tooltipStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  transform: 'translateX(-50%)',
  backgroundColor: '#ff6666',
  color: '#ffffff',
  padding: '5px 10px',
  borderRadius: '5px',
  fontSize: '14px',
  visibility: 'hidden',
};

export const popupVoiceNoticeStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '20px',
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  boxShadow: '0 4px 30px #D9D9D9',
  width: 'fit-content',
  maxWidth: '300px',
  position: 'relative',
  marginBottom: '20px auto', // Center horizontally
};

export const popupNoticeStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '20px',
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  boxShadow: '0px 4px 15px rgba(0, 0, 0, 0.1)',
  width: '100%',
  maxWidth: '400px',
  border: '1px solid #058a7c',
  position: 'relative',
  margin: '20px auto', // Center horizontally
};

export const infoIconStyle = {
  backgroundColor: '#fff',
  width: '50px',
  height: '50px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#000',
  fontSize: '24px',
  marginRight: '15px',
};

export const infoVoiceIconStyle = {
  backgroundColor: '#fff',
  width: '50px',
  height: '50px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#000',
  fontSize: '24px',
  marginRight: '15px',
};

export const noticeTextStyle = {
  flex: '1',
  color: '#000',
  fontSize: '14px',
  lineHeight: '1.5',
  marginRight: '15px',
};

export const voiceNoticeTextStyle = {
  flex: '1',
  color: '#000',
  fontSize: '14px',
  lineHeight: '1.5',
  marginRight: '15px',
  textAlign: 'center',
  maxHeight: '200px',
  overflowY: 'auto',
};

export const privacyLinkStyle = {
  color: '#058a7c',
  textDecoration: 'underline',
  fontSize: '14px',
};

export const multipleOptionPopupStyle = {
  position: 'fixed',
  bottom: '0',
  left: '0',
  backgroundColor: '#ffffff',
  borderRadius: '20px 20px 0 0',
  boxShadow:
    '0px 4px 15px rgba(0, 0, 0, 0.3), 0px 6px 20px rgba(0, 0, 0, 0.19)',
  padding: '20px',
  display: 'inline-block', // Inline-block allows the container to fit the content
  maxWidth: '100%', // Prevent overflow for extremely long text
  width: 'auto', // Automatically adjust the width based on content
  wordWrap: 'break-word', // Ensure long text wraps within the popup
};

export const optionStyle = {
  display: 'inline-flex', // Use inline-flex for horizontal scaling
  alignItems: 'center',
  padding: '12px 16px',
  cursor: 'pointer',
  borderBottom: '1px solid #ccc',
  width: 'auto', // Width adjusts based on the content
  maxWidth: '100%', // Prevent overflow
  gap: '10px',
  verticalAlign: 'middle',
  lineHeight: 1,
};

export const iconStyle = {
  marginRight: '15px',
  backgroundColor: '#fffff',
};

export const optionTextStyle = {
  fontSize: '14px',
  color: '#000000',
  fontWeight: '500',
};

export const iconsRowContainerStyle = {
  display: 'flex',
  justifyContent: 'center',
  gap: '12px',
  marginTop: '6px',
};
export const iconContainerStyle = {
  display: 'flex',
  justifyContent: 'center',
  flexDirection: 'row',
  alignItems: 'center',
  gap: '10px',
  padding: '0px 10px',
  borderRadius: '8px',
  boxShadow: '0 1px 2px rgba(0,0,0,0.5)',
  width: '80px',
  height: '30px',
  cursor: 'pointer',
};

export const iconButtonStyle = {
  width: '30px',
  height: '30px',
  cursor: 'pointer',
  border: 'none',
  background: '#ffffff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'background 0.2s, box-shadow 0.2s',
  borderRadius: '20%',
};

export const iconLabelStyle = {
  fontSize: '14px',
  fontWeight: '500',
  color: '#262B28',
};

// Calendar container style
export const calendarContainerStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(7, 1fr)',
  gridGap: '5px',
  padding: '20px',
  backgroundColor: '#ffffff',
  borderRadius: '10px',
  boxShadow: '0px 4px 15px rgba(0, 0, 0, 0.1)',
  textAlign: 'center',
  marginTop: '10px',
};

// Calendar header style (month and year)
export const calendarHeaderStyle = {
  gridColumn: 'span 7',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontSize: '14px',
  marginBottom: '10px',
  fontWeight: 'bold',
};

// Navigation button styles
export const calendarNavigationButtonStyle = {
  cursor: 'pointer',
  border: 'none',
  fontSize: '14px',
  outline: 'none',
  background: 'transparent',
  color: 'white',
};

// Days of the week header style
export const calendarDaysStyle = {
  gridColumn: 'span 7',
  display: 'grid',
  gridTemplateColumns: 'repeat(7, 1fr)',
  textAlign: 'center',
  fontWeight: 'bold',
  mixBlendMode: 'difference',
};

// Individual date button style
export const calendarDateStyle = {
  padding: '10px',
  borderRadius: '10px',
  cursor: 'pointer',
  userSelect: 'none',
  fontSize: '14px',
  color: '#FFFFFF',
  border: '1px solid transparent',
  transition: 'background-color 0.3s ease',
  mixBlendMode: 'difference',
};

export const calendarTipTextContainerStyle = {
  width: '100%',
  textAlign: 'center',
  marginBottom: '10px',
};

export const wrapperStyle = {
  display: 'flex',
  flexDirection: 'column', // Stack title and options vertically
  alignItems: 'center',
  gap: '10px', // Spacing between title and time options
  marginBottom: '20px',
};

export const timeOptionsContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  marginTop: '10px',
  gap: '10px',
};

export const timeOptionStyle = {
  padding: '10px',
  backgroundColor: '#f5f5f5',
  borderRadius: '10px',
  cursor: 'pointer',
  textAlign: 'center',
  fontSize: '14px',
  color: '#000',
  boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1)',
};
export const assistantContainerStyle = {
  position: 'fixed', // Fix to the screen
  right: '10px', // Align to the right of the screen
  width: '0px', // Set a width for the chat container on larger screens
  height: '0px', // Adjust the height to leave space for the popup button
  overflowY: 'hidden', // Enable vertical scrolling
  display: 'flex', // Use flexbox for layout
  flexDirection: 'column', // Stack messages vertically
  boxSizing: 'border-box', // Include padding in the element's size
  zIndex: '999999',
  boxSizing: 'border-box', // Include padding in the element's size
  borderRadius: '10px',
  transformOrigin: 'bottom right',

  // Transition
  transition: 'all 0.3s ease-in-out',
  WebkitTransition: 'all 0.3s ease-in-out', // Safari support
  MozTransition: 'all 0.3s ease-in-out', // Firefox support
  OTransition: 'all 0.3s ease-in-out', // Opera support

  // Specific property transitions
  transform: 'translateY(0)',

  // Ensure smooth height/width changes
  transitionProperty:
    'transform, background-color, box-shadow, border, height, width',
};
export const chatContainerStyle = {
  position: 'relative',
  width: '100%',
  height: 'calc(100% - 60px)',
  opacity: '1',
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  boxSizing: 'border-box',
  padding: '0 20px',

  // Transition
  transition: 'all 0.3s ease-in-out',
  WebkitTransition: 'all 0.3s ease-in-out',
  MozTransition: 'all 0.3s ease-in-out',
  OTransition: 'all 0.3s ease-in-out',

  // Transform
  transform: 'translateY(0)',

  transitionProperty:
    'transform, background, box-shadow, border, height, width, backdrop-filter',
};
export const headerStyle = {
  top: '0',
  left: '0',
  width: 'stretch',
  height: '60px',
  padding: '0 16px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '15px',
  // backgroundColor: '#fff',
};

export const disclaimerIconStyle = {
  marginLeft: 'auto',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
};

export const liveIndicatorStyle = {
  width: '7px',
  height: '7px',
  borderRadius: '50%',
  backgroundColor: 'green',
  position: 'absolute',
  top: '33px',
  left: '43px',
  boxShadow: '0 0 8px rgba(0, 255, 0, 0.6)',
  border: '2px solid white',
  zIndex: 100,
};

export const assistantInfoStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
};
export const disclaimerModalStyle = {
  display: 'none', // Initially hidden
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '95%',
  maxWidth: '350px',
  padding: '20px',
  backgroundColor: 'rgba(255, 255, 255, 0.95)',
  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
  borderRadius: '12px',
  zIndex: 600, // Higher than the blur overlay
  border: '1px solid rgba(255, 255, 255, 0.5)',
};
export const disclaimerTextStyle = {
  color: '#333',
  fontSize: '14px',
  marginBottom: '20px',
  lineHeight: '1.5',
};

export const disclaimerCloseBtnStyle = {
  padding: '10px 20px',
  backgroundColor: '#058A7C',
  color: '#fff',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer',
  fontSize: '14px',
};

export const assistantNameStyle = {
  textTransform: 'capitalize',
  padding: '0',
  margin: '0',
  fontSize: '14px',
};

export const globalScrollbarStyle = {
  // Firefox scrollbar
  scrollbarColor: getAssistantInfo.primary_color,
  scrollbarWidth: 'thin',
  scrollbarGutter: 'stable',
  // WebKit scrollbar
  '&::-webkit-scrollbar': {
    width: '10px',
    height: '10px',
  },

  '&::-webkit-scrollbar-track': {
    background: '#f1f1f1',
    borderRadius: '4px',
  },

  '&::-webkit-scrollbar-thumb': {
    background: '#058A7C',
    borderRadius: '4px',
  },

  '&::-webkit-scrollbar-thumb:hover': {
    background: '#046b5f',
  },
};

export const fullScreenChatContainerStyle = {
  position: 'fixed', // Fix to the screen
  top: '0', // Align to the top of the screen
  left: '0', // Align to the left of the screen
  width: '100vw', // Full viewport width
  height: '100vh', // Full viewport height
  overflowY: 'scroll', // Enable vertical scrolling
  display: 'flex', // Use flexbox for layout
  flexDirection: 'column', // Stack messages vertically
  alignItems: 'center', // Center align all items/messages
  padding: '20px', // Add padding around the container
  boxSizing: 'border-box', // Include padding in the element's size
  background: 'rgba(255, 255, 255, 0.8)', // Semi-transparent background for a frosted-glass effect
  backdropFilter: 'blur(10px)', // Apply a blur effect for a more dramatic look
  borderRadius: '0px', // No rounded corners for full-screen effect
  boxShadow: '0 1px 1px rgba(0, 0, 0, 0.1)', // Subtle shadow for depth
  zIndex: '9990', // High z-index to ensure it sits on top of other elements
};

// Style for the loading animation (Element 1, Option 2)
export const loadingAnimationStyles = {
  width: '0%',
  height: '4px',
  // background: 'linear-gradient(90deg, #ff0080, #ff8c00, #40e0d0)',
  backgroundSize: '200% 200%',
  animation: 'loadingAnimation 2s infinite',
  marginTop: '20px',
  borderRadius: '2px',
};

// Style for the full-screen container
export const fullScreenContainerStyles = {
  position: 'fixed',
  bottom: '30px',
  right: isMobile() ? '' : '30px',
  width: '90%',
  maxWidth: isMobile() ? '' : '320px',
  height: '300px',
  zIndex: 100000,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px 16px',
  borderRadius: '16px',
  boxShadow: '0px 4px 15px rgba(0, 0, 0, 0.1)',
  border: '1px solid rgba(0, 0, 0, 0.05)',
  backgroundColor: 'rgba(245, 245, 245, 0.6)',
  backdropFilter: 'blur(8px) saturate(60%) brightness(120%)',
  left: isMobile() ? '50%' : '',
  transform: isMobile() ? 'translate(-50%, 0)' : '',
};

// Style for the close button
export const closeButtonStyles = {
  padding: '8px',
  backgroundColor: 'transparent',
  border: 'none',
  borderRadius: '50%',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

// Style for the visualizer or assistant image (Element 1, Option 1)
export const visualizerStyles = {
  width: '36px',
  height: '36px',
  backgroundSize: 'cover',
  borderRadius: '50%',
  backgroundColor: '#ffffff',
  backgroundPosition: 'center',
  boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
  marginRight: '10px',
};

// Style for the input field (Element 1, Option 3)
export const inputFieldStyles = {
  width: '80%',
  padding: '10px',
  fontSize: '1.2em',
  marginBottom: '10px',
};

// Style for the status text (Element 2)
export const statusTextStyles = {
  fontSize: '0.8em',
  textAlign: 'center',
  color: '#000000',
  padding: '4px 8px',
  borderRadius: '12px',
  fontWeight: '500',
  backgroundColor: '#f0f0f0',
  margin: '0px',
  flex: '1',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

// Style for the CTA buttons (Element 3)
export const ctaButtonStyles = {
  padding: '10px 20px',
  fontSize: '1.2em',
  backgroundColor: '#00ffcc',
  border: 'none',
  borderRadius: '5px',
  color: '#fff',
  cursor: 'pointer',
  margin: '10px',
};

// Style for the chat log button (Element 4)
export const chatLogButtonStyles = {
  position: 'absolute',
  bottom: '20px',
  right: '20px',
  padding: '10px',
  backgroundColor: '#007bff',
  border: 'none',
  borderRadius: '5px',
  color: '#fff',
  cursor: 'pointer',
};

// Style for the chat log popup (Element 5)
export const chatLogPopupStyles = {
  position: 'fixed',
  bottom: '0',
  left: '0',
  width: '100%',
  height: '66%',
  backgroundColor: 'white',
  borderRadius: '20px 20px 0 0',
  zIndex: '10000',
  boxShadow: '0px 4px 15px rgba(0, 0, 0, 0.3)',
  overflowY: 'auto',
  maxHeight: '90vh',
};

// Style for the conversation starter buttons (Element 6)
export const conversationStarterButtonStyles = {
  ...ctaButtonStyles,
  backgroundColor: '#6c757d',
};

export const voiceMessageContainerStyles = {
  fontSize: '1.5em',
  fontWeight: '600',
  textAlign: 'center',
  marginTop: '25px',
  color: '#fff',
  marginRight: '120px',
  marginLeft: '120px',
  maxHeight: '200px',
  padding: '15px',
  lineHeight: '1.5',
  letterSpacing: '0.02em',
  textShadow: '0 1px 2px rgba(0,0,0,0.2)',
  transition: 'all 0.3s ease',
  borderRadius: '10px',
  backgroundColor: 'rgba(0,0,0,0.1)',
  backdropFilter: 'blur(5px)',
  overflowY: 'auto',
  '&::-webkit-scrollbar': {
    width: '8px',
    background: 'transparent',
  },
  '&::-webkit-scrollbar-track': {
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '10px',
    margin: '5px',
  },
  '&::-webkit-scrollbar-thumb': {
    background: 'linear-gradient(45deg, #058a7c, #0fb5a5)',
    borderRadius: '10px',
    border: '2px solid transparent',
    backgroundClip: 'content-box',
  },
  '&::-webkit-scrollbar-thumb:hover': {
    background: 'linear-gradient(45deg, #0fb5a5, #058a7c)',
  },
  scrollbarWidth: 'thin',
  scrollbarColor: '#058a7c transparent',
};

export const voiceMessageTextStyles = {
  display: 'inline-block',
  minWidth: '350px',
  height: 'fit-content',
  animation: 'sentenceGlow 2.5s ease-in-out infinite',
  padding: '12px 20px',
  borderRadius: '8px',
  background:
    'linear-gradient(45deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
  backdropFilter: 'blur(8px)',
  boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
  transform: 'translateZ(0)',
  willChange: 'transform',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  fontSmoothing: 'antialiased',
  textRendering: 'optimizeLegibility',
};

export const assistantVoiceMessageCharStyles = {
  display: 'inline-block',
  animation: 'rainbowLetterTrail 1s ease-in-out forwards',
};

export const userVoiceMessageCharStyles = {
  display: 'inline-block',
  animation: 'rainbowLetterTrail 2s ease-in-out backwards',
};
export const muteButtonStyles = {
  fontSize: '1em',
  padding: '6px',
  cursor: 'pointer',
  borderRadius: '50%',
  border: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: 'rgba(0, 0, 0, 0.1) 0px 2px 4px',
  backgroundColor: 'white',
};
export const assistantImagestyle = {
  width: '50px',
  height: '50px',
  borderRadius: '50%',
  marginRight: '15px',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  border: '2px solid rgba(255, 255, 255, 0.5)',
  objectFit: 'cover',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

export const minimizeButtonStyles = {
  position: 'fixed',
  top: '5px',
  right: '25px',
  padding: '6px',
  backgroundColor: 'white',
  borderRadius: '50%',
  boxShadow: 'rgba(0, 0, 0, 0.1) 0px 2px 8px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  zIndex: '10001',
  color: '#333',
};
export const minimizedContainerStyle = {
  position: 'fixed',
  bottom: '20px',
  right: '20px',
  height: '80px',
  backgroundColor: '#058a7c',
  borderRadius: '40px',
  display: 'flex',
  alignItems: 'center',
  padding: '0 20px',
  boxShadow: 'rgba(0, 0, 0, 0.2) 0px 4px 12px',
  zIndex: '10000',
  border: '3px solid rgba(255, 255, 255, 0.3)',
};
export const minimizedInfoTextStyle = {
  flex: '1',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'white',
  gap: '10px',
};
export const statusContainerstyle = {
  display: 'flex',
  alignItems: 'center',
  backgroundColor: 'rgba(255, 255, 255, 0.9)',
  borderRadius: '20px',
  padding: '5px 15px',
  color: '#333',
  fontSize: '14px',
  fontWeight: '500',
};

export const closeButtonVoiceMode = {
  fontSize: '1em',
  padding: '6px',
  cursor: 'pointer',
  borderRadius: '50%',
  border: 'none',
  backgroundColor: 'transparent',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};
export const phoneInputDivStyle = {
  display: 'flex',
  alignItems: 'center',
  width: '100%',
};

export const countrySelectStyle = {
  padding: '8px',
  paddingLeft: '35px',
  border: 'none',
  outline: 'none',
  appearance: 'none',
  width: '101%',
  backgroundColor: 'transparent',
};
export const flagImgStyle = {
  position: 'absolute',
  left: '8px',
  top: '50%',
  transform: 'translateY(-50%)',
  width: '20px',
  height: '15px',
  objectFit: 'cover',
};
export const phoneInputStyle = {
  flex: '1',
  border: 'none',
  outline: 'none',
  backgroundColor: 'transparent',
};
export const countryOptionStyle = {
  padding: '8px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
};

export const optionFlagStyle = {
  width: '20px',
  height: '14px',
  objectFit: 'cover',
};
export const dropdownContainerStyle = {
  position: 'absolute',
  bottom: '100%',
  left: '0',
  width: '240px',
  maxHeight: '267px',
  overflowY: 'auto',
  backgroundColor: '#fff',
  borderRadius: '4px',
  zIndex: '1000',
  display: 'none',
};
export const selectContainerStyle = {
  position: 'relative',
  minWidth: '120px',
  cursor: 'pointer',
};

export const flagContainerStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-evenly',
  gap: '8px',
  padding: '8px',
  cursor: 'pointer',
};

export const AssistantContainerStyle = {
  position: 'fixed',
  right: '10px',
  width: '0',
  height: '0',
  opacity: '0',
};

export const bubbleContainerStyle = {
  position: 'fixed',
  bottom: isMobile() ? '100px' : '50px',
  zIndex: 999999,
  width: '250px',
};

export const bubbleStyle = {
  position: 'fixed',
  display: 'flex',
  alignItems: 'flex-start',

  borderRadius: '16px',
  padding: '12px 16px',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
  maxWidth: '250px',
  position: 'relative',
  backdropFilter: 'blur(10px)',
  top: '127px',
  right: '-120px',
  maxHeight: '140px',
  transition: 'all 0.3s ease',
  overflow: 'hidden',
};

export const notificationBadgeStyle = {
  position: 'absolute',
  top: '0px',
  right: '-10px',
  backgroundColor: '#ef4444',
  color: 'white',
  fontSize: '12px',
  fontWeight: 'bold',
  borderRadius: '50%',
  width: '24px',
  height: '24px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: '10',
  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
};

export const phoneBtnStyle = {
  position: 'absolute',
  top: '-5px',
  right: '-20px',
  width: '40px',
  height: '40px',
  borderRadius: '50%',
  border: 'none',
  backgroundColor: 'rgba(86, 92, 90, 0.13)',
  color: 'white',
  fontSize: '16px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backdropFilter: 'blur(4px)',
  transition: 'all 0.2s ease',
  fontSize: '20px',
  transform: 'scaleX(-1)',
};

export const teaserStatmentTitleStyle = {
  fontSize: '14px',
  fontWeight: '500',
  margin: '0',
};

export const pulsingDotStyle = {
  width: '8px',
  height: '8px',
  backgroundColor: '#f00', // Red by default
  borderRadius: '50%',
  display: 'inline-block',
  marginRight: '5px',
  marginLeft: '5px',
  animation: 'pulse 1.5s infinite',
};

export const thinkingDotsContainerStyle = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  height: '40px',
};

export const assistantThinkingDotStyle = {
  width: '10px',
  height: '10px',
  borderRadius: '50%',
  margin: '0 5px',
};

export const startConversationButtonStyle = {
  color: '#666',
  fontSize: '1rem',
  padding: '8px 16px',
  border: 'none',
  background: 'transparent',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  fontStyle: 'italic',
  opacity: 0.8,
  cursor: 'default',
};

export const sendReportButtonStyle = {
  padding: '9px 24px',
  background: 'white',
  border: 'none',
  borderRadius: '10px',
  fontSize: '14px',
  cursor: 'pointer',
  boxShadow: '0 0 2px 0 #E22E15',
  color: '#E22E15',
  transition: 'all 0.3s ease',
  ':hover': {
    background: '#E22E15',
    color: 'white',
  },
};

export const menuDotsStyle = {
  cursor: 'pointer',
  marginLeft: 'auto',
  padding: '13px 6px',
  display: 'flex',
  gap: '3px',
  alignItems: 'center',
  borderRadius: '50%',
  justifyContent: 'center',
  position: 'relative',
};

export const reportPopupStyle = {
  display: 'none',
  position: 'absolute',
  right: '18px',
  top: '37px',
  background: 'white',
  padding: '10px 15px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  borderRadius: '10px 0px 10px 10px',
  zIndex: 1000,
  minWidth: '70px',
};

export const reportButtonStyle = {
  padding: '12px 16px',
  cursor: 'pointer',
  border: 'none',
  backgroundColor: 'white',
  color: '#333',
  width: '100%',
  textAlign: 'left',
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  borderBottom: '1px solid #eaeaea',
  transition: 'all 0.2s ease',
  fontSize: '16px',
};
export const reportCloseButtonStyle = {
  border: 'none',
  background: 'none',
  cursor: 'pointer',
  padding: '0',
  fontSize: '18px',
  color: '#666',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '24px',
  height: '24px',
  position: 'absolute',
  top: '25px',
  right: '25px',
};

export const reportTextareaStyle = {
  width: 'calc(100% - 84px)',
  margin: '0 24px',
  padding: '16px',
  minHeight: '120px',
  border: '1px solid #D9D9D9',
  borderRadius: '12px',
  resize: 'none',
  outline: 'none',
  color: '#000',
  fontSize: '14px',
};
export const overlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  backgroundColor: 'rgba(184, 184, 184, 0.05)',
  backdropFilter: 'blur(3px)',
  display: 'none',
  zIndex: 9998,
};
export const reportFormStyle = {
  display: 'none',
  position: 'fixed',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '100%',
  maxWidth: '600px',
  background: 'white',
  borderRadius: '12px',
  boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
  zIndex: 999999,
};
export const alertBoxStyle = {
  position: 'fixed',
  top: '10%',
  left: '50%',
  transform: 'translateX(-50%)',
  background: '#00897b',
  color: 'white',
  padding: '12px 20px',
  borderRadius: '8px',
  boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)',
  zIndex: 10000,
  textAlign: 'center',
  fontSize: '14px',
  opacity: '0',
  transition: 'opacity 0.3s ease-in-out',
};

export const alertButtonStyle = {
  marginTop: '12px',
  padding: '8px 16px',
  background: '#00897b',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '14px',
};

export const blurOverlayStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  MozBackdropFilter: 'blur(10px)',
  OBackdropFilter: 'blur(10px)',
  msBackdropFilter: 'blur(10px)',
  zIndex: 500,
  display: 'none',
  borderRadius: '10px', // Match the assistant container border radius
};

export const reactionButtonStyle = {
  cursor: 'pointer',
  background: 'none',
  border: 'none',
  padding: '4px',
  fontSize: '14px',
  opacity: '0.7',
  transition: 'opacity 0.2s',
  border: '2px solid #666',
  borderRadius: '8px', // fully rounded
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: '10px',
};

export const reactionContainerStyle = {
  display: 'flex',
  gap: '8px',
  marginTop: '8px',
  justifyContent: 'flex-end',
};

export const receiptStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  fontSize: '12px',
  color: '#6b7280',
  marginTop: '4px',
  opacity: '0',
  transform: 'translateY(-5px)',
  transition: 'opacity 0.3s ease, transform 0.3s ease',
  position: 'absolute',
  bottom: '-20px',
  right: '8px',
  width: '33px',
  whiteSpace: 'nowrap',
};
export const assistantIdentityStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '15px',
};

export const transcribedMessageContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '10px',
  zIndex: '1000',
};

export const cancelButtonStyle = {
  backgroundColor: '#f44336',
  color: 'white',
  padding: '8px 16px',
  borderRadius: '20px',
  cursor: 'pointer',
  border: 'none',
  fontSize: '14px',
  display: 'flex',
  alignItems: 'center',
  gap: '5px',
};

export const transcribedMessageStyle = {
  textShadow: '0px 0px 10px rgba(0, 0, 0, 0.5)',
  textAlign: 'center',
  padding: '0 20px',
};

export const transcribedMessageTimerStyle = {
  color: '#666',
  fontSize: '14px',
  marginTop: '5px',
  textAlign: 'center',
};
export const inputWrapperStyle = {
  display: 'flex',
  flexDirection: 'column',
};

export const headerButtonStyle = {
  display: 'flex',
  alignItems: 'center',
  height: '100%',
  gap: '10px',
};

export const cursorStyle = {
  display: 'inline-block',
  width: '2px',
  height: '16px',
  backgroundColor: 'currentColor',
  marginLeft: '2px',
  verticalAlign: 'middle',
};

export const typingTextStyle = {
  opacity: '0',
  transition: 'opacity 0.2s ease-in-out',
};

export const statusIndicatorStyle = {
  textAlign: 'center',
  margin: '10px 0',
  fontSize: '14px',
  fontWeight: 'bold',
  color: isDarkTheme ? '#333' : '#FFF',
  padding: '4px 12px',
  borderRadius: '8px',

  width: 'fit-content',
  alignSelf: 'center',
  marginLeft: 'auto',
  marginRight: 'auto',
};

export const textChatModeStyle = {
  padding: '12px 20px',
  margin: '10px auto',
  backgroundColor: '#f5f5f5',
  borderRadius: '12px',
  color: '#000',
};

export const controlsContainerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  width: '100%',
};

export const indicatorsStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  width: '100%',
  gap: '20px',
};

// Social proof indicator styles
export const onlineIndicatorStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  fontSize: '10px',
  backgroundColor: 'rgba(34, 197, 94, 0.2)',
  padding: '2px 8px',
  borderRadius: '10px',
  marginBottom: '4px',
  width: 'fit-content',
};

export const onlineDotStyle = {
  width: '6px',
  height: '6px',
  backgroundColor: '#22c55e',
  borderRadius: '50%',
  animation: 'onlinePulse 2s infinite ease-in-out',
};

export const responseTimeBadgeStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '3px',
  fontSize: '9px',
  marginTop: '2px',
  marginBottom: '4px',
};

export const typingIndicatorStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '3px',
  padding: '4px 8px',
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  borderRadius: '10px',
  marginTop: '4px',
};

export const typingDotStyle = {
  width: '5px',
  height: '5px',
  backgroundColor: 'rgba(255, 255, 255, 0.8)',
  borderRadius: '50%',
};

export const rotatingMessageStyle = {
  fontSize: '13px',
  fontWeight: '500',
  margin: '0',
  lineHeight: '1.3',
};
