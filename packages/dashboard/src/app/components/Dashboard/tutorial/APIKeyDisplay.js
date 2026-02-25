'use client';

import { useState } from 'react';
import Skeleton from 'react-loading-skeleton';
import { Button } from '../../ui/Button';

const APIKeyDisplay = ({ apiKey, isLoading }) => {
  const [copySuccess, setCopySuccess] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(apiKey);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error('Failed to copy API Key: ', err);
      setCopySuccess(false);
    }
  };

  return (
    <div className="flex w-full flex-col justify-between rounded-lg bg-gray-50 dark:bg-[#0a0e27]/60 backdrop-blur-sm border border-gray-300 dark:border-primary/30 p-4 md:w-[94%] md:flex-row md:items-start md:gap-4 md:p-6 shadow-lg dark:shadow-primary/10">
      {isLoading ? (
        <Skeleton
          width="100%"
          height={20}
          count={3}
          baseColor="#e5e7eb"
          highlightColor="#f3f4f6"
          className="dark:!bg-[#1a1f3a]"
        />
      ) : (
        <div className="flex w-full flex-col gap-4 md:flex-row md:items-start">
          <pre className="break-all font-Inter whitespace-pre-wrap text-body text-gray-800 dark:text-gray-300 md:mr-4 md:flex-1">
            {' '}
            {apiKey ? apiKey : 'No API Key Available'}
          </pre>
          <Button
            onClick={handleCopy}
            className="shrink-0 bg-gradient-to-r from-primary/30 to-primary/30 dark:from-primary/20 dark:to-primary/20 border border-primary/50 dark:border-primary/40 hover:border-primary hover:from-primary/40 hover:to-primary/40 dark:hover:from-primary/30 dark:hover:to-primary/30 text-primary hover:text-primary transition-all hover:shadow-lg hover:shadow-primary/30"
          >
            {copySuccess ? 'Copied!' : 'Copy'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default APIKeyDisplay;
