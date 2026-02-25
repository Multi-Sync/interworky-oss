'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { getOrganization, getUser } from '@/_common/utils/localStorage';
import { isPlaceholderWebsite } from '@/_common/utils/utils';
import { EditPersonalInfo } from '../components/Dashboard/accountSettings/EditPersonalInfo';
import { EditOrganization } from '../components/Dashboard/accountSettings/EditOrganization';
import { GitHubVersionControlCard } from '../components/Dashboard/accountSettings/GitHubVersionControlCard';
import { ConnectGitHubModal } from '../components/Dashboard/accountSettings/ConnectGitHubModal';
import { DeleteGitHubModal } from '../components/Dashboard/accountSettings/DeleteGitHubModal';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import toast from 'react-hot-toast';
import { fetcher } from '@/_common/utils/swrFetcher';
import { useSessionManager } from '@/_common/hooks/useSession';
import { useSearchParams } from 'next/navigation';
import { useNotification } from '@/_common/utils/handleSlackNotification';

export default function SettingsView() {
  const searchParams = useSearchParams();
  const modal = searchParams.get('modal');

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isOrgEditModalOpen, setIsOrgEditModalOpen] = useState(modal == 'edit-website' ? true : false);
  const [isGitHubModalOpen, setIsGitHubModalOpen] = useState(false);
  const [isDeleteGitHubModalOpen, setIsDeleteGitHubModalOpen] = useState(false);
  const [githubData, setGithubData] = useState(null);
  const { session } = useSessionManager();
  const { handleNotification } = useNotification();
  const userId = getUser()?.id || session?.id;
  const org = getOrganization();
  const {
    data: userData,
    error: userError,
    mutate: mutateUser,
  } = useSWR(userId ? `/api/models/users/${userId}` : null, fetcher);

  const {
    data: organizationData,
    error: orgError,
    mutate: mutateOrg,
  } = useSWR(org?.organization?.id ? `/api/models/organizations/${org.organization.id}` : null, fetcher);

  const isLoading = (!userData && !userError) || (!organizationData && !orgError);
  const error = userError || orgError;

  if (error) {
    toast.error('An error occurred while fetching data.');
  }

  return (
    <div className="text-gray-700 dark:text-gray-300">
      <h1 className="lg:text-title my-4 text-lg font-medium text-gray-900 dark:text-gray-50">Account Settings</h1>

      <div className="md:px-12 px-8 rounded-lg py-6 bg-surface-light dark:bg-surface border border-border-default-light dark:border-border-default shadow-sm transition-colors duration-200">
        <div>
          <h2 className="my-4 font-medium text-subTitle flex items-center gap-2 tracking-tights text-primary">
            Your profile
          </h2>
          <div className="mb-5">
            <label className="text-body text-gray-600 dark:text-gray-400">Email</label>
            <div className="text-body mt-2 text-gray-800 dark:text-gray-300">
              {userData?.email || (
                <Skeleton width={200} baseColor="#e5e7eb" highlightColor="#f3f4f6" className="dark:!bg-[#1a1f3a]" />
              )}
            </div>
          </div>

          <div className="grid gap-16 md:grid-cols-2">
            {/* Personal Info Card */}
            <div>
              <div className="flex items-center justify-between bg-surface-elevated-light dark:bg-surface-elevated border border-border-default-light dark:border-border-default p-2 rounded-lg transition-colors duration-200">
                <div className="flex items-center gap-2 text-primary">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-user"
                  >
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <h3 className="text-body ml-2 font-medium text-primary">Personal Info</h3>
                </div>
                <button
                  className="text-primary hover:text-primary mr-4 transition-colors"
                  onClick={() => setIsEditModalOpen(true)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-pencil-line"
                  >
                    <path d="M12 20h9" />
                    <path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z" />
                    <path d="m15 5 3 3" />
                  </svg>
                </button>
              </div>
              <div className="mt-5">
                <div>
                  <label className="text-body text-gray-600 dark:text-gray-400">Name</label>
                  <div className="text-body mt-2 text-gray-800 dark:text-gray-300">
                    {isLoading ? (
                      <Skeleton
                        width={200}
                        baseColor="#e5e7eb"
                        highlightColor="#f3f4f6"
                        className="dark:!bg-[#1a1f3a]"
                      />
                    ) : error ? (
                      <span className="text-red-400 dark:text-red-400">{error.message}</span>
                    ) : (
                      `${userData?.first_name || ''} ${userData?.last_name || ''}`.trim() || 'N/A'
                    )}
                  </div>
                </div>
                <div className="mt-4">
                  <label className="text-body text-gray-600 dark:text-gray-400">Phone number</label>
                  <div className="text-body mt-2 text-gray-800 dark:text-gray-300">
                    {isLoading ? (
                      <Skeleton
                        width={200}
                        baseColor="#e5e7eb"
                        highlightColor="#f3f4f6"
                        className="dark:!bg-[#1a1f3a]"
                      />
                    ) : error ? (
                      <span className="text-red-400 dark:text-red-400">{error.message}</span>
                    ) : (
                      userData?.phone || 'N/A'
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Organization Info Card */}
            <div>
              <div className="flex items-center justify-between bg-surface-elevated-light dark:bg-surface-elevated border border-border-default-light dark:border-border-default p-2 rounded-lg transition-colors duration-200">
                <div className="flex items-center gap-2 text-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 16 16">
                    <path
                      fill="currentColor"
                      fillRule="evenodd"
                      d="m8.36 1.37l6.36 5.8l-.71.71L13 6.964v6.526l-.5.5h-3l-.5-.5v-3.5H7v3.5l-.5.5h-3l-.5-.5V6.972L2 7.88l-.71-.71l6.35-5.8zM4 6.063v6.927h2v-3.5l.5-.5h3l.5.5v3.5h2V6.057L8 2.43z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <h3 className="text-body ml-2 font-medium text-primary">Organization Info</h3>
                </div>
                <button
                  className="text-primary hover:text-primary mr-4 transition-colors disabled:opacity-50"
                  onClick={() => setIsOrgEditModalOpen(true)}
                  disabled={isLoading || error}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-pencil-line"
                  >
                    <path d="M12 20h9" />
                    <path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z" />
                    <path d="m15 5 3 3" />
                  </svg>
                </button>
              </div>
              <div className="mt-4">
                <label className="text-body text-gray-600 dark:text-gray-400">Name</label>
                <div className="text-body mt-2 text-gray-800 dark:text-gray-300">
                  {isLoading ? (
                    <Skeleton width={200} baseColor="#e5e7eb" highlightColor="#f3f4f6" className="dark:!bg-[#1a1f3a]" />
                  ) : error ? (
                    <span className="text-red-400 dark:text-red-400">{error.message}</span>
                  ) : (
                    organizationData?.organization?.organization_name || 'N/A'
                  )}
                </div>
              </div>
              <div className="mt-4">
                <label className="text-body text-gray-600 dark:text-gray-400">Website</label>
                <div className="text-body mt-2 mb-6 text-gray-800 dark:text-gray-300">
                  {isLoading ? (
                    <Skeleton width={300} baseColor="#e5e7eb" highlightColor="#f3f4f6" className="dark:!bg-[#1a1f3a]" />
                  ) : error ? (
                    <span className="text-red-400 dark:text-red-400">{error.message}</span>
                  ) : isPlaceholderWebsite(organizationData?.organization?.organization_website) ? (
                    <span className="text-gray-500 dark:text-gray-500 italic">No website set</span>
                  ) : (
                    <a
                      href={
                        organizationData?.organization?.organization_website?.startsWith('http')
                          ? organizationData?.organization?.organization_website
                          : `https://${organizationData?.organization?.organization_website}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary underline transition-colors"
                    >
                      {organizationData?.organization?.organization_website || 'N/A'}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* GitHub Integration Section */}
        <div className="mt-10">
          <h2 className="my-4 font-medium text-subTitle flex items-center gap-2 tracking-tights text-primary">
            Integrations
          </h2>
          <div className="max-w-2xl space-y-4">
            {/* Plugin Integration Guide Card */}
            <div
              className={`bg-surface-elevated-light dark:bg-surface-elevated border border-border-default-light dark:border-border-default rounded-lg p-6 transition-colors duration-200`}
            >
              <div className="flex items-center gap-2 text-primary mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-puzzle"
                >
                  <path d="M19.439 7.85c-.049.322.059.648.289.878l1.568 1.568c.47.47.706 1.087.706 1.704s-.235 1.233-.706 1.704l-1.611 1.611a.98.98 0 0 1-.837.276c-.47-.07-.802-.48-.968-.925a2.501 2.501 0 1 0-3.214 3.214c.446.166.855.497.925.968a.979.979 0 0 1-.276.837l-1.61 1.61a2.404 2.404 0 0 1-1.705.707 2.402 2.402 0 0 1-1.704-.706l-1.568-1.568a1.026 1.026 0 0 0-.877-.29c-.493.074-.84.504-1.02.968a2.5 2.5 0 1 1-3.237-3.237c.464-.18.894-.527.967-1.02a1.026 1.026 0 0 0-.289-.877l-1.568-1.568A2.402 2.402 0 0 1 1.998 12c0-.617.236-1.234.706-1.704L4.23 8.77c.24-.24.581-.353.917-.303.515.077.877.528 1.073 1.01a2.5 2.5 0 1 0 3.259-3.259c-.482-.196-.933-.558-1.01-1.073-.05-.336.062-.676.303-.917l1.525-1.525A2.402 2.402 0 0 1 12 1.998c.617 0 1.234.236 1.704.706l1.568 1.568c.23.23.556.338.877.29.493-.074.84-.504 1.02-.968a2.5 2.5 0 1 1 3.237 3.237c-.464.18-.894.527-.967 1.02Z" />
                </svg>
                <h3 className="text-body font-medium text-primary">Plugin Integration Guide</h3>
              </div>
              <p className="text-body text-gray-600 dark:text-gray-400 mb-4">
                Learn how to integrate Carla on your website with our step-by-step tutorial guide.
              </p>
              <button
                onClick={() => (window.location.href = '/dashboard/tutorial')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                <span>View Integration Guide</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-arrow-right"
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* GitHub Version Control Card */}
            <GitHubVersionControlCard
              organizationId={org?.organization?.id}
              onConnect={() => {
                setGithubData(null);
                setIsGitHubModalOpen(true);
              }}
              onEdit={() => {
                // Fetch current data and open edit modal
                fetch(`/api/mcp/github/status?organization_id=${org?.organization?.id}`)
                  .then(res => res.json())
                  .then(data => {
                    if (data.connected) {
                      setGithubData(data);
                      setIsGitHubModalOpen(true);
                    }
                  })
                  .catch(err => {
                    console.error('Error fetching GitHub data:', err);
                    toast.error('Failed to load GitHub settings');
                  });
              }}
              onDisconnect={() => {
                setIsDeleteGitHubModalOpen(true);
              }}
            />
          </div>
        </div>
      </div>

      {userData && (
        <EditPersonalInfo
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          userData={userData}
          onUpdate={async updatedUserData => {
            await mutateUser(updatedUserData, false);
          }}
        ></EditPersonalInfo>
      )}

      {organizationData && (
        <EditOrganization
          isOpen={isOrgEditModalOpen}
          onClose={() => setIsOrgEditModalOpen(false)}
          organizationData={organizationData.organization}
          onUpdate={async updatedData => {
            await mutateOrg(updatedData, false);
          }}
        ></EditOrganization>
      )}

      {org?.organization?.id && (
        <>
          <ConnectGitHubModal
            isOpen={isGitHubModalOpen}
            onClose={() => {
              setIsGitHubModalOpen(false);
              setGithubData(null);
            }}
            organizationId={org.organization.id}
            existingData={githubData}
            onSuccess={() => {
              // Trigger a refetch or refresh
              window.location.reload();
            }}
          />
          <DeleteGitHubModal
            isOpen={isDeleteGitHubModalOpen}
            onClose={() => setIsDeleteGitHubModalOpen(false)}
            organizationId={org.organization.id}
            onSuccess={() => {
              // Trigger a refetch or refresh
              window.location.reload();
            }}
          />
        </>
      )}

    </div>
  );
}
