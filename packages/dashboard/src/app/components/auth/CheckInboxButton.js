'use client';

import { useEffect, useState } from 'react';

export default function CheckInboxButton({ userEmail }) {
  const [mailLink, setMailLink] = useState('https://www.google.com/search?q=check+email+login');
  const [providerLabel, setProviderLabel] = useState(null);

  useEffect(() => {
    if (!userEmail) return;

    const domain = userEmail.split('@')[1]?.toLowerCase();

    const webmailLinks = {
      'gmail.com': 'https://mail.google.com/',
      'googlemail.com': 'https://mail.google.com/',
      'outlook.com': 'https://outlook.live.com/',
      'hotmail.com': 'https://outlook.live.com/',
      'live.com': 'https://outlook.live.com/',
      'yahoo.com': 'https://mail.yahoo.com/',
      'ymail.com': 'https://mail.yahoo.com/',
      'icloud.com': 'https://www.icloud.com/mail',
      'me.com': 'https://www.icloud.com/mail',
      'aol.com': 'https://mail.aol.com/',
      'protonmail.com': 'https://mail.proton.me/',
      'zoho.com': 'https://mail.zoho.com/',
      'gmx.com': 'https://www.gmx.com/',
      'mail.com': 'https://www.mail.com/int/',
    };

    if (domain) {
      const provider = domain.split('.')[0];
      setProviderLabel(provider.charAt(0).toUpperCase() + provider.slice(1));
      setMailLink(webmailLinks[domain] || 'https://www.google.com/search?q=check+email+login');
    }
  }, [userEmail]);

  return (
    <div className="flex flex-col items-start mt-4">
      <a
        href={mailLink}
        target="_blank"
        rel="noopener noreferrer"
        className="text-white bg-primary px-4 py-3 rounded-md"
      >
        Check Inbox
      </a>
      {providerLabel && <span className="text-sm text-gray-400 mt-2 px-4 py-3">Using: {providerLabel}</span>}
    </div>
  );
}
