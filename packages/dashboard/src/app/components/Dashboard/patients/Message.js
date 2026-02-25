import useAssistantState from '@/_common/hooks/useAssistantState';
import { formatMessageTime } from '@/_common/utils/utils';
import Image from 'next/image';

const isMetadataMessage = message => {
  const patterns = [
    /The user.*metadata/i,
    /The user.*speaking.*from/i,
    /user ip is/i,
    /browser type is/i,
    /time now for the user/i,
    /timezone is/i,
    /preferred language is/i,
  ];

  return patterns.some(pattern => pattern.test(message));
};
const newChat = message => {
  return message === 'I can assist to you via text or voice, which one do you prefer?';
};

export const Message = ({ message, messageTime, role, index, messageData }) => {
  const { state } = useAssistantState();

  // Handle both old format (string) and new format (object)
  const messageContent = typeof message === 'string' ? message : message;
  const reaction = messageData?.reaction || null;

  if (isMetadataMessage(messageContent)) {
    return null;
  }
  return (
    <div>
      {newChat(messageContent) && index != 0 && (
        <div className="flex items-center my-6">
          <hr className="flex-grow border-red-500/30" />
          <span className="px-4 py-1 text-sm font-medium text-red-400 bg-red-500/20 backdrop-blur-sm rounded-full border border-red-500/30">
            Chat Closed
          </span>
          <hr className="flex-grow border-red-500/30" />
        </div>
      )}
      <div
        className={`${role == 'assistant' ? 'bg-gray-100 dark:bg-[#0a0e27]/80 backdrop-blur-xl mr-auto ml-4 rounded-ss-none text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-primary/20 shadow-lg dark:shadow-primary/10' : 'bg-gradient-to-r from-primary to-primary ml-auto mr-1 text-white rounded-se-none shadow-lg shadow-primary/30'} w-fit max-w-[70%] break-words p-4 mt-6 text-left rounded-[15px] text-balance relative`}
      >
        {messageContent}

        {role == 'assistant' && (
          <Image
            src={state.imageUrl}
            alt="assistant-img"
            height={42}
            width={42}
            className=" -top-5 -left-2 ring-1 absolute object-cover w-8 h-8 bg-cover rounded-full"
          />
        )}
      </div>

      {/* Reaction Display */}
      {reaction !== null && reaction !== 0 && (
        <div className={`flex items-center gap-1 mt-2 ${role == 'assistant' ? 'ml-4' : 'ml-auto mr-1 justify-end'}`}>
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
              reaction === 1
                ? 'bg-green-100 text-green-700'
                : reaction === 2
                  ? 'bg-red-100 text-red-700'
                  : 'bg-gray-100 text-gray-700'
            }`}
          >
            {reaction === 1 && (
              <>
                <span>👍</span>
                <span>Liked</span>
              </>
            )}
            {reaction === 2 && (
              <>
                <span>👎</span>
                <span>Disliked</span>
              </>
            )}
          </div>
        </div>
      )}
      <div
        className={`${role == 'assistant' ? ' mr-auto text-left ml-1' : ' ml-auto text-right mr-1'} mt-1 text-xs text-gray-600 dark:text-gray-500`}
      >
        {messageTime ? formatMessageTime(messageTime) : ''}
      </div>
    </div>
  );
};
