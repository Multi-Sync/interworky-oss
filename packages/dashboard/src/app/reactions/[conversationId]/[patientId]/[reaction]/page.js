'use client';

import { useEffect, useRef } from 'react';

export default function ReactionPage({ params }) {
  const { conversationId, patientId, reaction } = params;
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current && conversationId && patientId) {
      fetch('/api/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          patientId,
          reaction,
        }),
      }).catch(err => console.error('API error:', err));

      isFirstRender.current = false;
    }
  }, [conversationId, patientId, reaction]);

  return (
    <div className="min-h-screen w-full bg-interworky-gradient flex items-center justify-center p-4 ">
      <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 transform transition-all duration-500 hover:scale-105 ">
        <div className="text-center space-y-4 cursor-pointer">
          <h1 className="text-3xl md:text-4xl font-bold text-primary">Thank you for your feedback!</h1>
          <div className="text-4xl md:text-5xl animate-bounce">🥰</div>
          <p className="text-gray-600 text-base md:text-lg font-medium ">We appreciate your response</p>
        </div>
      </div>
    </div>
  );
}
