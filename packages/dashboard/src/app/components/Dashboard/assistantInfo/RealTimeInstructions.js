'use client';

import { useAssistantContext } from '@/_common/context/AssistantContext';
import { useState } from 'react';
import { Button } from '../../ui/Button';
import Input from '../../ui/Input';

const RealTimeInstructions = () => {
  const [newInstruction, setNewInstruction] = useState('');
  const { state, dispatch } = useAssistantContext();

  const handleAddInstruction = () => {
    if (newInstruction.trim()) {
      const updatedInstructions = [...(state.realTimeInstructions || []), newInstruction.trim()];

      dispatch({
        type: 'SET_REAL_TIME_INSTRUCTIONS',
        payload: updatedInstructions,
      });

      setNewInstruction('');
    }
  };

  const handleDeleteInstruction = index => {
    const updatedInstructions = (state.realTimeInstructions || []).filter((_, i) => i !== index);

    dispatch({
      type: 'SET_REAL_TIME_INSTRUCTIONS',
      payload: updatedInstructions,
    });
  };

  const handleKeyPress = e => {
    if (e.key === 'Enter') {
      handleAddInstruction();
    }
  };

  return (
    <div className="w-full">
      <div className="mb-4">
        <label className="block mb-2 text-sm font-medium text-primary">Custom Instructions</label>
        <div className="flex gap-2">
          <Input
            type="text"
            value={newInstruction}
            onChange={e => setNewInstruction(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ex. Please tell users about our new location ..."
            className="focus:outline-none focus:ring-2 focus:ring-primary/50 flex-1 px-3 py-2 bg-[#0a0e27]/60 backdrop-blur-sm border border-primary/30 rounded-md text-white placeholder-gray-500 transition-all"
          />
          <Button
            intent="primary"
            onClick={handleAddInstruction}
            className="focus:outline-none focus:ring-2 focus:ring-primary/50 px-4 py-2 text-white rounded-md bg-gradient-to-r from-primary to-primary hover:shadow-lg hover:shadow-primary/50 transition-all"
          >
            Add
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {(state.realTimeInstructions || []).map((instruction, index) => (
          <div
            key={index}
            className="flex justify-between items-center p-3 bg-[#0a0e27]/60 backdrop-blur-sm border border-primary/30 rounded-md hover:border-primary/50 transition-all"
          >
            <span className="flex-1 text-sm text-gray-300">{instruction}</span>
            <button
              onClick={() => handleDeleteInstruction(index)}
              className="hover:text-red-400 focus:outline-none p-1 ml-2 text-red-500 transition-colors"
              aria-label="Delete instruction"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M18 6L6 18M6 6l12 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        ))}

        {(!state.realTimeInstructions || state.realTimeInstructions.length === 0) && (
          <div className="py-4 text-sm text-center text-gray-400">
            No instructions added yet. Add your first instruction above.
          </div>
        )}
      </div>
    </div>
  );
};

export default RealTimeInstructions;
