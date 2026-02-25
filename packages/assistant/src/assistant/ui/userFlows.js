import { parsePhoneNumber } from 'awesome-phonenumber';
import { sendIconSVG } from '../../styles/icons';
import {
  convertToIsoTime,
  getUserCountry,
  splitFullName,
} from '../../utils/common';
import {
  createCalendarPicker,
  createTimePreferenceInput,
} from './appointments/utils';
import {
  createAssistantMessage,
  createInputField,
  createUserMessage,
} from './messages/builder';

import {
  countryOptionStyle,
  dropdownContainerStyle,
  flagContainerStyle,
  flagImgStyle,
  globalScrollbarStyle,
  phoneInputDivStyle,
  phoneInputStyle,
  selectContainerStyle,
  submitButtonStyle,
} from '../../styles/styles';
import { createAppointmentOnServer } from '../../utils/api/appointmentApi';
import {
  createPatientOnServer,
  getPatientByEmail,
  updatePatientInfo,
} from '../../utils/api/clientApi';
import { updateConversationEmail } from '../../utils/api/conversationApi';
import { sendPatientEmailSystemMessage } from '../../utils/sendPatientEmailSystemMessage';
import { getAssistantInfo } from '../utils/state';
import {
  getPatientEmailSentToAgent,
  setPatientEmailSentToAgent,
  getRealtimeClient,
} from '../utils/text-state';
import { createElement } from './baseMethods';
import { createNotice } from './templates/notice';

/**
 * Initiates the process of asking for user information (name, email, phone number).
 * The process is sequential, showing one message and input field at a time.
 * Once the data is collected, creates a patient on the backend and stores the patient ID in cache.
 */
