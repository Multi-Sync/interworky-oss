'use client';

import { useEffect } from 'react';
import AssistantsInfo from '@/app/_view/AssistantInfoView.enhanced';

export default function AssistantInfo() {
  // Track page visit for onboarding checklist
  useEffect(() => {
    localStorage.setItem('interworky_visited_customization', 'true');
  }, []);

  return <AssistantsInfo />;
}
