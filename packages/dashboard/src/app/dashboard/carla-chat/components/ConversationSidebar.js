'use client';

import { Plus, MessageSquare, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export const ConversationSidebar = ({
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  isLoading,
}) => {
  // Group conversations by date
  const groupByDate = convos => {
    const now = new Date();
    const today = [];
    const yesterday = [];
    const older = [];

    convos.forEach(convo => {
      const age = (now - new Date(convo.lastMessageAt)) / (1000 * 60 * 60 * 24);
      if (age < 1) today.push(convo);
      else if (age < 2) yesterday.push(convo);
      else older.push(convo);
    });

    return { today, yesterday, older };
  };

  const { today, yesterday, older } = groupByDate(conversations);

  return (
    <div className="w-80 bg-surface border-r border-border-default flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border-default">
        <button
          onClick={onNewConversation}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary hover:bg-primary-hover rounded-lg text-white font-medium transition-colors"
          disabled={isLoading}
        >
          <Plus className="w-5 h-5" />
          New Conversation
        </button>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto scrollbar">
        {isLoading ? (
          <div className="p-4 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-4 text-center text-gray-400">
            <p className="text-sm">No conversations yet</p>
            <p className="text-xs mt-1">Click &quot;New Conversation&quot; to start</p>
          </div>
        ) : (
          <>
            {today.length > 0 && (
              <ConversationGroup
                title="Today"
                conversations={today}
                currentId={currentConversationId}
                onSelect={onSelectConversation}
              />
            )}
            {yesterday.length > 0 && (
              <ConversationGroup
                title="Yesterday"
                conversations={yesterday}
                currentId={currentConversationId}
                onSelect={onSelectConversation}
              />
            )}
            {older.length > 0 && (
              <ConversationGroup
                title="Previous"
                conversations={older}
                currentId={currentConversationId}
                onSelect={onSelectConversation}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

const ConversationGroup = ({ title, conversations, currentId, onSelect }) => {
  const handleClick = convo => {
    onSelect(convo.id);
  };

  return (
    <div className="px-2 py-2">
      <h3 className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">{title}</h3>
      <div className="space-y-1">
        {conversations.map(convo => (
          <button
            key={convo.id}
            onClick={() => handleClick(convo)}
            className={`w-full text-left px-3 py-3 rounded-lg transition-all ${
              convo.id === currentId
                ? 'bg-primary/20 border-l-2 border-primary shadow-sm'
                : 'hover:bg-surface-elevated border-l-2 border-transparent'
            }`}
          >
            <div className="flex items-start gap-2">
              <MessageSquare
                className={`w-4 h-4 mt-1 flex-shrink-0 ${convo.id === currentId ? 'text-primary' : 'text-gray-400'}`}
              />
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium truncate ${convo.id === currentId ? 'text-gray-100' : 'text-gray-200'}`}
                >
                  {convo.title || 'New Conversation'}
                </p>
                {convo.preview && <p className="text-xs text-gray-500 truncate mt-0.5">{convo.preview}</p>}
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-xs text-gray-600">
                    {formatDistanceToNow(new Date(convo.lastMessageAt), { addSuffix: true })}
                  </p>
                  {convo.messageCount > 0 && (
                    <>
                      <span className="text-gray-600">•</span>
                      <p className="text-xs text-gray-600">{convo.messageCount} messages</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