export function askForUserInfo(callback) {
  let userName, userEmail;

  const NAME_PATTERN = '^[a-zA-Z]+(?: [a-zA-Z]+)*$';
  const EMAIL_PATTERN = '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$';

  const validateInput = (value, pattern) => {
    return new RegExp(pattern).test(value.trim());
  };

  createAssistantMessage(
    'May I have your name?',
    true,
    false,
    () => {
      createInputField('Enter your name', (name) => {
        createUserMessage(name, () => {
          if (!validateInput(name.trim(), NAME_PATTERN)) {
            // Invalid email - prompt again with error message
            createAssistantMessage(
              'Please enter a valid name using only letters and spaces.',
              true,
              false,
              askForUserInfo,
              true
            );
            return;
          }

          const { firstName, lastName } = splitFullName(name); // Split the name
          userName = { firstName, lastName };
          createAssistantMessage(
            `Hello ${firstName}, nice to meet you!`,
            true,
            false,
            () => {
              askForEmail();
            },
            true
          );
        });
      });
    },
    true
  );

  function askForEmail() {
    createAssistantMessage(
      "What's the best email to reach you?",
      true,
      false,
      () => {
        createInputField('Enter your email', (email) => {
          createUserMessage(email, async () => {
            if (!validateInput(email.toLowerCase().trim(), EMAIL_PATTERN)) {
              // Invalid email - prompt again with error message
              createAssistantMessage(
                'The email address you entered appears to be invalid. Please enter a valid email address.',
                true,
                false,
                askForEmail,
                true
              );
              return;
            }

            userEmail = email.toLowerCase();

            const patient = await getPatientByEmail(userEmail);
            if (
              patient &&
              patient.first_name === 'anonymous' &&
              patient.last_name === 'anonymous'
            ) {
              await updatePatientInfo(patient.id, {
                first_name: userName.firstName,
                last_name: userName.lastName,
              });
            }

            createAssistantMessage(
              `Thanks, we'll email you at ${email.toLowerCase()}.`,
              true,
              false,
              () => {
                askForPhoneNumber();
              },
              true
            );
          });
        });
      },
      true
    );
  }

  function askForPhoneNumber() {
    createAssistantMessage(
      "What's the best number to text you at?",
      true,
      false,
      async () => {
        createNotice(
          'By submitting your phone number, you understand we may send text messages to this number.'
        );

        const originalInput = document.querySelector('#interworky-input-field');
        const originalSubmit = document.querySelector('#submit-button');
        const originalInputContainer = originalInput.parentElement;

        originalInput.style.display = 'none';
        originalSubmit.style.display = 'none';

        const phoneInputDiv = createElement('div', phoneInputDivStyle);
        const selectContainer = createElement('div', selectContainerStyle);
        const flagContainer = createElement('div', flagContainerStyle);

        const flagImg = createElement('img', {
          ...flagImgStyle,
          cursor: 'pointer',
        });

        const countryCodeDisplay = document.createElement('span');
        countryCodeDisplay.style.fontSize = '14px';
        const dropdownContainer = createElement('div', {
          ...dropdownContainerStyle,
          ...globalScrollbarStyle,
        });

        const countries = await fetch(
          'https://storage.googleapis.com/multisync/interworky/assets/json/countries.json'
        ).then((res) => res.json());
        // Default to the United States
        let selectedCountry = countries.find(
          (country) => country.name === 'United States'
        );

        // Fetch user's country and update selected country
        const userCountry = await getUserCountry();
        if (userCountry) {
          const { countryName, countryCode } = userCountry;
          const detectedCountry = countries.find(
            (country) =>
              country.name === countryName || country.code === `+${countryCode}`
          );
          if (detectedCountry) {
            selectedCountry = detectedCountry;
          }
        }

        // Function to update selected country
        const updateSelectedCountry = (country) => {
          selectedCountry = country;
          flagImg.src = country.flag;
          countryCodeDisplay.textContent = country.code;
          dropdownContainer.style.display = 'none';
        };

        // Populate dropdown
        countries.forEach((country) => {
          const countryOption = createElement('div', countryOptionStyle);

          const optionText = document.createElement('span');
          optionText.textContent = `${country.name} (${country.code})`;

          countryOption.appendChild(optionText);

          countryOption.addEventListener('mouseover', () => {
            countryOption.style.backgroundColor = '#f5f5f5';
          });

          countryOption.addEventListener('mouseout', () => {
            countryOption.style.backgroundColor = '';
          });

          countryOption.addEventListener('click', () => {
            updateSelectedCountry(country);
          });

          dropdownContainer.appendChild(countryOption);
        });

        // Create phone input
        const phoneInput = createElement('input', phoneInputStyle, {
          type: 'tel',
          placeholder: 'Enter phone number',
          pattern: '[0-9]*',
          inputmode: 'numeric',
        });

        phoneInput.addEventListener('input', () => {
          phoneInput.value = phoneInput.value.replace(/[^0-9]/g, '');
        });

        phoneInput.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            submitButton.click();
          }
        });

        const submitButton = createElement('button', submitButtonStyle, {
          innerHTML: sendIconSVG,
          'aria-label': 'Send message',
          id: 'submit-button',
          'aria-disabled': true,
          type: 'button',
        });
        submitButton.style.cursor = 'pointer';

        flagContainer.addEventListener('click', (e) => {
          e.stopPropagation();
          dropdownContainer.style.display =
            dropdownContainer.style.display === 'none' ? 'block' : 'none';
        });

        document.addEventListener('click', () => {
          dropdownContainer.style.display = 'none';
        });

        // Set initial values
        updateSelectedCountry(selectedCountry);

        flagContainer.appendChild(flagImg);
        flagContainer.appendChild(countryCodeDisplay);
        selectContainer.appendChild(flagContainer);
        selectContainer.appendChild(dropdownContainer);
        phoneInputDiv.appendChild(selectContainer);
        phoneInputDiv.appendChild(phoneInput);
        phoneInputDiv.appendChild(submitButton);

        originalInputContainer.insertBefore(phoneInputDiv, originalInput);

        submitButton.addEventListener('click', async () => {
          const enteredPhoneNumber = phoneInput.value;
          const fullPhoneNumber = `${selectedCountry.code}${
            enteredPhoneNumber.startsWith('0')
              ? enteredPhoneNumber.slice(1)
              : enteredPhoneNumber
          }`;

          phoneInputDiv.remove();

          originalInput.style.display = '';
          originalSubmit.style.display = '';

          createUserMessage(fullPhoneNumber, async () => {
            const parsed = parsePhoneNumber(fullPhoneNumber);

            if (!parsed.valid) {
              createAssistantMessage(
                `The phone number you entered appears to be invalid.${
                  parsed.possibility !== 'is-possible'
                    ? ` It seems to be ${parsed.possibility}`
                    : ''
                }, Please enter a valid phone number.`,
                true,
                false,
                askForPhoneNumber,
                true
              );
              return;
            }

            try {
              const patientData = {
                first_name: userName.firstName,
                last_name: userName.lastName,
                email: userEmail,
                phone: fullPhoneNumber,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              };
              await createPatientOnServer(patientData);
              callback();
            } catch (error) {
              console.error('Error creating patient:', error);
              createAssistantMessage(
                'There was an error saving your info. Please try again later.',
                true,
                false,
                null,
                true
              );
            }
          });
        });
      },
      true
    );
  }
}

