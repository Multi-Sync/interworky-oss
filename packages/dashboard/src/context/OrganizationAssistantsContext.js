'use client';

import { createContext, useContext, useCallback, useEffect } from 'react';
import useSWR from 'swr';
import { fetcher } from '../_common/utils/swrFetcher';
import { getOrganization } from '@/_common/utils/localStorage';

const OrganizationAssistantsContext = createContext();

export function OrganizationAssistantsProvider({ children }) {
  const organizationId = getOrganization()?.organization.id;
  const { data, error, isLoading, mutate } = useSWR(
    organizationId ? `/api/models/organizationAssistants/${organizationId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
      dedupingInterval: 60000, // Cache for 1 minute
      shouldRetryOnError: false,
      errorRetryCount: 2,
      onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
        if (error?.status === 404 || error?.status === 500) return;
        if (retryCount >= 2) return;
      },
    },
  );

  const refreshAssistants = useCallback(() => {
    return mutate();
  }, [mutate]);

  // Save the first assistant ID to localStorage
  useEffect(() => {
    if (data?.organizationAssistants?.length > 0) {
      const assistantId = data.organizationAssistants[0].assistant_id;
      localStorage.setItem('interworky-assistant-id', assistantId);
    }
  }, [data]);

  const value = {
    organizationAssistants: data?.organizationAssistants || [],
    isLoading,
    error,
    refreshAssistants,
  };

  return <OrganizationAssistantsContext.Provider value={value}>{children}</OrganizationAssistantsContext.Provider>;
}

export function useOrganizationAssistants() {
  const context = useContext(OrganizationAssistantsContext);
  if (!context) {
    throw new Error('useOrganizationAssistants must be used within an OrganizationAssistantsProvider');
  }
  return context;
}
