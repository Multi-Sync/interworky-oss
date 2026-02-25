import React from 'react';
import { flexRender } from '@tanstack/react-table';
import { themeClasses, combineThemeClasses } from '@/_common/utils/themeUtils';

const ClientCard = ({ row }) => {
  const cells = row.getVisibleCells();
  const nameCell = cells.find(cell => cell.column.id === 'full_name');
  const emailCell = cells.find(cell => cell.column.id === 'email');
  const conversationCell = cells.find(cell => cell.column.id === 'conversation');
  const totalMessagesCell = cells.find(cell => cell.column.id === 'totalMessages');
  const lastActivityCell = cells.find(cell => cell.column.id === 'lastConversationDate');

  return (
    <div className="relative px-1 py-5 bg-white/90 dark:bg-[#0a0e27]/60 backdrop-blur-sm border border-gray-300 dark:border-primary/30 rounded-md shadow-lg shadow-gray-200/50 dark:shadow-primary/10 transition-colors duration-200">
      <div className="flex flex-col gap-2 py-2 pl-5">
        <div className="flex justify-between">
          <div className={combineThemeClasses('flex items-center gap-3 text-body', themeClasses.text.primary)}>
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
              className="lucide lucide-user text-purple-600 dark:text-primary"
            >
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            {flexRender(nameCell.column.columnDef.cell, nameCell.getContext())}
          </div>
          <div>{flexRender(conversationCell.column.columnDef.cell, conversationCell.getContext())}</div>
        </div>
        <div className={combineThemeClasses('flex items-center gap-2 text-body', themeClasses.text.secondary)}>
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
            className="lucide lucide-mail text-purple-600 dark:text-primary"
          >
            <rect width="20" height="16" x="2" y="4" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
          </svg>
          {flexRender(emailCell.column.columnDef.cell, emailCell.getContext())}
        </div>
        <div
          className={combineThemeClasses(
            'flex items-center justify-between text-body text-xs',
            themeClasses.text.tertiary,
          )}
        >
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-message-circle text-purple-600 dark:text-primary"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <div className="flex items-center gap-1">
                {flexRender(totalMessagesCell.column.columnDef.cell, totalMessagesCell.getContext())}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-clock text-purple-600 dark:text-primary"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12,6 12,12 16,14" />
              </svg>
              <span className={combineThemeClasses('text-xs', themeClasses.text.tertiary)}>Last seen:</span>
              {flexRender(lastActivityCell.column.columnDef.cell, lastActivityCell.getContext())}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientCard;
