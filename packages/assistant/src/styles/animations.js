export const gradientAnimation = `
 @keyframes gradientAnimation {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
`;

export const floatUpAnimation = `
  @keyframes slideUp {
    0% {
      opacity: 0;
      transform: translateY(20px);
    }
    100% {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

// Create the keyframes for the shining effect
export const shineAnimation = `
  @keyframes shine {
    0% {
      filter: brightness(1);
    }
    50% {
      filter: brightness(1.5);
    }
    100% {
      filter: brightness(1);
    }
  }
`;
export const sparkleAnimation = `
    @keyframes sparkle {
      0% {
        transform: scale(1);
        box-shadow: 0px 4px 15px rgba(0, 0, 0, 0.3);
      }
      50% {
        transform: scale(1.02);
        box-shadow: 0px 8px 25px rgba(0, 0, 0, 0.35);
      }
      100% {
        transform: scale(1);
        box-shadow: 0px 4px 15px rgba(0, 0, 0, 0.3);
      }
    }
`;

export const rainbowLetterTrail = `
  rainbowLetterTrail: {
          0% { color: rgba(255, 0, 150, 1); }
  50% { color: rgba(255, 128, 0, 0.75); }
  100% { color: rgba(5, 138, 124, 1); }
        },
`;

export const sentenceGlow = `
  @keyframes sentenceGlow {
  0%, 100% { text-shadow: 0 0 10px rgba(255, 255, 255, 0.5); }
  50% { text-shadow: 0 0 20px rgba(255, 255, 255, 1); }
}
`;

export const loadingAnimation = `
@keyframes loadingAnimation {
      0% {
        width: 0%;
        background-position: 0% 50%;
      }
      50% {
        width: 100%;
        background-position: 100% 50%;
      }
      100% {
        width: 0%;
        background-position: 200% 50%;
      }
    }
`;

export const waveKeyframes = `
  @keyframes wave {
    0% { transform: rotate(0deg); }
    20% { transform: rotate(15deg); }
    40% { transform: rotate(-10deg); }
    60% { transform: rotate(15deg); }
    80% { transform: rotate(-10deg); }
    100% { transform: rotate(0deg); }
  }
`;

export const spin = `
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}`;

export const rotate = `
 @keyframes rotate {
      from {
        transform: translate(-50%, -50%) rotate(0deg);
      }
      to {
        transform: translate(-50%, -50%) rotate(360deg);
      }
    }`;

export const pulse = `
    @keyframes pulse {
      0% {
        opacity: 0.6;
        transform: scale(1);
      }
      50% {
        opacity: 1;
        transform: scale(1.1);
      }
      100% {
        opacity: 0.6;
        transform: scale(1);
      }
    }`;

// Bounce entrance animation for closed view button
export const bounceEntrance = `
  @keyframes bounceEntrance {
    0% {
      opacity: 0;
      transform: scale(0.3) translateY(100px);
    }
    50% {
      opacity: 1;
      transform: scale(1.05) translateY(-10px);
    }
    70% {
      transform: scale(0.95) translateY(5px);
    }
    100% {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }
`;

// Gentle attention-grabbing bounce
export const gentleBounce = `
  @keyframes gentleBounce {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-8px);
    }
  }
`;

// Glow pulse for attention
export const glowPulse = `
  @keyframes glowPulse {
    0%, 100% {
      box-shadow: 0px 4px 15px rgba(0, 0, 0, 0.3), 0 0 0 0 rgba(5, 138, 124, 0.4);
    }
    50% {
      box-shadow: 0px 8px 25px rgba(0, 0, 0, 0.35), 0 0 20px 8px rgba(5, 138, 124, 0.3);
    }
  }
`;

// Rotating text fade animation
export const fadeRotate = `
  @keyframes fadeRotate {
    0% {
      opacity: 0;
      transform: translateY(10px);
    }
    10% {
      opacity: 1;
      transform: translateY(0);
    }
    90% {
      opacity: 1;
      transform: translateY(0);
    }
    100% {
      opacity: 0;
      transform: translateY(-10px);
    }
  }
`;

// Online indicator pulse
export const onlinePulse = `
  @keyframes onlinePulse {
    0%, 100% {
      box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7);
    }
    50% {
      box-shadow: 0 0 0 6px rgba(34, 197, 94, 0);
    }
  }
`;

// Typing dots animation
export const typingDots = `
  @keyframes typingDots {
    0%, 20% {
      opacity: 0.3;
      transform: translateY(0);
    }
    50% {
      opacity: 1;
      transform: translateY(-3px);
    }
    80%, 100% {
      opacity: 0.3;
      transform: translateY(0);
    }
  }
`;
