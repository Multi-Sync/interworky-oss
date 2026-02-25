import { detectDarkTheme } from '../../../styles/themeManager';
import { getAssistantInfo } from '../../utils/state';
import { createElement } from '../baseMethods';
// Function to create the visualizer

export function createVisualizer(showHalo = false) {
  const isDarkTheme = detectDarkTheme();
  let visualizerWrapper = createElement('div', {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
  });
  visualizerWrapper.id = 'visualizerWrapper';

  if (showHalo) {
    const halo = createElement('div');
    visualizerWrapper.appendChild(halo);
  }

  const assistantInfo = getAssistantInfo();
  const assistantName = createElement(
    'p',
    { color: isDarkTheme ? '#000' : '#FFF' },
    { innerText: assistantInfo?.assistant_name }
  );

  visualizerWrapper.appendChild(assistantName);

  return visualizerWrapper;
}
