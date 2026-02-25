'use client';
import useFireToast from '@/_common/hooks/fireToast';
import { extractDomain } from '@/_common/utils/utils';
import { useNotification } from '@/_common/utils/handleSlackNotification';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { Button } from '../components/ui/Button';
import { useForm } from 'react-hook-form';
import Input from '../components/ui/Input';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import LovableLogo from '../components/ProductIcons/LovableLogo';
import BoltLogo from '../components/ProductIcons/BoltLogo';
import NextjsLogo from '../components/ProductIcons/NextjsLogo';

// Loading phases
const PHASES = {
  INITIAL: 'initial',
  SCANNING: 'scanning',
  PLATFORM: 'platform',
  PAIN_POINT: 'painPoint',
  COMMUNITY: 'community',
  COMPLETE: 'complete',
};

// Platform options
const PLATFORMS = [
  { id: 'lovable', name: 'Lovable', icon: LovableLogo },
  { id: 'bolt', name: 'Bolt', icon: BoltLogo },
  { id: 'nextjs', name: 'Next.js', icon: NextjsLogo },
  { id: 'other', name: 'Other', icon: null },
];

// Pain point options
const PAIN_POINTS = [
  {
    id: 'support',
    icon: '🎙️',
    title: 'Answering visitor questions',
    description: '24/7 without being online',
  },
  {
    id: 'bugs',
    icon: '🐛',
    title: 'Catching bugs before users',
    description: 'Auto-detect and fix issues',
  },
  {
    id: 'analytics',
    icon: '📊',
    title: 'Understanding what visitors want',
    description: 'Insights that actually matter',
  },
];

// Scanning messages
const SCANNING_MESSAGES = [
  'Connecting to your website...',
  'Analyzing page structure...',
  'Extracting content...',
  'Building knowledge base...',
  'Training your AI agent...',
  'Almost ready...',
];

