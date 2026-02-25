import InfoLabel from '@/app/components/InfoTooltip';
import { getInterworkyAssistantId, getOrganization } from '@/_common/utils/localStorage';
import { isPlaceholderWebsite } from '@/_common/utils/utils';
import { useState, useEffect, useRef } from 'react';

import toast from 'react-hot-toast';
import { Button } from '../../ui/Button';
import Link from 'next/link';
import useAssistantState from '@/_common/hooks/useAssistantState';
import { getEnvironment } from '@/lib/utils';

async function fetchGcpFile(gcsUrl) {
  try {
    // Encode the URL so it fits into the dynamic segment
    const encoded = encodeURIComponent(gcsUrl);
    const res = await fetch(`/api/gcp/${encoded}`);
    if (!res.ok) {
      console.error(`API returned ${res.status} ${res.statusText}`);
      return '';
    }
    const knowledgeText = await res.text();
    return knowledgeText;
  } catch (err) {
    console.error('Failed to fetch GCP file:', err);
    return '';
  }
}
function getGCPFileUrl(domain) {
  const orgId = getOrganization()?.organization?.id;
  if (!orgId) {
    console.error('Organization ID not found in local storage');
    return '';
  }
  let orgDomainName = domain;
  try {
    const { hostname } = new URL(orgDomainName);
    orgDomainName = hostname.replace(/^www\./, '');
  } catch (err) {
    console.error('error parsing organization website URL:', err);
    console.error('Invalid URL:', orgDomainName);
    toast.error('Error syncing website content. Please check the domain name.');
    return '';
  }
  return `https://storage.googleapis.com/multisync/interworky/interworky-orgs/${getEnvironment()}/${orgId}/summary-${orgDomainName}.txt`;
}

