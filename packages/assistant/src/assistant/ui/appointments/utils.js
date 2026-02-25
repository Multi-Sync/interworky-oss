import { appendChild, createElement } from '../baseMethods';
import {
  assistantMessageStyle,
  calendarContainerStyle,
  calendarDateStyle,
  calendarDaysStyle,
  calendarHeaderStyle,
  calendarNavigationButtonStyle,
  messagesTextStyle,
  timeOptionStyle,
  timeOptionsContainerStyle,
  wrapperStyle,
} from '../../../styles/styles';
import { getAssistantInfo } from '../../utils/state';
import { nextIconSVG, previousIconSVG } from '../../../styles/icons';

/**
 * Renders a calendar date picker with month navigation.
 * @param {Date} currentDate - The current date.
 * @param {function} callback - The callback function when a date is selected.
 */
export function createCalendarPicker(currentDate, callback) {
  const chatContainer = document.querySelector('#chat-container');
  if (!chatContainer) return;
  let theme = getAssistantInfo();
  var text_primary_color, secondary_color;
  if (!theme) {
    text_primary_color = '#FFFFFF';
    secondary_color = '#000000';
  } else {
    var {
      text_primary_color: text_primary_color,
      secondary_color: secondary_color,
    } = theme;
  }
  // Embed style for selected date
  const selectedDateStyle = `
  .selecteddatestyle {
    background-color: ${secondary_color};  /* Highlight color */
    color: white;               /* Text color */
    border-radius: 50%;         /* Make the selected date circular */
    padding: 10px;              /* Add padding */
    display: inline-block;
    mixBlendMode:"difference"
  }
`;

  // Inject this style into the page
  const style = document.createElement('style');
  style.innerHTML = selectedDateStyle;
  document.head.appendChild(style);

  let displayedDate = new Date(currentDate); // Keeps track of the currently displayed month

  const messageContainer = createElement('div'); // Assistant message style

  // Create a wrapper to stack the title and the calendar picker vertically
  const wrapper = createElement('div', wrapperStyle);

  const calendarContainer = createElement('div', calendarContainerStyle);
  appendChild(wrapper, calendarContainer); // Add the calendar container to the wrapper

  // document.body.appendChild(messageContainer);
  chatContainer.appendChild(messageContainer);
  appendChild(messageContainer, wrapper); // Add the entire wrapper to the message container

  // Helper function to update the calendar view
  const updateCalendar = () => {
    // Clear previous calendar content
    while (calendarContainer.firstChild) {
      calendarContainer.removeChild(calendarContainer.firstChild);
    }

    // Calendar header (Month and Year)
    const calendarHeader = createElement('div', calendarHeaderStyle);
    calendarHeader.style.color = text_primary_color;
    calendarHeader.style.mixBlendMode = 'difference';

    // Previous month button
    const prevMonthButton = createElement(
      'button',
      calendarNavigationButtonStyle,
      { innerHTML: previousIconSVG }
    );
    prevMonthButton.addEventListener('click', () => {
      displayedDate.setMonth(displayedDate.getMonth() - 1);
      updateCalendar();
    });

    // Next month button
    const nextMonthButton = createElement(
      'button',
      calendarNavigationButtonStyle,
      { innerHTML: nextIconSVG }
    );
    nextMonthButton.addEventListener('click', () => {
      displayedDate.setMonth(displayedDate.getMonth() + 1);
      updateCalendar();
    });

    const arrows = createElement('div', { display: 'flex', gap: '10px' });

    // Month and year display
    const monthYear = createElement(
      'span',
      { ...messagesTextStyle, mixBlendMode: 'difference', color: '#FFFFFF' },
      {
        innerText: displayedDate.toLocaleDateString('en-US', {
          month: 'long',
          year: 'numeric',
        }),
      }
    );
    appendChild(arrows, prevMonthButton);
    appendChild(arrows, nextMonthButton);

    appendChild(calendarHeader, monthYear);
    appendChild(calendarHeader, arrows);

    // Days of the week header
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const calendarDaysHeader = createElement('div', calendarDaysStyle);
    daysOfWeek.forEach((day) => {
      const dayElement = createElement(
        'span',
        { color: '#FFFFFF', mixBlendMode: 'difference' },
        { innerText: day }
      );
      appendChild(calendarDaysHeader, dayElement);
    });

    appendChild(calendarContainer, calendarHeader);
    appendChild(calendarContainer, calendarDaysHeader);

    // First and last day of the displayed month
    const firstDayOfMonth = new Date(
      displayedDate.getFullYear(),
      displayedDate.getMonth(),
      1
    );
    const lastDayOfMonth = new Date(
      displayedDate.getFullYear(),
      displayedDate.getMonth() + 1,
      0
    );
    const totalDaysInMonth = lastDayOfMonth.getDate();

    let selectionMade = false;
    // Create blank spaces for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth.getDay(); i++) {
      appendChild(calendarContainer, createElement('span', calendarDateStyle)); // Empty cell
    }

    // Generate day elements
    for (let day = 1; day <= totalDaysInMonth; day++) {
      const date = new Date(
        displayedDate.getFullYear(),
        displayedDate.getMonth(),
        day
      );
      const dateElement = createElement('span', calendarDateStyle, {
        innerText: day,
      });
      dateElement.style.fontWeight = 'bold';
      // Disable past dates
      if (date < currentDate) {
        dateElement.style.color = '#333'; // Grey out past dates
        dateElement.style.fontWeight = 'normal';
        dateElement.style.textDecoration = 'line-through';
        dateElement.style.cursor = 'not-allowed';
      } else {
        // Add click event for selecting a date
        dateElement.addEventListener('click', () => {
          if (selectionMade) {
            return;
          }
          selectionMade = true;
          document
            .querySelectorAll('.selecteddatestyle')
            .forEach((el) => el.classList.remove('selecteddatestyle'));
          dateElement.classList.add('selecteddatestyle');
          callback(date); // Return the selected date
        });
      }

      appendChild(calendarContainer, dateElement);
    }

    // Update the positioning for the assistant message

    // Scroll the container to the bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
  };

  // Initialize the calendar for the first time
  updateCalendar();
}

