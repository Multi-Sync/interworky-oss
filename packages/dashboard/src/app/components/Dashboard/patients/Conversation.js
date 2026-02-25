// conversation.js

import Dialog from '../../Dialog';
import { Message } from './Message';
import { groupMessagesByDay } from '@/_common/utils/utils';
import Image from 'next/image';

const processFirstMessage = messages => {
  if (!messages.length) return messages;

  const firstMessage = messages[1];
  const defaultGreeting = 'Hi, How can I help you today?,';

  if (firstMessage.role === 'user' && firstMessage.content[0].text.value.startsWith(defaultGreeting)) {
    const userQuestion = firstMessage.content[0].text.value.replace(defaultGreeting, '').trim();
    return [
      {
        role: 'assistant',
        content: [{ text: { value: defaultGreeting } }],
        created_at: firstMessage.created_at,
      },
      {
        role: 'user',
        content: [{ text: { value: userQuestion } }],
        created_at: firstMessage.created_at,
      },
      ...messages.slice(2),
    ];
  }

  return messages;
};

export const Conversation = ({ messages, chatTitle, flag, isOpen, onClose }) => {
  return (
    <Dialog
      title={
        <div className="flex items-center justify-start gap-2">
          <Image src={flag} width={20} height={12} alt={chatTitle} />
          <span className="text-base truncate max-w-[120px] md:max-w-[170px] lg:max-w-[400px]">{chatTitle}</span>
        </div>
      }
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-xs md:max-w-md lg:max-w-md !bg-white/95 dark:!bg-[#0a0e27]/95 !backdrop-blur-xl !border !border-gray-300 dark:!border-primary/30 max-h-svh !p-4 lg:!p-8 !shadow-2xl dark:!shadow-primary/20"
      childrenStyle={`max-h-[70vh] scrollbar overflow-y-scroll bg-transparent`}
    >
      <>
        {Object.entries(groupMessagesByDay(messages || [])).map(([day, messagesGroup]) => (
          <div key={day}>
            <div className="flex items-center my-6">
              <hr className="flex-grow border-gray-300 dark:border-primary/30" />
              <span className="px-4 py-1 text-sm font-medium text-primary bg-primary/30 dark:bg-primary/20 backdrop-blur-sm rounded-full border border-primary/50 dark:border-primary/30">
                {day}
              </span>
              <hr className="flex-grow border-gray-300 dark:border-primary/30" />
            </div>
            {messagesGroup.map((message, index) => (
              <Message
                key={message.id || index}
                index={index}
                message={message.content}
                messageTime={message.timestamp}
                role={message.role}
                messageData={message}
              />
            ))}
          </div>
        ))}
      </>
    </Dialog>
  );
};