const Page = () => {
  const toast = useFireToast();
  const router = useRouter();
  const { handleNotification } = useNotification();

  // Form states
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Loading phase states
  const [currentPhase, setCurrentPhase] = useState(PHASES.INITIAL);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanMessageIndex, setScanMessageIndex] = useState(0);
  const [pagesFound, setPagesFound] = useState(0);

  // Survey responses
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [selectedPainPoint, setSelectedPainPoint] = useState(null);

  // Scraping completion state (separate from survey phase)
  const [scrapingComplete, setScrapingComplete] = useState(false);
  const [redirectData, setRedirectData] = useState(null);

  // Website form
  const {
    register: registerWebsite,
    handleSubmit: handleWebsiteSubmit,
    formState: { errors: websiteErrors },
    getValues: getWebsiteValues,
  } = useForm({
    mode: 'onTouched',
    defaultValues: { domain: '' },
  });

  // Email form
  const {
    register: registerEmail,
    handleSubmit: handleEmailSubmit,
    formState: { errors: emailErrors },
  } = useForm({
    mode: 'onTouched',
    defaultValues: { email: '' },
  });

  // Badges for carousel
  const badges = useMemo(
    () => [
      { id: 1, icon: '🆓', text: '100% Free' },
      { id: 2, icon: '🐛', text: 'Auto-Fix The 70% Problem' },
      { id: 3, icon: '🎙️', text: '24/7 AI Voice Support' },
      { id: 4, icon: '📊', text: 'Analytics That Matter' },
      { id: 5, icon: '⚡', text: 'Works With Lovable & Bolt' },
    ],
    [],
  );

  // Simulate scanning progress
  useEffect(() => {
    if (currentPhase === PHASES.SCANNING) {
      const progressInterval = setInterval(() => {
        setScanProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return prev + Math.random() * 3;
        });
      }, 500);

      const messageInterval = setInterval(() => {
        setScanMessageIndex(prev => (prev + 1) % SCANNING_MESSAGES.length);
      }, 3000);

      const pagesInterval = setInterval(() => {
        setPagesFound(prev => prev + Math.floor(Math.random() * 3) + 1);
      }, 2000);

      // Move to platform question after 15 seconds (reduced from 30)
      const phaseTimeout = setTimeout(() => {
        setCurrentPhase(PHASES.PLATFORM);
      }, 15000);

      return () => {
        clearInterval(progressInterval);
        clearInterval(messageInterval);
        clearInterval(pagesInterval);
        clearTimeout(phaseTimeout);
      };
    }
  }, [currentPhase]);

  // If scraping completes while still on SCANNING phase, move to PLATFORM immediately
  useEffect(() => {
    if (scrapingComplete && currentPhase === PHASES.SCANNING) {
      setCurrentPhase(PHASES.PLATFORM);
    }
  }, [scrapingComplete, currentPhase]);

  // Handle phase transitions based on survey answers
  useEffect(() => {
    if (selectedPlatform && currentPhase === PHASES.PLATFORM) {
      handleNotification(`[/new] Platform selected: ${selectedPlatform}`);
      setTimeout(() => setCurrentPhase(PHASES.PAIN_POINT), 500);
    }
  }, [selectedPlatform, currentPhase, handleNotification]);

  useEffect(() => {
    if (selectedPainPoint && currentPhase === PHASES.PAIN_POINT) {
      handleNotification(`[/new] Pain point selected: ${selectedPainPoint}`);
      setTimeout(() => setCurrentPhase(PHASES.COMMUNITY), 500);
    }
  }, [selectedPainPoint, currentPhase, handleNotification]);

  // Handle manual redirect when user clicks continue in COMMUNITY phase
  const handleContinueToDemo = useCallback(() => {
    if (scrapingComplete && redirectData) {
      setCurrentPhase(PHASES.COMPLETE);
      toast.success('Your AI Agent is ready!');

      // Store platform choice in localStorage for tutorial page
      if (selectedPlatform) {
        localStorage.setItem('interworky-tutorial-platform', selectedPlatform);
      }

      setTimeout(() => {
        const { apiKey, orgName, registrationToken, domain } = redirectData;
        handleNotification(`[/new] User redirected to test: ${domain}`);
        router.push(`/org/${orgName}?apikey=${apiKey}&token=${registrationToken}`);
      }, 2000);
    }
  }, [scrapingComplete, redirectData, selectedPlatform, router, handleNotification, toast]);

  const onWebsiteSubmit = () => {
    const domain = getWebsiteValues('domain');
    handleNotification(`[/new] Website entered: ${domain}`);
    setShowEmailInput(true);
  };

  const handleSync = useCallback(
    async (assistantId, orgId, registrationToken) => {
      try {
        const domain = getWebsiteValues('domain');

        if (!domain) {
          toast.error(`Invalid domain: ${domain}`);
          return;
        }

        const response = await fetch('/api/scraper', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
          },
          body: JSON.stringify({ domain, assistantId }),
        });

        if (!response.ok) {
          throw new Error('Failed to start the scraping job');
        }

        const data = await response.json();
        const { jobId } = data;

        if (!jobId) {
          throw new Error('Job ID not returned from the scraper');
        }

        const checkJobStatus = async () => {
          const statusResponse = await fetch(`/api/scraper/${jobId}`, {
            method: 'GET',
            headers: { Authorization: `Bearer ${process.env.ACCESS_TOKEN}` },
          });

          if (!statusResponse.ok) {
            throw new Error('Failed to fetch job status');
          }
          return statusResponse.json();
        };

        let completed = false;
        while (!completed) {
          const statusData = await checkJobStatus();
          if (statusData.status === 'completed') {
            if (statusData.result) {
              handleNotification(`[/new] Scraping complete: ${domain}`);

              // Store redirect data and mark scraping as complete
              // The actual redirect will happen when user completes survey (reaches COMMUNITY phase)
              const apiKey = btoa(`${orgId}$$${assistantId}`);
              const orgName = extractDomain(domain);
              setRedirectData({ apiKey, orgName, registrationToken, domain });
              setScrapingComplete(true);
            } else {
              toast.error('Error while syncing website');
            }
            completed = true;
          } else {
            await new Promise(resolve => setTimeout(resolve, 15000));
          }
        }
      } catch (error) {
        console.error('Failed to sync website content:', error);
        toast.error(error?.data?.error || 'Failed to sync website content');
        setIsLoading(false);
        setCurrentPhase(PHASES.INITIAL);
      }
    },
    [getWebsiteValues, toast, router, handleNotification],
  );

  const onEmailSubmit = async data => {
    const domain = getWebsiteValues('domain');
    const domainName = extractDomain(domain);

    handleNotification(`[/new] Email submitted: ${data.email}`);

    const userData = {
      firstName: 'New',
      lastName: 'User',
      email: data.email,
      clinicWebsite: domain,
      clinicName: domainName,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      source: 'test-website',
    };

    try {
      setIsLoading(true);
      setCurrentPhase(PHASES.SCANNING);

      const response = await fetch('/api/send-setup-account-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      if (response.status === 409) {
        toast.error('Email already exists, please login');
        setIsLoading(false);
        setCurrentPhase(PHASES.INITIAL);
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to send setup email');
      }

      const responseData = await response.json();
      const newAssistantId = responseData.data?.data?.assistantId;
      const newOrgId = responseData.data?.data?.orgId;
      const registrationToken = responseData.data?.data?.registrationToken;

      if (!newAssistantId || !newOrgId || !registrationToken) {
        throw new Error('Missing assistantId or orgId or registrationToken in response');
      }

      // Store data in sessionStorage
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(
          'pendingSync',
          JSON.stringify({
            assistantId: newAssistantId,
            orgId: newOrgId,
            registrationToken: registrationToken,
            domain: domain,
            platform: selectedPlatform,
            painPoint: selectedPainPoint,
          }),
        );
      }

      await handleSync(newAssistantId, newOrgId, registrationToken);
    } catch (error) {
      console.error('Error in onSubmit:', error);
      toast.error(error?.data?.error || 'Failed to create AI agent');
      setIsLoading(false);
      setCurrentPhase(PHASES.INITIAL);
    }
  };

  const handleGoBack = () => {
    setShowEmailInput(false);
  };

  // Render loading phases
  const renderLoadingContent = () => {
    switch (currentPhase) {
      case PHASES.SCANNING:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center"
          >
            <div className="mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#058A7C]/10 flex items-center justify-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="w-10 h-10 flex items-center justify-center"
                >
                  <svg className="w-8 h-8 text-[#058A7C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </motion.div>
              </div>
              <h3 className="text-xl font-semibold text-secondary mb-2">{SCANNING_MESSAGES[scanMessageIndex]}</h3>
              <p className="text-secondary-light text-sm">This takes about 2-3 minutes</p>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <motion.div
                className="bg-[#058A7C] h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(scanProgress, 100)}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>

            {/* Found items */}
            <div className="flex justify-center gap-4 text-sm text-secondary-light">
              <span className="flex items-center gap-1">
                <span className="text-[#058A7C]">✓</span> {pagesFound} pages found
              </span>
            </div>
          </motion.div>
        );

      case PHASES.PLATFORM:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center"
          >
            <h3 className="text-xl font-semibold text-secondary mb-2">Quick question while we work...</h3>
            <p className="text-secondary-light text-sm mb-6">How did you build your site?</p>

            <div className="grid grid-cols-2 gap-3 mb-4">
              {PLATFORMS.map(platform => (
                <motion.button
                  key={platform.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedPlatform(platform.id)}
                  className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                    selectedPlatform === platform.id
                      ? 'border-[#058A7C] bg-[#058A7C]/5'
                      : 'border-gray-200 hover:border-[#058A7C]/50'
                  }`}
                >
                  {platform.icon ? <platform.icon className="w-8 h-8" /> : <span className="text-2xl">⚙️</span>}
                  <span className="text-sm font-medium text-secondary">{platform.name}</span>
                </motion.button>
              ))}
            </div>

            <div className="flex justify-between items-center">
              <p className="text-xs text-secondary-light">This helps us customize your setup experience</p>
              <button
                onClick={() => {
                  handleNotification('[/new] Platform skipped');
                  setCurrentPhase(PHASES.PAIN_POINT);
                }}
                className="text-xs text-secondary-light hover:text-[#058A7C] underline"
              >
                Skip
              </button>
            </div>
          </motion.div>
        );

      case PHASES.PAIN_POINT:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center"
          >
            <h3 className="text-xl font-semibold text-secondary mb-2">
              What&apos;s the #1 problem you&apos;re trying to solve?
            </h3>
            <p className="text-secondary-light text-sm mb-6">Select the most important to you</p>

            <div className="space-y-3 mb-4">
              {PAIN_POINTS.map(point => (
                <motion.button
                  key={point.id}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setSelectedPainPoint(point.id)}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left flex items-center gap-4 ${
                    selectedPainPoint === point.id
                      ? 'border-[#058A7C] bg-[#058A7C]/5'
                      : 'border-gray-200 hover:border-[#058A7C]/50'
                  }`}
                >
                  <span className="text-2xl">{point.icon}</span>
                  <div>
                    <div className="font-medium text-secondary">{point.title}</div>
                    <div className="text-sm text-secondary-light">{point.description}</div>
                  </div>
                </motion.button>
              ))}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => {
                  handleNotification('[/new] Pain point skipped');
                  setCurrentPhase(PHASES.COMMUNITY);
                }}
                className="text-xs text-secondary-light hover:text-[#058A7C] underline"
              >
                Skip
              </button>
            </div>
          </motion.div>
        );

      case PHASES.COMMUNITY:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#058A7C]/10 flex items-center justify-center">
              <span className="text-3xl">{scrapingComplete ? '✅' : '🎉'}</span>
            </div>
            <h3 className="text-xl font-semibold text-secondary mb-2">
              {scrapingComplete ? 'Your AI Agent is Ready!' : 'Almost ready!'}
            </h3>
            <p className="text-secondary-light text-sm mb-6">
              {scrapingComplete
                ? 'Click continue to test your AI agent'
                : 'Join our community while we finish building your agent'}
            </p>

            {!scrapingComplete && (
              <div className="mb-6 p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center justify-center gap-2 text-sm text-secondary-light">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-[#058A7C] border-t-transparent rounded-full"
                  />
                  <span>Still building your knowledge base...</span>
                </div>
              </div>
            )}

            {scrapingComplete ? (
              <button
                onClick={handleContinueToDemo}
                className="w-full px-6 py-3 bg-[#058A7C] text-white rounded-xl font-medium hover:bg-[#046b5f] transition-colors mb-6"
              >
                Continue to Demo
              </button>
            ) : (
              <a
                href="https://discord.gg/interworky"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#5865F2] text-white rounded-xl font-medium hover:bg-[#4752C4] transition-colors mb-6"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
                Join Discord Community
              </a>
            )}

            <div className="border-t border-gray-200 pt-4">
              <p className="text-sm text-secondary-light mb-2">Need help? Reach us anytime:</p>
              <a href="mailto:hello@interworky.com" className="text-[#058A7C] font-medium hover:underline">
                hello@interworky.com
              </a>
            </div>

            <div className="mt-4 flex justify-center gap-4 text-xs text-secondary-light">
              <a
                href="https://carla.interworky.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#058A7C]"
              >
                Docs
              </a>
              <Link href="/blog" className="hover:text-[#058A7C]">
                Blog
              </Link>
              <Link href="/changelog" className="hover:text-[#058A7C]">
                Changelog
              </Link>
            </div>
          </motion.div>
        );

      case PHASES.COMPLETE:
        return (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="w-20 h-20 mx-auto mb-4 rounded-full bg-[#058A7C] flex items-center justify-center"
            >
              <span className="text-4xl text-white">✓</span>
            </motion.div>
            <h3 className="text-2xl font-bold text-secondary mb-2">Your AI Agent is Ready!</h3>
            <p className="text-secondary-light mb-6">Redirecting you to test it out...</p>

            <div className="space-y-2 text-left bg-gray-50 rounded-xl p-4">
              {[
                'Pages analyzed',
                'Knowledge base created',
                'AI Support activated',
                'Bug Detection enabled',
                'Analytics tracking live',
              ].map((item, i) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-2 text-sm"
                >
                  <span className="text-[#058A7C]">✓</span>
                  <span className="text-secondary">{item}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-between bg-[linear-gradient(to_bottom,rgba(5,138,124,0.15),white)] relative overflow-hidden">
      {/* Floating particles background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-[#058A7C]/20 rounded-full"
            initial={{
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
              y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
            }}
            animate={{
              y: [null, Math.random() * -100 - 50],
              opacity: [0.3, 0],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        ))}
      </div>

      <div className="w-full max-w-4xl flex flex-col items-center justify-center flex-grow z-10 px-4">
        {/* Logo */}
        <div className="my-7">
          <Link href="/">
            <Image src="/finallogo.png" alt="Interworky Logo" width={300} height={60} priority />
          </Link>
        </div>

        {/* Header */}
        {!isLoading && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-7">
            <h1 className="text-3xl md:text-4xl font-bold text-secondary mb-2">Ship Fast. Stay Alive.</h1>
            <p className="text-secondary-light text-lg">See the AI layer your vibe-coded site is missing</p>
          </motion.div>
        )}

        {/* Main Card */}
        <motion.div
          layout
          className="bg-white rounded-3xl border-[#058A7C1F] border-[8px] shadow-lg p-8 w-full max-w-lg mb-12"
        >
          <AnimatePresence mode="wait">
            {isLoading ? (
              renderLoadingContent()
            ) : !showEmailInput ? (
              <motion.div key="website-form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="mb-4">
                  <Input
                    label="Test your website"
                    labelClassName="block font-medium mb-2 !text-secondary-light text-body"
                    className={`w-full ${
                      websiteErrors.domain ? 'border-red-500' : 'border-gray-300'
                    } px-4 py-6 font-normal rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#058A7C]`}
                    placeholder="https://your-awesome-site.com"
                    {...registerWebsite('domain', {
                      required: 'Website URL is required',
                      pattern: {
                        value:
                          /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
                        message: 'Please enter a valid website URL',
                      },
                    })}
                  />
                  {websiteErrors.domain && <p className="text-red-500 text-sm mt-1">{websiteErrors.domain.message}</p>}
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={handleWebsiteSubmit(onWebsiteSubmit)}
                    className="text-[#058A7C] text-body font-medium hover:text-[#046b5f] focus:outline-none underline flex items-center gap-1"
                  >
                    Next
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div key="email-form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <button
                      onClick={handleGoBack}
                      className="text-[#058A7C] text-body font-medium hover:text-[#046b5f] focus:outline-none underline flex items-center gap-1"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                      </svg>
                      Back
                    </button>
                  </div>

                  <Input
                    label="Your website"
                    labelClassName="block font-medium mb-2 !text-secondary-light text-body"
                    className="w-full font-normal border border-gray-300 rounded-2xl px-4 py-6 bg-gray-100 focus:outline-none"
                    value={getWebsiteValues('domain')}
                    disabled
                  />
                </div>
                <div className="mb-4">
                  <Input
                    label="Your email to continue"
                    labelClassName="block font-medium mb-2 !text-secondary-light text-body"
                    className={`w-full border ${
                      emailErrors.email ? 'border-red-500' : 'border-gray-300'
                    } rounded-2xl px-4 py-6 font-normal focus:outline-none focus:ring-2 focus:ring-[#058A7C]`}
                    placeholder="you@example.com"
                    {...registerEmail('email', {
                      required: 'Email address is required',
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: 'Please enter a valid email address',
                      },
                    })}
                  />
                  {emailErrors.email && <p className="text-red-500 text-sm mt-1">{emailErrors.email.message}</p>}
                </div>

                <Button
                  onClick={handleEmailSubmit(onEmailSubmit)}
                  className="w-full font-medium rounded-2xl bg-[#058A7C] hover:bg-[#046b5f] text-white py-3"
                  isLoading={isLoading}
                >
                  Create Your AI Agent
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Badges Carousel */}
        {!isLoading && (
          <div className="w-full md:w-1/2 md:fixed md:bottom-10 md:left-[50%] md:transform md:-translate-x-1/2 h-[80px] overflow-x-hidden relative bottom-5">
            <motion.div
              className="flex space-x-4"
              animate={{ x: [-900, 0, -900] }}
              transition={{
                x: {
                  duration: 40,
                  repeat: Infinity,
                  repeatType: 'loop',
                  ease: 'linear',
                },
              }}
            >
              {badges.concat(badges).map((badge, index) => (
                <motion.div
                  key={`${badge.id}-${index}`}
                  className="flex items-center bg-white/90 backdrop-blur-sm rounded-full cursor-pointer px-4 py-2 shadow-md border border-gray-100 min-w-max"
                  whileHover={{ scale: 1.05 }}
                >
                  <span className="text-xl mr-2">{badge.icon}</span>
                  <span className="text-sm font-medium text-secondary">{badge.text}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="w-full p-4 flex flex-col items-center text-sm text-secondary-light mb-2 gap-2">
        <div>
          Having issues?{' '}
          <a href="mailto:hello@interworky.com" className="text-[#058A7C] underline">
            hello@interworky.com
          </a>
        </div>
        <div className="flex gap-4 text-xs">
          <Link href="/privacy" className="hover:text-[#058A7C]">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-[#058A7C]">
            Terms
          </Link>
          <Link href="/docs" className="hover:text-[#058A7C]">
            Docs
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Page;
