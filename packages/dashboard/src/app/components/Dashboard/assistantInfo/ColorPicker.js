'use client';

import { useAssistantContext } from '@/_common/context/AssistantContext';
import { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { SketchPicker } from 'react-color';

export default function ColorPicker({ label, colorKey, isOpen, onToggle, onClose }) {
  const { state, dispatch } = useAssistantContext();
  const swatchRef = useRef(null);
  const [position, setPosition] = useState(null);

  // Calculate position when picker opens
  useEffect(() => {
    if (isOpen && swatchRef.current) {
      const rect = swatchRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 8,
        left: rect.left,
      });
    } else if (!isOpen) {
      setPosition(null); // Reset when closed
    }
  }, [isOpen]);

  // Toggle picker visibility
  const handleClick = () => {
    onToggle(colorKey);
  };

  // Update context with selected color
  const handleChange = color => {
    dispatch({
      type: 'SET_COLORS',
      payload: { [colorKey]: color.hex },
    });
    onClose(); // Auto-close after selection
  };

  return (
    <>
      <div className="flex items-center gap-3 p-3 bg-surface-elevated-light/80 dark:bg-[#0a0e27]/60 backdrop-blur-sm border border-primary/30 rounded-lg hover:border-primary/50 transition-all">
        {/* Swatch */}
        <div
          ref={swatchRef}
          className="bg-white/90 dark:bg-[#0a0e27]/80 rounded-lg shadow-lg shadow-primary/20 inline-block cursor-pointer ring-2 ring-primary/30 hover:ring-primary/50 transition-all"
          onClick={handleClick}
        >
          <div className="w-10 h-10 rounded-lg border-2 border-primary/30" style={{ background: state[colorKey] }} />
        </div>

        {/* Label */}
        <span className="text-body font-medium text-primary">{label}</span>
      </div>

      {/* Portal-based Popover */}
      {isOpen &&
        position &&
        typeof window !== 'undefined' &&
        createPortal(
          <>
            {/* Cover for outside clicks */}
            <div className="fixed inset-0 z-[9998]" onClick={onClose} />

            {/* Color Picker */}
            <div
              className="fixed z-[9999]"
              style={{
                top: `${position.top}px`,
                left: `${position.left}px`,
              }}
            >
              <div className="bg-white/95 dark:bg-[#0a0e27]/95 backdrop-blur-xl border border-primary/30 rounded-lg p-2 shadow-2xl shadow-primary/20">
                <SketchPicker color={state[colorKey]} onChangeComplete={handleChange} />
              </div>
            </div>
          </>,
          document.body,
        )}
    </>
  );
}
