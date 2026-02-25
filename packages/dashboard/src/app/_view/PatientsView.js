'use client';

import { useCallback, useLayoutEffect, useMemo, useState } from 'react';

import NotFound from '../components/NotFound';
import Pagination from '../components/Dashboard/Pagination';
import SearchBar from '@/app/components/SearchBar';
import Table from '@/app/components/Dashboard/Table';
import debounce from 'lodash.debounce';
import { fetcher } from '@/_common/utils/swrFetcher';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { BeatLoader } from 'react-spinners';
import { ArrowLeft } from 'lucide-react';
import { themeClasses, combineThemeClasses } from '@/_common/utils/themeUtils';
import ThemeToggle from '@/app/components/ThemeToggle';

const ClientsView = () => {
  const { control } = useForm();
  const router = useRouter();

  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsloading] = useState(true);

  // Memoize the organization ID and fetch URL
  const organizationString = typeof window !== 'undefined' ? localStorage.getItem('organization') : null;

  const conversationsKey = useMemo(() => {
    if (!organizationString) {
      router.push('/login');
      return null;
    }
    const organizationObject = JSON.parse(organizationString);
    const organization_id = organizationObject.organization.id;
    // Fetch all conversations to get unique clients, don't paginate here
    return `/api/models/conversations/organization/${organization_id}?skip=0&limit=1000`;
  }, [organizationString, router]);

  // Use SWR for fetching conversations
  const {
    data: conversationsData,
    isLoading: conversationsLoading,
    error: conversationsError,
    mutate: mutateConversations,
  } = useSWR(conversationsKey, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  // Extract unique patient identifiers from conversations (backward compatible)
  const uniquePatientIds = useMemo(() => {
    if (!conversationsData?.conversations) return [];
    // Use patientId if available, otherwise fall back to email (backward compatible)
    const patientIds = conversationsData.conversations
      .map(conv => {
        return conv.patientId || conv.patientEmail || conv.email || conv.patient?.email || conv.patient?.id;
      })
      .filter(Boolean); // Remove any null/undefined values

    const uniqueIds = [...new Set(patientIds)];
    return uniqueIds;
  }, [conversationsData]);

  // Fetch all patients for the organization (we'll filter them later)
  const patientsKey = useMemo(() => {
    if (!organizationString) return null;
    const organizationObject = JSON.parse(organizationString);
    const organization_id = organizationObject.organization.id;
    // Fetch all patients, we'll filter them based on conversation identifiers
    return `/api/models/patients/${organization_id}?limit=1000&skip=0`;
  }, [organizationString]);

  const {
    data: patientsData,
    isLoading: patientsLoading,
    error: patientsError,
  } = useSWR(patientsKey, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  useLayoutEffect(() => {
    if (!conversationsLoading && !patientsLoading) {
      setIsloading(false);
    }
  }, [conversationsLoading, patientsLoading, isLoading]);

  // Extract unique clients from conversations and patient data (backward compatible)
  const extractUniqueClients = (conversations, patients) => {
    if (!conversations?.conversations) return { clients: [], totalPages: 0 };

    // Get unique patient identifiers from conversations (backward compatible)
    const uniquePatientIds = [
      ...new Set(
        conversations.conversations
          .map(conv => {
            return conv.patientId || conv.patientEmail || conv.email || conv.patient?.email || conv.patient?.id;
          })
          .filter(Boolean),
      ),
    ];
    // Group conversations by patient identifier (backward compatible)
    const conversationMap = conversations.conversations.reduce((map, conversation) => {
      const identifier =
        conversation.patientId ||
        conversation.patientEmail ||
        conversation.email ||
        conversation.patient?.email ||
        conversation.patient?.id;
      if (identifier) {
        if (!map[identifier]) {
          map[identifier] = [];
        }
        map[identifier].push(conversation);
      }
      return map;
    }, {});

    // Create a lookup map for patient data (backward compatible)
    const patientMap = {};
    if (patients?.patients) {
      patients.patients.forEach(patient => {
        // Map by both ID and email for backward compatibility
        if (patient.id) patientMap[patient.id] = patient;
        if (patient.email) patientMap[patient.email] = patient;
      });
    }

    // Create client objects with conversation data and patient info (backward compatible)
    const clients = uniquePatientIds.map(identifier => {
      const patientConversations = conversationMap[identifier] || [];
      const latestConversation = patientConversations.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
      const patientData = patientMap[identifier] || {};

      // Calculate total messages across all conversations for this client
      const totalMessages = patientConversations.reduce((total, conversation) => {
        return total + (conversation.messages?.length || 0);
      }, 0);

      // If we don't have patient data, try to extract from conversation
      let clientData = {
        id: identifier,
        first_name: patientData.first_name || 'Anonymous',
        last_name: patientData.last_name || 'Client',
        email: patientData.email || identifier, // Use identifier as email if it's an email
        phone: patientData.phone || 'No phone',
        timezone: patientData.timezone || 'UTC',
        conversations: patientConversations,
        lastConversationDate: latestConversation?.createdAt || new Date(),
        totalConversations: patientConversations.length,
        totalMessages: totalMessages,
      };

      // If identifier looks like an email and we don't have patient data, use it as email
      if (!patientData.id && identifier.includes('@')) {
        clientData.email = identifier;
      }

      return clientData;
    });

    // Apply search filter to full dataset
    const filteredClients = searchTerm
      ? clients.filter(
          client =>
            client.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            client.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            client.email.toLowerCase().includes(searchTerm.toLowerCase()),
        )
      : clients;

    // Sort the filtered clients by last conversation date (most recent first)
    const sortedClients = filteredClients.sort((a, b) => {
      const dateA = new Date(a.lastConversationDate);
      const dateB = new Date(b.lastConversationDate);
      return dateB - dateA; // Most recent first
    });

    // Calculate pagination for sorted clients
    const itemsPerPage = 5;
    const totalPages = Math.ceil(sortedClients.length / itemsPerPage);
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedClients = sortedClients.slice(startIndex, endIndex);

    return {
      clients: paginatedClients,
      totalPages,
      total: sortedClients.length,
    };
  };

  const clientsData = extractUniqueClients(conversationsData, patientsData);
  const clients = clientsData || { clients: [], totalPages: 0 };

  const handleSearchChange = debounce(value => {
    setSearchTerm(value);
    setPage(1); // Reset to first page when searching
    // No need to refetch data, search is applied client-side
  }, 300); // Debounce by 300ms

  const handleNextPage = useCallback(() => {
    setPage(prev => Math.min(clients.totalPages, prev + 1));
  }, [clients.totalPages]);

  const handlePreviousPage = useCallback(() => {
    setPage(prev => Math.max(1, prev - 1));
  }, []);

  const handlePageChange = newPage => {
    setPage(newPage);
  };

  // Add loading state check
  if (isLoading) {
    return (
      <div className="text-primary flex justify-center items-center h-full">
        <BeatLoader size={24} color="#a855f7" />
      </div>
    );
  }
  if (conversationsError || patientsError) {
    return <NotFound title="Error loading conversations data" />;
  }
  const renderContent = () => {
    if (!isLoading && clients.clients?.length === 0) return <NotFound title={`No Conversations Found`} />;
    return (
      <div>
        <Table
          type={'clients'}
          data={clients}
          mutate={mutateConversations}
          isLoading={isLoading}
          error={conversationsError || patientsError}
        />
        {clients.clients.length > 0 && (
          <Pagination
            currentPage={page}
            totalPages={clients.totalPages}
            onPrevious={handlePreviousPage}
            onNext={handleNextPage}
            onPageChange={handlePageChange}
          />
        )}
      </div>
    );
  };

  return (
    <div className={combineThemeClasses('relative min-h-screen', themeClasses.text.primary)}>
      {/* Theme Toggle - Top Right */}
      <div className="flex justify-end mb-4">
        <ThemeToggle />
      </div>

      {/* Back Button */}
      <button
        onClick={() => router.push('/dashboard/customer-support')}
        className={combineThemeClasses(
          'flex items-center gap-2 transition-colors group mb-4',
          themeClasses.text.secondary,
          themeClasses.hover.text,
        )}
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm">Back to Chat Widget</span>
      </button>

      <h3 className={combineThemeClasses('lg:text-title my-4 text-lg font-medium', themeClasses.text.primary)}>
        Conversations
      </h3>
      <div className="mb-5">
        <SearchBar control={control} onSearchChange={handleSearchChange} />
      </div>
      {renderContent()}
    </div>
  );
};

export default ClientsView;
