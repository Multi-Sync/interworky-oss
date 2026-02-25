'use client';

import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import dynamic from 'next/dynamic';
import toast from 'react-hot-toast';
import { parseMarkdownContent } from '@/_common/utils/parseMarkdownContent';
import InfoLabel from '@/app/components/InfoTooltip';
import { BeatLoader } from 'react-spinners';
import { Button } from '../../ui/Button';
import { customMarkdownRenderers } from '@/_common/utils/customMarkdownRenderers';

const MdEditor = dynamic(() => import('react-markdown-editor-lite'), { ssr: false });

const DEFAULT_KNOWLEDGE =
  'You are AI ChatBout, who has not been set up yet. The setup process can be done with the Interworky Dashboard.';

const EDITOR_CONFIG = {
  view: { menu: true, md: true, html: false },
  canUploadImage: false,
};

const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-32">
    <BeatLoader color="#6B7280" />
  </div>
);

const EditButton = ({ onEdit }) => (
  <Button onClick={onEdit} intent="secondary" className="flex items-center gap-2 text-body">
    Edit{' '}
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
      className="lucide lucide-pencil"
    >
      <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
      <path d="m15 5 4 4" />
    </svg>
  </Button>
);

const ExitEditButton = ({ onExit }) => (
  <Button onClick={onExit} intent="secondary">
    Exit Editor Mode
  </Button>
);

const Knowledge = ({ knowledge, onKnowledgeChange, onEditModeChange }) => {
  const [viewMode, setViewMode] = useState('preview');
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsInitialLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  const hasKnowledge = knowledge && knowledge !== DEFAULT_KNOWLEDGE;

  const handleEdit = e => {
    e.preventDefault();
    setViewMode('edit');
    onEditModeChange(true);
  };

  const handleExitEdit = e => {
    e.preventDefault();
    setViewMode('preview');
    onEditModeChange(false);
    toast.success('Knowledge has been edited. Click Save to apply changes.');
  };

  const PreviewContent = ({ content }) => (
    <pre className="whitespace-pre-wrap font-Inter break-words text-balance bg-gray-100 text-secondary text-body md:mr-4">
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} components={customMarkdownRenderers}>
        {parseMarkdownContent(content)}
      </ReactMarkdown>
    </pre>
  );

  const renderContent = () => {
    if (isInitialLoading) return <LoadingSpinner />;
    if (!hasKnowledge) return <div className="text-tertiary italic">No Custom knowledgebase added yet.</div>;
    return <PreviewContent content={knowledge} />;
  };

  return (
    <div className="w-full relative flex flex-col" id="customize-knowledge-base">
      <div className="flex items-center justify-between gap-4 w-full">
        <InfoLabel
          label="Agent Custom Knowledge Base"
          tooltipText="Add custom knowledge base for your AI Agent in addition to your website knowledge base to provide more accurate responses to user questions."
        />
        <div className="mb-4">
          {viewMode === 'preview' ? <EditButton onEdit={handleEdit} /> : <ExitEditButton onExit={handleExitEdit} />}
        </div>
      </div>
      {viewMode === 'preview' ? (
        <div
          className="bg-gray-100 p-4 text-body font-normal rounded-lg overflow-y-auto overflow-x-hidden assistant-knowledge-scroll-bar prose w-full md:max-w-full sm:max-w-full text-container"
          style={{ maxHeight: '400px', maxWidth: '100%' }}
        >
          {renderContent()}
        </div>
      ) : (
        <div className="relative w-full">
          <MdEditor
            value={hasKnowledge ? knowledge : ''}
            style={{ height: '400px' }}
            renderHTML={text => (
              <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} components={customMarkdownRenderers}>
                {text}
              </ReactMarkdown>
            )}
            onChange={({ text }) => onKnowledgeChange(text)}
            config={EDITOR_CONFIG}
          />
        </div>
      )}
    </div>
  );
};

export default Knowledge;
