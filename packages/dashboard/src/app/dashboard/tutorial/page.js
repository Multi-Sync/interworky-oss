'use client';

import { useEffect } from 'react';
import TutorialView from '@/app/_view/TutorialView';

export default function TutorialPage() {
  // Track page visit for onboarding checklist
  useEffect(() => {
    localStorage.setItem('interworky_visited_integration', 'true');
  }, []);

  return <TutorialView />;
}
