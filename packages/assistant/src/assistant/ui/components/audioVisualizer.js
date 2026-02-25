import { appendChild, createElement } from '../baseMethods';

/**
 * Creates a beautiful audio visualizer component
 * @param {AudioContext} audioContext - The audio context
 * @param {MediaStream} micStream - The microphone stream
 * @returns {Object} Object containing the visualizer element and control methods
 */
export function createAudioVisualizer(audioContext, micStream) {
  const visualizerContainer = createElement('div', {
    width: '150px',
    height: '60px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '3px',
  });

  const canvas = createElement('canvas', {
    width: '150px',
    height: '48px',
  });
  canvas.width = 150;
  canvas.height = 48;
  appendChild(visualizerContainer, canvas);

  let analyser, dataArray, animationId;
  let isActive = false;

  const initializeAnalyser = () => {
    if (audioContext && micStream) {
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.8;
      const source = audioContext.createMediaStreamSource(micStream);
      source.connect(analyser);
      dataArray = new Uint8Array(analyser.frequencyBinCount);
      return true;
    }
    return false;
  };

  const startVisualization = () => {
    if (!analyser && !initializeAnalyser()) {
      return false;
    }

    const ctx = canvas.getContext('2d');
    const barCount = 16;
    const barWidth = canvas.width / barCount - 2;
    const centerY = canvas.height / 2;

    const animate = () => {
      if (!isActive) return;

      if (analyser) {
        analyser.getByteFrequencyData(dataArray);
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Check if there is any significant sound
        const hasSound = dataArray.some((v) => v > 5); // threshold can be adjusted

        if (hasSound) {
          for (let i = 0; i < barCount; i++) {
            const barHeight = (dataArray[i] / 255) * (canvas.height / 2) * 0.9;
            const x = i * (barWidth + 2);

            ctx.fillStyle = '#058A7C';

            // Draw one continuous rounded rectangle that spans both sides
            const totalHeight = barHeight * 2;
            const y = centerY - barHeight;
            const radius = Math.min(barWidth / 1.5, 10);

            ctx.beginPath();
            ctx.moveTo(x + radius, y);
            ctx.lineTo(x + barWidth - radius, y);
            ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius);
            ctx.lineTo(x + barWidth, y + totalHeight - radius);
            ctx.quadraticCurveTo(
              x + barWidth,
              y + totalHeight,
              x + barWidth - radius,
              y + totalHeight
            );
            ctx.lineTo(x + radius, y + totalHeight);
            ctx.quadraticCurveTo(
              x,
              y + totalHeight,
              x,
              y + totalHeight - radius
            );
            ctx.lineTo(x, y + radius);
            ctx.quadraticCurveTo(x, y, x + radius, y);
            ctx.closePath();
            ctx.fill();
          }
        }
      }

      animationId = requestAnimationFrame(animate);
    };

    isActive = true;
    animate();
    return true;
  };

  const stopVisualization = () => {
    isActive = false;
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
  };

  const destroy = () => {
    stopVisualization();
    if (analyser) {
      analyser.disconnect();
      analyser = null;
    }
  };

  return {
    element: visualizerContainer,
    start: startVisualization,
    stop: stopVisualization,
    destroy,
  };
}
