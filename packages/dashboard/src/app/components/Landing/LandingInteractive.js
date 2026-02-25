'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useNotification } from '@/_common/utils/handleSlackNotification';
import UserInfoModal from '../UserInfoModal';
import dynamic from 'next/dynamic';

// Lazy load below-the-fold interactive components
const StickyCTABar = dynamic(() => import('./StickyCTABar'), { ssr: false });
const ExitIntentPopup = dynamic(() => import('./ExitIntentPopup'), { ssr: false });

export function FeatureButton({ action, source = 'landing-product-section', children, className }) {
  const { handleNotification } = useNotification();
  const router = useRouter();

  const handleClick = () => {
    handleNotification(`User clicked ${action} from ${source} section`);
    if (action === 'See tutorial video') {
      router.push('https://youtu.be/4bJNENvwDvU');
      return;
    }
    router.push('/setup-account');
  };

  return (
    <button onClick={handleClick} className={className}>
      {children}
    </button>
  );
}

export function CTAButtons() {
  const { handleNotification } = useNotification();
  const router = useRouter();

  const handleButtonClick = action => {
    handleNotification(`User clicked ${action} from landing-product-section section`);
    if (action === 'See tutorial video') {
      router.push('https://youtu.be/4bJNENvwDvU');
      return;
    }
    router.push('/setup-account');
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
      <button
        onClick={() => handleButtonClick('Get Started Free')}
        className="group p-[2px] from-white/80 hover:bg-white/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-green-500 inline-block relative bg-gradient-to-r to-transparent rounded-full transition-all duration-300 ease-in-out"
      >
        <div className="flex items-center justify-center gap-x-2 bg-green-600 rounded-full px-8 h-12 text-lg font-semibold text-white">
          <span>Get Started Free</span>
        </div>
      </button>
      <button
        onClick={() => handleButtonClick('See tutorial video')}
        className="gap-x-3 hover:bg-white hover:text-black flex items-center justify-center h-12 px-8 text-white transition duration-300 ease-in-out border border-gray-400 rounded-full"
      >
        See Tutorial Video
      </button>
    </div>
  );
}

export function LandingOverlays() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalSource, setModalSource] = useState('landing');

  return (
    <>
      <UserInfoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        actionType="demo"
        source={modalSource}
      />
      <StickyCTABar />
      <ExitIntentPopup />
    </>
  );
}
