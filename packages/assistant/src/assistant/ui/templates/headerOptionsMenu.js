import {
  disclaimerSVG,
  optionsIconSVG,
  svgInfoIcon,
} from '../../../styles/icons';
import {
  menuDotsStyle,
  overlayStyle,
  reportPopupStyle,
} from '../../../styles/styles';
import { createElement, appendChild } from '../baseMethods';
import { showDisclaimerModal } from './disclaimerInfo';
import { createReportForm } from './reportForm';

export const headerOptionsMenu = () => {
  const reportContainer = createElement('div', {
    position: 'relative',
  });

  const overlay = createElement('div', overlayStyle);

  const menuDots = createElement('div', menuDotsStyle, {
    id: 'menu-dots',
    innerHTML: optionsIconSVG,
  });

  // Updated report popup with liquid glass styling
  const reportPopup = createElement(
    'div',
    {
      ...reportPopupStyle,
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      border: '1px solid rgba(255, 255, 255, 0.3)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
      borderRadius: '12px',
      padding: '8px',
    },
    {
      id: 'report-popup',
    }
  );

  // Sleek button style with liquid glass effects
  const createSleekButton = (icon, text, onClick) => {
    const button = createElement(
      'button',
      {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '12px 16px',
        backgroundColor: 'rgba(255, 255, 255, 0.6)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.4)',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '500',
        color: '#2c3e50',
        transition: 'all 0.2s ease',
        width: '100%',
        textAlign: 'left',
        marginBottom: '4px',
      },
      {
        innerHTML: `${icon}${text}`,
        onclick: onClick,
      }
    );

    // Add hover effects
    button.addEventListener('mouseenter', () => {
      button.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
      button.style.transform = 'translateY(-1px)';
      button.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
      button.style.borderColor = 'rgba(52, 152, 219, 0.4)';
    });

    button.addEventListener('mouseleave', () => {
      button.style.backgroundColor = 'rgba(255, 255, 255, 0.6)';
      button.style.transform = 'translateY(0)';
      button.style.boxShadow = 'none';
      button.style.borderColor = 'rgba(255, 255, 255, 0.4)';
    });

    return button;
  };

  const togglePopup = () => {
    reportPopup.style.display =
      reportPopup.style.display === 'none' ? 'block' : 'none';
  };

  const closePopup = () => {
    reportPopup.style.display = 'none';
  };

  // Event handlers
  menuDots.onclick = togglePopup;

  // Create report form
  const { reportForm, showReportForm } = createReportForm(overlay, closePopup);

  // Create sleek buttons
  const reportButton = createSleekButton(svgInfoIcon, 'Report', () =>
    showReportForm()
  );

  const disclaimerButton = createSleekButton(
    disclaimerSVG,
    'Disclaimer',
    () => {
      showDisclaimerModal();
      reportPopup.style.display = 'none';
    }
  );

  // Close form when clicking outside
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      reportForm.style.display = 'none';
      overlay.style.display = 'none';
    }
  });

  // Append elements
  appendChild(reportPopup, reportButton);
  appendChild(reportPopup, disclaimerButton);
  appendChild(reportContainer, menuDots);
  appendChild(reportContainer, reportPopup);
  appendChild(reportContainer, reportForm);
  appendChild(reportContainer, overlay);

  return reportContainer;
};
