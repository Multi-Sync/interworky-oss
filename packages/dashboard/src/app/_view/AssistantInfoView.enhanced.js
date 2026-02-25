'use client';

import 'react-markdown-editor-lite/lib/index.css';
import { getInterworkyAssistantId, getUser } from '@/_common/utils/localStorage';
import { useEffect, useMemo, useState } from 'react';
import { mutate } from 'swr';
import AssistantHeader from '../components/Dashboard/assistantInfo/Header';
import Script from 'next/script';
import Skeleton from 'react-loading-skeleton';
import { ChatManager } from '@/_common/classes/chatManager';
import toast from 'react-hot-toast';
import useApiKey from '@/_common/hooks/useApiKey';
import { useNotification } from '@/_common/utils/handleSlackNotification';
import useScriptSrc from '@/_common/hooks/useScriptSrc';
import useAssistantState from '@/_common/hooks/useAssistantState';
import GeneralTab from '../components/Dashboard/assistantInfo/GeneralTab';
import CapabilitiesTab from '../components/Dashboard/assistantInfo/CapabilitiesTab';
import { AssistantContext } from '@/_common/context/AssistantContext';
import { useOrganizationAssistants } from '@/context/OrganizationAssistantsContext';
import { useSessionManager } from '@/_common/hooks/useSession';
import AdvancedTab from '../components/Dashboard/assistantInfo/AdvancedTab';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { GlassCard, GlassButton, GlassTab, ParticleBackground, GlassBadge } from '../components/ui/Glassmorphism';
import { Settings, Sparkles, Zap, ArrowLeft } from 'lucide-react';
import { themeClasses, combineThemeClasses } from '@/_common/utils/themeUtils';
import { useTheme } from '@/context/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

