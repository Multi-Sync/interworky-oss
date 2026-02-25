'use client';
import { useState } from 'react';
import { Button } from '../../ui/Button';

const { default: Image } = require('next/image');
const { Conversation } = require('./Conversation');

const ViewChat = ({ conversations, chatTitle, flag }) => {
  const [openConversationsHistory, setOpenConversationsHistory] = useState(false);

  if (!conversations || conversations.length === 0) return null;
  return (
    <>
      <Button
        className="flex items-center gap-2 text-body bg-gradient-to-r from-primary/30 to-primary/30 dark:from-primary/20 dark:to-primary/20 backdrop-blur-sm border border-primary/50 dark:border-primary/40 hover:border-primary hover:from-primary/40 hover:to-primary/40 dark:hover:from-primary/30 dark:hover:to-primary/30 text-primary hover:text-primary transition-all hover:shadow-lg hover:shadow-primary/30"
        intent={'secondary'}
        onClick={() => setOpenConversationsHistory(true)}
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
          className="lucide lucide-eye"
        >
          <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
          <circle cx="12" cy="12" r="3" />
        </svg>
        View Chat
      </Button>

      {openConversationsHistory && (
        <Conversation
          messages={conversations[0].messages}
          isOpen={openConversationsHistory}
          onClose={() => setOpenConversationsHistory(false)}
          chatTitle={chatTitle}
          flag={flag}
        />
      )}
    </>
  );
};

export default ViewChat;
