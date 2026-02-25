import {
  alertBoxStyle,
  reportCloseButtonStyle,
  reportFormStyle,
  reportTextareaStyle,
  sendReportButtonStyle,
} from '../../../styles/styles';
import { sendReport } from '../../../utils/api/sendReportApi';
import { createElement, appendChild } from '../baseMethods';
import { getAssistantInfo } from '../../utils/state';
import ariaUtils from '../../../utils/aria';

export const createReportForm = (overlay, closePopup) => {
  // Report form with liquid glass styling matching disclaimer
  const reportForm = createElement(
    'div',
    {
      ...reportFormStyle,
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      backdropFilter: 'blur(25px) saturate(180%)',
      WebkitBackdropFilter: 'blur(25px) saturate(180%)',
      border: '1px solid rgba(255, 255, 255, 0.4)',
      boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
      borderRadius: '16px',
      padding: '0',
      maxWidth: '400px',
    },
    {
      id: 'report-form',
    }
  );

  // Add ARIA attributes for form dialog
  ariaUtils.setAttributes(reportForm, {
    role: 'dialog',
    'aria-labelledby': 'report-form-title',
    'aria-modal': 'true',
  });

  const assistantContainer = document.querySelector('#assistant-container');
  const assistantInfo = getAssistantInfo();

  // Header container for title and close button (matching disclaimer)
  const headerContainer = createElement('div', {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '24px 24px 16px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
  });

  const formTitle = createElement(
    'h2',
    {
      margin: '0',
      fontSize: '18px',
      fontWeight: '600',
      color: '#2c3e50',
      letterSpacing: '0.5px',
    },
    {
      innerText: 'Report an Issue',
      id: 'report-form-title',
    }
  );

  // Close button with glass styling (matching disclaimer)
  const closeButton = createElement(
    'button',
    {
      ...reportCloseButtonStyle,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.3)',
      borderRadius: '16px',
      transition: 'all 0.2s ease',
      color: '#2c3e50',
      fontSize: '18px',
    },
    {
      onclick: () => closeReportForm(),
      innerText: '×',
    }
  );

  // Add ARIA attributes for close button
  ariaUtils.setAttributes(closeButton, {
    'aria-label': 'Close report form',
    role: 'button',
  });

  // Add hover effect to close button (matching disclaimer)
  closeButton.addEventListener('mouseenter', () => {
    closeButton.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
    closeButton.style.transform = 'scale(1.05)';
  });
  closeButton.addEventListener('mouseleave', () => {
    closeButton.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
    closeButton.style.transform = 'scale(1)';
  });

  // Textarea with glass styling (matching disclaimer text area exactly)
  const textarea = createElement(
    'textarea',
    {
      ...reportTextareaStyle,
      padding: '20px 24px',
      margin: '0',
      fontSize: '14px',
      lineHeight: '1.6',
      color: '#34495e',
      backgroundColor: 'rgba(255, 255, 255, 0.4)',
      backdropFilter: 'blur(5px)',
      WebkitBackdropFilter: 'blur(5px)',
      borderRadius: '0',
      border: 'none',
      resize: 'none',
      minHeight: '120px',
      transition: 'all 0.2s ease',
    },
    {
      placeholder: 'Describe the issue you encountered...',
      id: 'report-textarea',
    }
  );

  // Add ARIA attributes for textarea
  ariaUtils.setAttributes(textarea, {
    'aria-label': 'Describe the issue you encountered',
    'aria-required': 'true',
    'aria-invalid': 'false',
  });

  // Add focus effect to textarea
  textarea.addEventListener('focus', () => {
    textarea.style.backgroundColor = 'rgba(255, 255, 255, 0.6)';
    textarea.style.outline = 'none';
  });
  textarea.addEventListener('blur', () => {
    textarea.style.backgroundColor = 'rgba(255, 255, 255, 0.4)';
  });

  // Button container with proper spacing
  const buttonContainer = createElement('div', {
    padding: '16px 24px 24px',
    textAlign: 'center',
    borderTop: '1px solid rgba(255, 255, 255, 0.2)',
  });

  // Submit button with primary color (matching chat header)
  const submitButton = createElement(
    'button',
    {
      ...sendReportButtonStyle,
      backgroundColor: assistantInfo?.primary_color || '#058A7C',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      border: 'none',
      borderRadius: '12px',
      padding: '14px 32px',
      fontSize: '16px',
      fontWeight: '600',
      color: assistantInfo?.text_primary_color || '#FFFFFF',
      transition: 'all 0.3s ease',
      width: '100%',
      cursor: 'pointer',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    },
    {
      innerText: 'Submit Report',
      onclick: async () => await submitReport(),
      type: 'submit',
    }
  );

  // Add ARIA attributes for submit button
  ariaUtils.setAttributes(submitButton, {
    'aria-label': 'Submit issue report',
    role: 'button',
  });

  // Add hover effect to submit button
  submitButton.addEventListener('mouseenter', () => {
    submitButton.style.transform = 'translateY(-2px)';
    submitButton.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.25)';
    submitButton.style.filter = 'brightness(1.1)';
  });
  submitButton.addEventListener('mouseleave', () => {
    submitButton.style.transform = 'translateY(0)';
    submitButton.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
    submitButton.style.filter = 'brightness(1)';
  });

  // Event handlers
  const showReportForm = () => {
    reportForm.style.display = 'block';
    overlay.style.display = 'block';
    if (closePopup) closePopup();
  };

  const closeReportForm = () => {
    reportForm.style.display = 'none';
    overlay.style.display = 'none';
    textarea.value = '';
  };

  const showCustomAlert = (message) => {
    const alertBox = createElement(
      'div',
      {
        ...alertBoxStyle,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(15px)',
        WebkitBackdropFilter: 'blur(15px)',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        borderRadius: '12px',
        color: '#2c3e50',
      },
      {
        innerText: message,
      }
    );

    assistantContainer.appendChild(alertBox);

    alertBox.style.opacity = '1';

    setTimeout(() => {
      alertBox.style.opacity = '0';
      assistantContainer.removeChild(alertBox);
    }, 3000);
  };

  const submitReport = async () => {
    if (textarea.value.trim() === '') {
      // Set invalid state with ARIA
      textarea.setAttribute('aria-invalid', 'true');
      textarea.style.border = '2px solid #e74c3c';

      // Create or update error message
      let errorMsg = document.getElementById('report-error');
      if (!errorMsg) {
        errorMsg = document.createElement('div');
        errorMsg.id = 'report-error';
        errorMsg.setAttribute('role', 'alert');
        errorMsg.style.color = '#e74c3c';
        errorMsg.style.fontSize = '12px';
        errorMsg.style.padding = '8px 24px';
        textarea.parentNode.insertBefore(errorMsg, textarea.nextSibling);
      }
      errorMsg.textContent = 'Please describe the issue before submitting.';
      textarea.setAttribute('aria-describedby', 'report-error');

      showCustomAlert('Please describe the issue before submitting.');
    } else {
      // Clear invalid state
      textarea.setAttribute('aria-invalid', 'false');
      textarea.style.border = 'none';
      const errorMsg = document.getElementById('report-error');
      if (errorMsg) errorMsg.remove();

      await sendReport(textarea.value);
      showCustomAlert('Report submitted successfully!');

      closeReportForm();
    }
  };

  // Append elements (matching disclaimer structure exactly)
  appendChild(headerContainer, formTitle);
  appendChild(headerContainer, closeButton);
  appendChild(buttonContainer, submitButton);
  appendChild(reportForm, headerContainer);
  appendChild(reportForm, textarea);
  appendChild(reportForm, buttonContainer);

  return {
    reportForm,
    showReportForm,
    closeReportForm,
  };
};