export default function AssistantsInfoEnhanced() {
  const { state, dispatch, assistantError, isLoadingAssistantData, updateAssistantInfo } = useAssistantState();
  const { isDark } = useTheme();

  // Theme-aware skeleton colors
  const skeletonBaseColor = isDark ? '#1a1f3a' : '#e5e7eb';
  const skeletonHighlightColor = isDark ? '#2a2f4a' : '#f3f4f6';
  const { handleNotification } = useNotification();
  const chatManager = useMemo(() => ChatManager.getInstance(), []);
  const [isChatting, setIsChatting] = useState(chatManager.getStatus());
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam || 'general');
  const scriptSrc = useScriptSrc();
  const { apiKey } = useApiKey();
  const { session } = useSessionManager();
  const userEmail = getUser()?.email || session?.email;

  const { isLoading: isLoadingAssistants } = useOrganizationAssistants();

  const handleChattingOnSave = () => {
    chatManager.reinject();
    setIsChatting(true);
    localStorage.removeItem('patient');
    localStorage.removeItem('conversationId');
  };

  const handleChatting = () => {
    const newStatus = chatManager.toggleChat();
    setIsChatting(newStatus);
  };

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = tab => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleFileChange = event => {
    const file = event.target.files[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Please upload a valid image file (JPEG, PNG, GIF, WEBP, or SVG)');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error('File size must be less than 10MB');
      return;
    }

    dispatch({
      type: 'SET_IMAGE',
      payload: {
        url: URL.createObjectURL(file),
        file,
      },
    });
  };

  const uploadImage = async () => {
    if (!state.uploadedFile) return state.imageUrl;

    try {
      const formData = new FormData();
      formData.append('file', state.uploadedFile);
      const response = await fetch(`/api/assistant-info/img/${state.organizationId}`, {
        method: 'PUT',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to upload profile picture');

      const { message } = await response.json();
      toast.success('Profile picture updated successfully');
      return message;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload profile picture');
      throw error;
    }
  };

  const handleSubmit = async event => {
    event.preventDefault();
    dispatch({ type: 'SET_UPDATING', payload: true });

    try {
      let newImageUrl = undefined;
      if (state.uploadedFile) {
        newImageUrl = await uploadImage();
        state.uploadedFile = undefined;
      }
      const assistantId = getInterworkyAssistantId();

      if (!assistantId) {
        throw new Error('Assistant ID not found');
      }
      const updatedData = {
        assistant_id: assistantId,
        assistant_name: state.name,
        assistant_image_url: newImageUrl ? newImageUrl : state.imageUrl,
        primary_color: state.primaryColor,
        secondary_color: state.secondaryColor,
        error_color: state.errorColor,
        text_primary_color: state.textPrimary,
        text_secondary_color: state.textSecondary,
        assistant_personality: state.personality,
        contact_info_required: state.contactInfoRequired,
        appointments_enabled: state.enableAppointments,
        voice_enabled: state.voiceEnabled,
        assistant_knowledge: state.knowledge,
        opening_statement: state.openingStatement,
        first_message: state.firstMessage,
        premium: state.premium,
        dim_screen: state.dimScreen,
        event_type: state.event_type,
        business_address: state.business_address,
        real_time_instructions: state.realTimeInstructions,
        view_type: state.viewType,
      };

      const response = await fetch(`/api/assistant-info/${state.organizationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      });

      if (!response.ok) throw new Error('Failed to update AI Agent information');

      mutate(`/api/assistant-info/${state.organizationId}`);
      handleChattingOnSave();
      toast.success('AI Agent information updated successfully');
      handleNotification(`${userEmail} updated their AI Agent info.`);
    } catch (error) {
      console.error('Error updating AI Agent info:', error);
      toast.error(error.message || 'Failed to update AI Agent information');
    } finally {
      dispatch({ type: 'SET_UPDATING', payload: false });
    }
  };

  const handleTabContent = () => {
    switch (activeTab) {
      case 'general':
        return <GeneralTab handleFileChange={handleFileChange} />;
      case 'capabilities':
        return <CapabilitiesTab />;
      case 'advanced':
        return <AdvancedTab handleFileChange={handleFileChange} />;
      default:
        return <GeneralTab handleFileChange={handleFileChange} />;
    }
  };

  // Tab configuration with icons
  const tabs = [
    { id: 'general', label: 'General', icon: <Settings className="w-4 h-4" /> },
    { id: 'capabilities', label: 'Capabilities', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'advanced', label: 'Advanced', icon: <Zap className="w-4 h-4" /> },
  ];

  if (isLoadingAssistantData || isLoadingAssistants) {
    return (
      <div className="text-secondary">
        <Skeleton height={300} baseColor={skeletonBaseColor} highlightColor={skeletonHighlightColor} />
      </div>
    );
  }

  if (assistantError) {
    return <div className="text-red-500">Failed to load AI Agent information.</div>;
  }

  return (
    <AssistantContext.Provider value={{ state, dispatch }}>
      {/* Fixed background with particles */}
      <div className="fixed inset-0 bg-app-bg-light dark:bg-app-bg -z-10 transition-colors duration-200">
        <ParticleBackground particleCount={30} color="gray" />
      </div>

      {/* Scrollable content */}
      <div className="relative min-h-screen pb-20">
        {/* Theme Toggle - Top Right */}
        <div className="flex justify-end mb-4 px-4 md:px-8">
          <ThemeToggle />
        </div>

        <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
          {/* Back Button */}
          <button
            onClick={() => router.push('/dashboard/customer-support')}
            className={combineThemeClasses(
              'flex items-center gap-2 transition-colors group mb-2',
              themeClasses.text.secondary,
              themeClasses.hover.text,
            )}
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm">Back to Chat Widget</span>
          </button>

          {isLoadingAssistantData ? (
            <Skeleton count={5} baseColor={skeletonBaseColor} highlightColor={skeletonHighlightColor} />
          ) : (
            <>
              {/* Header Card */}
              <GlassCard variant="gray" accentColor="gray" delay={0}>
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className={combineThemeClasses('text-2xl font-bold', themeClasses.text.primary)}>
                      Carla Configuration
                    </h1>
                    <p className={combineThemeClasses('text-sm mt-1 hidden md:block', themeClasses.text.secondary)}>
                      Customize your Carla&apos;s personality, appearance, and capabilities
                    </p>
                  </div>
                  <AssistantHeader isChatting={isChatting} handleChatting={handleChatting} />
                </div>
              </GlassCard>

              {/* Tab Navigation */}
              <div className="flex justify-center">
                <GlassTab tabs={tabs} activeTab={activeTab} onTabChange={handleTabChange} accentColor="gray" />
              </div>

              {/* Main Content Card */}
              <GlassCard variant="content" accentColor="gray" delay={0.2}>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Tab Content */}
                  <div className="min-h-[400px]">{handleTabContent()}</div>

                  {/* Save Button */}
                  <div className="flex justify-end pt-6 border-t border-border-default-light dark:border-border-default">
                    <GlassButton
                      type="submit"
                      variant="primary"
                      accentColor="gray"
                      isLoading={state.isUpdatig}
                      className="px-12"
                    >
                      Save Configuration
                    </GlassButton>
                  </div>
                </form>
              </GlassCard>
            </>
          )}
        </div>
      </div>

      {/* Assistant Script */}
      {apiKey && scriptSrc && (
        <Script
          src={scriptSrc}
          data-api-key={apiKey}
          data-position="bottom-50 right-50"
          data-voice-only="true"
          strategy="lazyOnload"
          onError={e => {
            console.error('Interworky Plugin failed to load', e);
            toast.error('Interworky Plugin failed to load');
            handleChatting();
          }}
        />
      )}
    </AssistantContext.Provider>
  );
}
