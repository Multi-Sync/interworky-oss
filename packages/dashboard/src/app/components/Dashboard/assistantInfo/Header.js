import { useAssistantContext } from '@/_common/context/AssistantContext';
import { getOrganization } from '@/_common/utils/localStorage';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Button } from '../../ui/Button';
import MediaDisplay from './MediaDisplay';
import useApiKey from '@/_common/hooks/useApiKey';

export default function AssistantHeader({ isChatting, handleChatting }) {
  const { state } = useAssistantContext();
  const orgName = getOrganization()?.organization?.organization_name;
  const { apiKey } = useApiKey();
  return (
    <div className="lg:flex items-center hidden gap-4">
      <Link
        href={`/org/${orgName}?apikey=${apiKey}`}
        className={
          'flex gap-2 items-center px-4 py-2 rounded-lg border border-dashed text-primary border-primary/50 text-body hover:border-primary transition-all'
        }
        intent={'secondary'}
        id="preview"
      >
        <span>Preview</span>
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
          className="lucide lucide-eye"
        >
          <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </Link>
      <Button
        className="text-body flex items-center gap-2 bg-primary/20 dark:bg-gradient-to-r dark:from-primary/20 dark:to-primary/20 backdrop-blur-sm border border-primary/50 hover:border-primary/70 dark:hover:border-primary text-primary hover:bg-primary/30 dark:hover:from-primary/30 dark:hover:to-primary/30 transition-all hover:shadow-lg hover:shadow-primary/30"
        intent={'secondary'}
        id="share"
        onClick={async () => {
          try {
            const orgName = getOrganization().organization.organization_name;
            const dashboardUrl = process.env.NEXT_PUBLIC_API_URL;
            await navigator.clipboard.writeText(`${dashboardUrl}/org/${orgName}?apikey=${apiKey}`);
            toast.success(`Public Link Copied to clipboard`);
          } catch (err) {
            console.error('Failed to copy!', err);
          }
        }}
      >
        Share
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
          className="lucide lucide-share-2"
        >
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <line x1="8.59" x2="15.42" y1="13.51" y2="17.49" />
          <line x1="15.41" x2="8.59" y1="6.51" y2="10.49" />
        </svg>
      </Button>
      <Button
        className={
          'flex justify-start w-[150px] text-body bg-gradient-to-r from-primary to-primary hover:shadow-lg hover:shadow-primary/50 text-white transition-all border-0'
        }
        intent={'secondary'}
        onClick={handleChatting}
        id="chat-trial"
      >
        <span>{isChatting ? 'Close Chat' : 'Test Agent'}</span>
        <MediaDisplay
          mediaUrl={state.imageUrl}
          width={30}
          height={30}
          style="object-cover rounded-full w-[45px] h-[45px] top-1/2 -right-1 absolute -translate-y-1/2 ring ring-primary ring-offset-1"
        />
      </Button>
    </div>
  );
}
