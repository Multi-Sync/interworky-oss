'use client';

import { useReducer, useEffect, useRef } from 'react';
import { getOrganization } from '@/_common/utils/localStorage';
import { fetcher } from '@/_common/utils/swrFetcher';
import useSWR from 'swr';
import toast from 'react-hot-toast';

const initialState = {
  assistantId: '',
  organizationId: '',
  isModalOpen: false,
  name: '',
  charCount: 0,
  knowledge: '',
  personality: '',
  imageUrl: 'https://storage.googleapis.com/multisync/interworky-gpt/Carla.png',
  uploadedFile: null,
  primaryColor: '#FFFFFF',
  secondaryColor: '#058A7C',
  errorColor: '#FF6666',
  textPrimary: '#000000',
  textSecondary: '#ffffff',
  contactInfoRequired: false,
  enableAppointments: false,
  openingStatement: '',
  openingStatementCharCount: 0,
  firstMessage: '',
  voiceEnabled: false,
  isUpdating: false,
  premium: false,
  dimScreen: false,
  realTimeInstructions: [],
  viewType: '',
  cxEnabled: false,
  monitoringEnabled: true,
  analyticsEnabled: false,
};

const assistantReducer = (state, action) => {
  switch (action.type) {
    case 'SET_MODAL':
      return { ...state, isModalOpen: action.payload };
    case 'SET_NAME':
      return { ...state, name: action.payload, charCount: action.payload.length };
    case 'SET_IMAGE':
      return { ...state, imageUrl: action.payload.url, uploadedFile: action.payload.file };
    case 'SET_COLORS':
      return { ...state, ...action.payload };
    case 'SET_CAPABILITIES':
      return { ...state, ...action.payload };
    case 'SET_CONTENT':
      return { ...state, ...action.payload };
    case 'SET_ORGANIZATION_ID':
      return { ...state, organizationId: action.payload };
    case 'SET_UPDATING':
      return { ...state, isUpdating: action.payload };
    case 'SET_KNOWLEDGE':
      return { ...state, knowledge: action.payload };
    case 'SET_STATEMENT':
      return { ...state, openingStatement: action.payload, openingStatementCharCount: action.payload.length };
    case 'SET_FIRST_MESSAGE':
      return { ...state, firstMessage: action.payload };
    case 'SET_REAL_TIME_INSTRUCTIONS':
      return { ...state, realTimeInstructions: action.payload };
    case 'SET_VIEW_TYPE':
      return { ...state, viewType: action.payload.viewType };
    case 'UPDATE_FIELD':
      return { ...state, [action.field]: action.value };
    default:
      return state;
  }
};
const useAssistantState = () => {
  const [state, dispatch] = useReducer(assistantReducer, initialState);
  const isInitialLoadRef = useRef(true);
  const lastDataRef = useRef(null);

  useEffect(() => {
    const org = getOrganization();
    if (org?.organization?.id) {
      dispatch({ type: 'SET_ORGANIZATION_ID', payload: org.organization.id });
    }
    // Don't show toast here - let the layout handle authentication redirects
  }, []);

  const {
    data: assistantData,
    error: assistantError,
    isLoading: isLoadingAssistantData,
    mutate: mutateAssistantData,
  } = useSWR(state.organizationId ? `/api/assistant-info/${state.organizationId}` : null, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 10000, // Prevent duplicate requests within 10 seconds
  });

  useEffect(() => {
    if (!assistantData) return;

    // Check if data actually changed (prevent unnecessary resets)
    const dataChanged = JSON.stringify(assistantData) !== JSON.stringify(lastDataRef.current);

    // Only update state on initial load or when data actually changes
    if (isInitialLoadRef.current || dataChanged) {
      lastDataRef.current = assistantData;
      isInitialLoadRef.current = false;

      dispatch({
        type: 'SET_CONTENT',
        payload: {
          name: assistantData.assistant_name,
          imageUrl: assistantData.assistant_image_url,
          knowledge: assistantData.assistant_knowledge,
          personality: assistantData.assistant_personality,
          primaryColor: assistantData.primary_color,
          secondaryColor: assistantData.secondary_color,
          errorColor: assistantData.error_color,
          textPrimary: assistantData.text_primary_color,
          textSecondary: assistantData.text_secondary_color,
          contactInfoRequired: assistantData.contact_info_required,
          enableAppointments: assistantData.appointments_enabled,
          voiceEnabled: assistantData.voice_enabled,
          premium: assistantData.premium,
          charCount: assistantData.assistant_name?.length,
          openingStatement: assistantData.opening_statement,
          openingStatementCharCount: assistantData.opening_statement?.length,
          firstMessage: assistantData.first_message,
          assistantId: assistantData.assistant_id,
          dimScreen: assistantData.dim_screen,
          realTimeInstructions: assistantData.real_time_instructions || [],
          viewType: assistantData.view_type,
          cxEnabled: assistantData.cx_enabled !== undefined ? assistantData.cx_enabled : false,
          monitoringEnabled: assistantData.monitoring_enabled !== undefined ? assistantData.monitoring_enabled : true,
          analyticsEnabled: assistantData.analytics_enabled !== undefined ? assistantData.analytics_enabled : false,
        },
      });
    }
  }, [assistantData]);

  const updateAssistantInfo = async onSuccess => {
    dispatch({ type: 'SET_UPDATING', payload: true });

    try {
      let newImageUrl = undefined;
      if (state.uploadedFile) {
        newImageUrl = await uploadImage();
        state.uploadedFile = undefined;
      }
      const assistantId = state.assistantId;

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
        cx_enabled: state.cxEnabled,
        monitoring_enabled: state.monitoringEnabled,
        analytics_enabled: state.analyticsEnabled,
      };
      const response = await fetch(`/api/assistant-info/${state.organizationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      });

      if (!response.ok) throw new Error('Failed to update AI Agent information');

      // Don't trigger a refetch that would overwrite our local state
      // The local state is already updated, so we just need to confirm the API call succeeded
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error updating AI Agent info:', error);
      toast.error(error.message || 'Failed to update AI Agent information');
    } finally {
      dispatch({ type: 'SET_UPDATING', payload: false });
    }
  };

  return { state, dispatch, assistantError, isLoadingAssistantData, mutateAssistantData, updateAssistantInfo };
};
export default useAssistantState;