const WebSiteSyncStatus = () => {
  const domain = getOrganization()?.organization.organization_website;
  const [syncStatus, setSyncStatus] = useState({
    domain: domain || 'No domain set',
    status: 'Loading',
    lastSyncDate: 'N/A',
  });
  const [isLoading, setIsLoading] = useState(false);
  const { mutateAssistantData } = useAssistantState();

  const formatDate = utcDateString => {
    if (!utcDateString || utcDateString === 'N/A') return 'N/A';
    const dateWithoutDoubleQuotes = utcDateString.replace(/^"|"$/g, '');
    const date = new Date(dateWithoutDoubleQuotes); // Parse UTC date string
    // Extract date components
    const options = { month: 'numeric', day: 'numeric', year: 'numeric' };
    const datePart = new Intl.DateTimeFormat(undefined, options).format(date);

    let hours = date.getHours(); // Get hours in 24-hour format
    const period = hours >= 12 ? 'pm' : 'am'; // Determine AM/PM
    hours = hours % 12 || 12; // Convert to 12-hour format, ensuring 0 becomes 12

    return `${datePart}, ${hours}${period}`;
  };

  const handleSync = async () => {
    setIsLoading(true);
    localStorage.setItem('syncInProgress', true);
    try {
      // Validate the domain
      if (!domain) {
        toast.error(`Invalid domain: ${domain}`);
        setIsLoading(false);
        return;
      }

      // Start the scraping job
      const response = await fetch('/api/scraper', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`, // Replace with your auth logic
        },
        body: JSON.stringify({
          domain,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start the scraping job');
      }

      const data = await response.json();
      const { jobId } = data;

      if (!jobId) {
        throw new Error('Job ID not returned from the scraper');
      }

      let statusData;
      // Poll for job status
      const checkJobStatus = async () => {
        const statusResponse = await fetch(`/api/scraper/${jobId}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (!statusResponse.ok) {
          throw new Error('Failed to fetch job status');
        }

        statusData = await statusResponse.json();
        return statusData;
      };

      let completed,
        errorWhileSyncing = false;
      while (!completed && !errorWhileSyncing) {
        statusData = await checkJobStatus();
        if (statusData.status === 'completed') {
          if (statusData.result) {
            setSyncStatus(prevStatus => ({
              ...prevStatus,
              status: 'completed',
              lastSyncDate: formatDate(statusData.result),
            }));
            completed = true;
          } else {
            errorWhileSyncing = true;
          }
        } else {
          await new Promise(resolve => setTimeout(resolve, 10000)); // Wait for 10 seconds
        }
      }
      if (errorWhileSyncing) {
        console.error('Error while syncing website:', statusData);
        toast.error('Error while syncing website');
      }
    } catch (error) {
      console.error('Failed to sync website content:', error);
      toast.error('Failed to sync website content');
    } finally {
      setIsLoading(false);
    }
  };

  const updateAssisanKnowledgeInBackend = async knowledgeText => {
    const orgId = getOrganization()?.organization?.id;
    const assistantId = getInterworkyAssistantId();
    if (!orgId || !assistantId) {
      console.error('Organization ID or Assistant ID not found in local storage');
      return false;
    }
    const updatedData = {
      organization_id: orgId,
      assistant_id: assistantId,
      assistant_knowledge: knowledgeText,
    };
    const response = await fetch(`/api/assistant-info/${orgId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedData),
    });
    if (!response.ok) {
      console.error('Failed to update AI Agent knowledge in backend');
      return false;
    } else {
      return true;
    }
  };

  useEffect(() => {
    const fetchStatus = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/scraper/domain', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ domain }), // Correctly structured body
        });

        if (response.status === 404) {
          setSyncStatus({ domain, status: 'Not Synced', lastSyncDate: 'N/A' });
          return;
        }
        if (!response.ok) {
          throw new Error('Failed to fetch domain status');
        }
        const result = await response.json();
        setSyncStatus({
          domain,
          status: result.status,
          lastSyncDate: formatDate(result.data),
        });
      } catch (error) {
        console.error('Failed to fetch domain status', error);
        setSyncStatus({ domain, status: 'Error', lastSyncDate: 'N/A' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatus();
  }, [domain]);

  useEffect(() => {
    const updateAssistantKnowledge = async () => {
      const fileUrl = getGCPFileUrl(syncStatus.domain);
      const knowledgeText = await fetchGcpFile(fileUrl);
      if (knowledgeText) {
        const isUpdated = await updateAssisanKnowledgeInBackend(knowledgeText);
        if (isUpdated) {
          mutateAssistantData(); // Revalidate SWR cache
          toast.success('Knowledgebase updated successfully! Click Test Agent to test the updated knowledge.');
        } else {
          console.error('Failed to update knowledge in backend');
          toast.error('Failed to sync knowledgebase. Please try again later.');
        }
      } else {
        console.error('Failed to fetch knowledge text from GCP');
        toast.error('Failed to fetch knowledge text from GCP');
      }
    };
    // queued, processing statuses should show loading state
    if (syncStatus.status === 'queued' || syncStatus.status === 'processing') {
      setIsLoading(true);
      return; // no need to fetch file URL or update knowledge
    }
    if (syncStatus.status === 'completed' && localStorage.getItem('syncInProgress') === 'true') {
      setIsLoading(true);
      updateAssistantKnowledge(); // Fetch the file from GCP and update knowledge since sync is completed
      // ^ Will Mutate the assistant data in the SWR cache
      localStorage.setItem('syncInProgress', false);
      setIsLoading(false);
      return;
    } else if (syncStatus.status === 'completed') {
      // console.warn('Sync completed but no sync in progress');
    }
  }, [mutateAssistantData, syncStatus]);

  return (
    <div
      className="flex flex-col gap-8 items-start mt-4 lg:flex-row md:justify-between lg:items-center"
      id="website-sync-status"
    >
      <InfoLabel
        label="Website Syncing"
        tooltipText="All of your website content will be synced within the Agent Knowledge Base. You can start syncing the website content by clicking the button below."
      />

      {/* Desktop and Medium View */}
      <div className="hidden md:block w-full md:w-full lg:w-[700px]">
        <div className="grid grid-cols-3 mb-2 text-body">
          <div className="ml-5 text-start text-gray-300">Domain</div>
          <div className="text-start lg:mr-36 md:text-center md:mr-32 text-gray-300">Status</div>
          <div className="text-start md:-ml-20 text-white">Last Sync Date</div>
        </div>

        <div className="flex gap-4 items-center">
          <div className="flex-1 rounded-lg border border-[#D9D9D9] bg-white h-[48px]">
            <div className="grid grid-cols-3 content-center items-center h-full">
              <div className="flex justify-start items-center overflow-hidden">
                {isPlaceholderWebsite(syncStatus.domain) || syncStatus.domain === 'No domain set' ? (
                  <Link
                    href={'/dashboard/settings?modal=edit-website'}
                    className=" flex items-center justify-center rounded-lg  w-full  h-[48px] border-dashed border  font-semibold border-primary text-primary "
                  >
                    Add your website
                  </Link>
                ) : (
                  <span
                    className="px-5 py-2 text-secondary bg-[#FAFAFA] rounded-[8px_0px_0px_8px] overflow-hidden text-ellipsis whitespace-nowrap max-w-[200px]"
                    title={syncStatus.domain}
                  >
                    {syncStatus.domain}
                  </span>
                )}
              </div>
              <div className="text-center  mt-[-5px]">
                {isLoading ? (
                  <span className="text-tertiary">Fetching...</span>
                ) : (
                  <div className="flex gap-2 justify-center items-center mr-5 md:justify-center md:gap-0 md:ml-6">
                    <div
                      className={`h-2 w-2 rounded-full mr-2 ${syncStatus.status === 'Error' ? 'bg-red-500' : 'bg-green-500'} `}
                    />
                    <span
                      className={syncStatus.status === 'Error' ? 'text-red-600' : 'text-green-600  whitespace-nowrap'}
                    >
                      {syncStatus.status}
                    </span>
                  </div>
                )}
              </div>
              <div className="text-start mt-[-5px] lg:-mr-8 md:ml-8 text-black">{syncStatus.lastSyncDate}</div>
            </div>
          </div>
          <Button
            onClick={e => {
              e.preventDefault();
              handleSync();
            }}
            isLoading={isLoading}
            intent={'secondary'}
            className="text-body"
          >
            {isLoading ? 'Syncing' : 'Start Syncing'}
          </Button>
        </div>
      </div>

      {/* Mobile View */}
      <div className="w-full md:hidden">
        <div className="p-4 space-y-4 bg-white rounded-lg border border-gray-200 shadow-sm">
          <div>
            <span className="font-semiBold text-gray-300">Domain: </span>
            {isPlaceholderWebsite(syncStatus.domain) || syncStatus.domain === 'No domain set' ? (
              <Link
                href={'/dashboard/settings?modal=edit-website'}
                className="flex items-center justify-center rounded-lg w-full h-[42px] mt-2 border-dashed border font-semibold border-primary text-primary"
              >
                Add your website
              </Link>
            ) : (
              <span className="break-all" title={syncStatus.domain}>
                {syncStatus.domain}
              </span>
            )}
          </div>
          <div>
            <span className="font-semiBold text-gray-300">Status: </span>
            {isLoading ? (
              <span className="text-tertiary">Fetching...</span>
            ) : (
              <span className={syncStatus.status === 'Error' ? 'text-red-600' : 'text-green-600 '}>
                {syncStatus.status}
              </span>
            )}
          </div>
          <div>
            <span className="font-semiBold text-gray-300">Last Sync Date: </span>
            <span className="text-black">{syncStatus.lastSyncDate}</span>
          </div>
          <Button
            className={'w-full'}
            onClick={e => {
              e.preventDefault();
              handleSync();
            }}
            isLoading={isLoading}
            intent={'secondary'}
          >
            Start Syncing
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WebSiteSyncStatus;
