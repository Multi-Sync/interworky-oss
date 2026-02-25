'use client';

import { useState, useEffect } from 'react';
import 'react-loading-skeleton/dist/skeleton.css';
import useApiKey from '@/_common/hooks/useApiKey';
import useScriptSrc from '@/_common/hooks/useScriptSrc';
import ThemeToggle from '@/app/components/ThemeToggle';
import PlatformSelector from '../components/Dashboard/tutorial/PlatformSelector';
import LovableInstructions from '../components/Dashboard/tutorial/LovableInstructions';
import BoltInstructions from '../components/Dashboard/tutorial/BoltInstructions';
import NextJSInstructions from '../components/Dashboard/tutorial/NextJSInstructions';
import WordPressInstructions from '../components/Dashboard/tutorial/WordPressInstructions';
import SquarespaceInstructions from '../components/Dashboard/tutorial/SquarespaceInstructions';
import WixInstructions from '../components/Dashboard/tutorial/WixInstructions';
import HTML5Instructions from '../components/Dashboard/tutorial/HTML5Instructions';
import OtherInstructions from '../components/Dashboard/tutorial/OtherInstructions';
import { useNotification } from '@/_common/utils/handleSlackNotification';
import { useSessionManager } from '@/_common/hooks/useSession';
import { getUser, getOrganization } from '@/_common/utils/localStorage';

const STORAGE_KEY = 'interworky-tutorial-platform';
const VALID_PLATFORMS = ['lovable', 'bolt', 'nextjs', 'wordpress', 'squarespace', 'wix', 'html5', 'other'];

const PLATFORM_NAMES = {
  lovable: 'Lovable',
  bolt: 'Bolt',
  nextjs: 'Next.js / React',
  wordpress: 'WordPress',
  squarespace: 'Squarespace',
  wix: 'Wix',
  html5: 'HTML / Static',
  other: 'Other',
};

const TutorialView = () => {
  const { apiKey, isLoading } = useApiKey();
  const scriptSrc = useScriptSrc();
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const { handleNotification } = useNotification();
  const { session } = useSessionManager();

  // Load saved platform from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && VALID_PLATFORMS.includes(saved)) {
      setSelectedPlatform(saved);
    }
    setIsHydrated(true);
  }, []);

  // Save platform selection to localStorage and send Slack notification
  const handlePlatformSelect = async platform => {
    setSelectedPlatform(platform);
    localStorage.setItem(STORAGE_KEY, platform);

    // Send Slack notification
    const userEmail = getUser()?.email || session?.email || 'Unknown';
    const orgName = getOrganization()?.organization?.organization_name || 'Unknown';

    const slackMessage = `🎯 Integration Platform Selected

📧 Email: ${userEmail}
🏢 Organization: ${orgName}
🔧 Platform: ${PLATFORM_NAMES[platform] || platform}
⏰ Timestamp: ${new Date().toLocaleString()}`;

    await handleNotification(slackMessage);
  };

  // Reset platform selection
  const handleChangePlatform = () => {
    setSelectedPlatform(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  // Render the appropriate instructions component
  const renderInstructions = () => {
    const props = { apiKey, scriptSrc, isLoading };

    switch (selectedPlatform) {
      case 'lovable':
        return <LovableInstructions {...props} />;
      case 'bolt':
        return <BoltInstructions {...props} />;
      case 'nextjs':
        return <NextJSInstructions {...props} />;
      case 'wordpress':
        return <WordPressInstructions {...props} />;
      case 'squarespace':
        return <SquarespaceInstructions {...props} />;
      case 'wix':
        return <WixInstructions {...props} />;
      case 'html5':
        return <HTML5Instructions {...props} />;
      case 'other':
        return <OtherInstructions {...props} />;
      default:
        return null;
    }
  };

  // Prevent hydration mismatch by not rendering until client-side
  if (!isHydrated) {
    return (
      <div className="text-gray-700 dark:text-gray-300">
        <div className="flex justify-end mb-4">
          <ThemeToggle />
        </div>
        <h1 className="lg:text-title my-4 text-lg font-medium text-gray-900 dark:text-gray-50">Integration</h1>
        <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg h-48" />
      </div>
    );
  }

  return (
    <div className="text-gray-700 dark:text-gray-300">
      {/* Theme Toggle - Top Right */}
      <div className="flex justify-end mb-4">
        <ThemeToggle />
      </div>

      <h1 className="lg:text-title my-4 text-lg font-medium text-gray-900 dark:text-gray-50">Integration</h1>

      {/* Show platform selector if no platform is selected, or compact version if selected */}
      {!selectedPlatform ? (
        <PlatformSelector selected={selectedPlatform} onSelect={handlePlatformSelect} />
      ) : (
        <>
          <PlatformSelector
            selected={selectedPlatform}
            onSelect={handlePlatformSelect}
            showChangeLink={true}
            onChangeClick={handleChangePlatform}
          />

          {/* Platform-specific instructions */}
          {renderInstructions()}
        </>
      )}
    </div>
  );
};

export default TutorialView;