/**
 * Renders a time preference picker with predefined optoons.
 * @param {function} callback - The callback function when a time preference is selected.
 */
export function createTimePreferenceInput(callback) {
  let theme = getAssistantInfo();
  var text_primary_color, primary_color;
  if (!theme) {
    text_primary_color = '#FFFFFF';
    primary_color = '#000000';
  } else {
    var {
      text_primary_color: text_primary_color,
      primary_color: primary_color,
    } = theme;
  }
  const chatContainer = document.querySelector('#chat-container');
  if (!chatContainer) return;
  // Create container for the time preference input
  const messageContainer = createElement('div', assistantMessageStyle); // Assistant message style

  // Create a wrapper to stack the title and time options vertically
  const wrapper = createElement('div', wrapperStyle);

  // Create the container for time options
  const timeOptionsContainer = createElement('div', timeOptionsContainerStyle);
  const timeOptions = [
    { text: '🌞 Early Morning (8 - 10 AM)', value: 'Early Morning' },
    { text: '🌻 Morning (10 - 12 PM)', value: 'Morning' },
    { text: '🕛 Afternoon (12 PM - 5 PM)', value: 'Afternoon' },
  ];

  let selectionMade = false;
  timeOptions.forEach((option) => {
    const optionElement = createElement('div', timeOptionStyle);
    const optionText = createElement('span', {}, { innerText: option.text });

    optionElement.addEventListener('click', () => {
      if (selectionMade) {
        return;
      }
      selectionMade = true;
      optionElement.children[0].style.color = primary_color;
      optionElement.style.backgroundColor = text_primary_color;
      callback(option.value); // Return selected time value
    });

    appendChild(optionElement, optionText);
    appendChild(timeOptionsContainer, optionElement);
  });

  appendChild(wrapper, timeOptionsContainer); // Add time options container below title
  appendChild(messageContainer, wrapper); // Add the entire wrapper to messageContainer

  // document.body.appendChild(messageContainer);
  chatContainer.appendChild(messageContainer);

  // Update the positioning for the assistant message
  chatContainer.scrollTop = chatContainer.scrollHeight;
}
