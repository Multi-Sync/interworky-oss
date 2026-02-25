import { detectDarkTheme } from '../../../styles/themeManager';
import { appendChild, createElement } from '../baseMethods';

export const createPoweredByContent = (container) => {
  const isDarkTheme = detectDarkTheme();
  const poweredByText = createElement(
    'span',
    {
      whiteSpace: 'nowrap',
      fontSize: '10px',
      color: isDarkTheme ? '#333' : '#FFF',
    },
    {
      innerText: 'Powered by ',
    }
  );

  const interworkyLogo = createElement(
    'span',
    {
      color: '#058A7C',
      textDecoration: 'underline',
      fontSize: '10px',
      cursor: 'pointer',
    },
    {
      innerText: 'Interworky',
    }
  );

  interworkyLogo.addEventListener('click', () => {
    window.open('https://interworky.com', '_blank');
  });

  const poweredByContainer = createElement(
    'div',
    {
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
    },
    {}
  );

  appendChild(poweredByContainer, poweredByText);
  appendChild(poweredByContainer, interworkyLogo);

  appendChild(container, poweredByContainer);
};