/**
 * Collects user email and updates patient record
 */
export function askForUserInfoEmailOnly() {
  const assistantName = getAssistantInfo().assistant_name;

  const promptForEmail = () => {
    createAssistantMessage(
      `Hi there! My name is ${assistantName}. To ensure I can help you better and reconnect if needed, may I have your email address?`,
      true,
      false,
      () => {
        createInputField('Enter your email', (email) => {
          createUserMessage(email, async () => {
            const trimmedEmail = email.toLowerCase().trim();

            // Validate email
            if (!isValidEmail(trimmedEmail)) {
              createAssistantMessage(
                'The email address you entered appears to be invalid. Please enter a valid email address.',
                true,
                false,
                promptForEmail,
                true
              );
              return;
            }

            try {
              // Update patient with email using patient ID
              await updatePatientInfo({ email: trimmedEmail });
              updateConversationEmail(trimmedEmail);

              // Send patient email as system message to agent (only once)
              if (!getPatientEmailSentToAgent()) {
                sendPatientEmailSystemMessage(
                  getRealtimeClient(),
                  trimmedEmail
                );
                setPatientEmailSentToAgent(true);
              }
            } catch (error) {
              console.error('Error updating patient:', error);
              createAssistantMessage(
                'There was an error saving your info. Please try again later.',
                true,
                false,
                null,
                true
              );
            }
          });
        });
      },
      true
    );
  };

  promptForEmail();
}

/**
 * Validates email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid email format
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
/**
 * Captures the date and time for the appointment and creates the appointment on the server.
 *
 * @param {string} organizationId - The ID of the organization retrieved or created on the server.
 * @param {string} patientId - The ID of the patient retrieved or created on the server.
 */
export function captureAppointmentDetails(
  patientId,
  organization_id,
  callback
) {
  // First, capture the date using the calendar picker
  createAssistantMessage(
    'Please select a date for your appointment:',
    true,
    false,
    () => {
      createCalendarPicker(new Date(), (selectedDate) => {
        createUserMessage(`You selected ${selectedDate.toDateString()}`, () => {
          // Then, capture the preferred time using the time preference input
          createAssistantMessage(
            'Please select your preferred time:',
            true,
            false,
            () => {
              createTimePreferenceInput((selectedTime) => {
                createUserMessage(`You selected ${selectedTime}`, async () => {
                  try {
                    let timeSelected = '';
                    if (selectedTime === 'Early Morning')
                      timeSelected = '8:00 AM';
                    if (selectedTime === 'Morning') timeSelected = '10:00 AM';
                    if (selectedTime === 'Afternoon') timeSelected = '12:00 PM';

                    const timezone =
                      Intl.DateTimeFormat().resolvedOptions().timeZone;
                    // Use convertToIsoTime to generate the ISO 8601 date-time string
                    const isoDateTime = convertToIsoTime(
                      selectedDate.toString(),
                      timeSelected,
                      timezone
                    );

                    // Create the appointment data object
                    const appointmentData = {
                      date: isoDateTime, // Store as ISO 8601 date-time
                      patient_id: patientId,
                      organization_id: organization_id,
                      status: 'Requested',
                    };
                    await createAppointmentOnServer(appointmentData);
                    createAssistantMessage(
                      `Your appointment has been scheduled for ${selectedDate.toDateString()} at ${selectedTime}.`,
                      true,
                      false,
                      null,
                      true
                    );

                    callback();
                  } catch (error) {
                    console.error('Error creating appointment:', error);
                    createAssistantMessage(
                      'There was an error scheduling the appointment. Please try again.',
                      true,
                      false,
                      null,
                      true
                    );
                    callback();
                  }
                });
              });
            },

            true
          );
        });
      });
    },
    true
  );
}
