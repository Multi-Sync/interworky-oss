import { appendChild, createElement } from '../baseMethods';
import { detectDarkTheme } from '../../../styles/themeManager';

export function renderReadyMode(container) {
  const isDarkTheme = detectDarkTheme();
  let noticeText =
    'By using our AI service, you agree to our <a href="https://interworky.com/terms" target="_blank" rel="noopener noreferrer">Terms of Service</a> and <a href="https://interworky.com/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>. Please review them to understand how we handle your data and generated content.';
  const notice = createElement(
    'p',
    {
      height: '300px',
      overflowY: 'auto',
      textAlign: 'center',
      margin: '40px',
      color: isDarkTheme ? '#333' : '#FFF',
    },
    {
      innerHTML: noticeText,
    }
  );

  appendChild(container, notice);
}
