import useCustomCapability from '@/_common/hooks/useCustomCapability';
import InfoLabel from '@/app/components/InfoTooltip';
import { useState } from 'react';
import { BeatLoader } from 'react-spinners';
import AiCapabilityBuilder from './AiCapabilityBuilder';
import ReviewCapabilityModal from './ReviewCapabilityModal';
import { Button } from '../../ui/Button';
import useAssistantState from '@/_common/hooks/useAssistantState';

const CustomCapabilities = () => {
  const { state, isLoadingCustomCapabilitiesData } = useCustomCapability();
  const { state: assistantState } = useAssistantState();
  const [isAiBuilderOpen, setIsAiBuilderOpen] = useState(false);
  const [isManageCapabilityOpen, setIsManageCapabilityOpen] = useState(false);
  const [generatedCapability, setGeneratedCapability] = useState(null);

  // Capability limit
  const capabilityLimit = 50;
  const currentCount = state.capabilities?.length || 0;
  const isAtLimit = currentCount >= capabilityLimit;
  const remaining = capabilityLimit - currentCount;

  const handleOpenAiBuilder = () => {
    if (isAtLimit) {
      return; // Don't open if at limit
    }
    setIsAiBuilderOpen(true);
  };

  const handleCloseAiBuilder = () => {
    setIsAiBuilderOpen(false);
  };

  const handleCapabilityGenerated = capability => {
    // AI generated a capability, now open the review dialog
    setGeneratedCapability(capability);
    setIsManageCapabilityOpen(true);
  };

  const handleCloseManageCapability = () => {
    setIsManageCapabilityOpen(false);
    setGeneratedCapability(null);
  };

  return (
    <>
      <div className="my-4 w-full hidden sm:block">
        {/* <FeatureGuard featureKey={'premium'}> */}
        <div className="flex justify-between items-center mb-5 text-secondary p-6">
          <div className="flex items-center gap-4">
            <InfoLabel
              label="Custom Capabilities"
              tooltipText="Custom capabilities allow you to add functionality to your AI Agent to make web requests or send emails based on user requests"
            />
            {/* Capability Count and Limit */}
            <div className="flex items-center gap-2">
              <span
                className={`text-sm font-medium px-3 py-1 rounded-full ${
                  isAtLimit
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
                    : remaining <= 5
                      ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
                }`}
              >
                {currentCount} / {capabilityLimit}
              </span>
              <InfoLabel
                label=""
                tooltipText="Limit: 50 capabilities. Having too many tools can confuse the AI agent about which one to use, reducing response quality."
                hideLabel={true}
              />
            </div>
          </div>
          <div className="flex gap-4 items-center">
            <Button
              type="button"
              className={`flex items-center gap-2 text-body ${
                isAtLimit
                  ? 'bg-gray-100 border border-gray-300 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-primary/20 to-primary/20 border border-primary/40 hover:border-primary hover:from-primary/30 hover:to-primary/30 text-primary hover:text-primary transition-all hover:shadow-lg hover:shadow-primary/30'
              }`}
              onClick={handleOpenAiBuilder}
              intent={'secondary'}
              disabled={isAtLimit}
              title={
                isAtLimit ? 'Capability limit reached. Please delete some capabilities first.' : 'Add a new capability'
              }
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  fill="currentColor"
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"
                />
              </svg>
              <p>Add Capability</p>
            </Button>
          </div>
        </div>

        {/* Warning message when at or near limit */}
        {isAtLimit && (
          <div className="mx-6 mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-red-600 flex-shrink-0 mt-0.5"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-red-800">Capability Limit Reached</p>
              <p className="text-sm text-red-700 mt-1">
                You&apos;ve reached the maximum of {capabilityLimit} custom capabilities. Please delete some unused
                capabilities before adding new ones. Having too many tools can confuse the AI agent.
              </p>
            </div>
          </div>
        )}

        {remaining <= 5 && !isAtLimit && (
          <div className="mx-6 mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-yellow-600 flex-shrink-0 mt-0.5"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-yellow-800">Approaching Limit</p>
              <p className="text-sm text-yellow-700 mt-1">
                You can add {remaining} more {remaining === 1 ? 'capability' : 'capabilities'}. Consider removing unused
                ones to stay organized.
              </p>
            </div>
          </div>
        )}
        {/* </FeatureGuard> */}
        {isLoadingCustomCapabilitiesData && (
          <div className="flex justify-center w-full">
            {' '}
            <BeatLoader color="#058A7C" size={16} />
          </div>
        )}
        {state.capabilities.length > 0 &&
          state.capabilities.map(capability => <Capability key={capability.id} capability={capability} />)}
      </div>

      {/* AI Capability Builder Dialog */}
      <AiCapabilityBuilder
        isOpen={isAiBuilderOpen}
        onClose={handleCloseAiBuilder}
        onCapabilityGenerated={handleCapabilityGenerated}
        organizationEmail={null} // Optional: can be populated with actual organization email later
      />

      {/* Review Capability Dialog for AI-generated capability */}
      {generatedCapability && (
        <ReviewCapabilityModal
          isOpen={isManageCapabilityOpen}
          onClose={handleCloseManageCapability}
          capability={generatedCapability}
        />
      )}
    </>
  );
};

export default CustomCapabilities;

const Capability = ({ capability }) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const onOpenEdit = () => setIsEditModalOpen(true);
  const onCloseEdit = () => setIsEditModalOpen(false);
  const { mutateCustomCapabilities } = useCustomCapability();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const onDelete = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/models/organization-methods/${capability.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete capability');
      }
      const result = await response.json();
      mutateCustomCapabilities();
    } catch (err) {
      console.error('Error deleting:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Prepare capability for editing - keep the same structure but ensure all fields are present
  const capabilityForEditing = {
    id: capability.id,
    method_name: capability.method_name.split('_').join(' '), // Display with spaces
    method_description: capability.method_description,
    method_instruction: capability.method_instruction,
    capability_type: capability.capability_type || 'http',
    method_verb: capability.method_verb,
    method_endpoint: capability.method_endpoint,
    email_config: capability.email_config || {
      to: '',
      subject: '',
      from_name: 'Interworky Assistant',
      template_type: 'simple',
    },
    dynamic_params: capability.dynamic_params || [],
    fixed_params: capability.fixed_params || [],
  };
  return (
    <div className="bg-white/80 dark:bg-[#0a0e27]/60 backdrop-blur-sm border border-gray-300 dark:border-primary/30 p-5 rounded-lg hover:border-gray-400 dark:hover:border-primary/50 transition-all">
      <div className="flex justify-between items-center">
        <h2 className="py-3 text-base font-semibold text-gray-900 dark:text-primary">
          {capability.method_name.split('_').join(' ')}
        </h2>
        <div className="flex gap-3 items-center">
          <button
            type="button"
            onClick={onOpenEdit}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-[#0a0e27]/60 border border-gray-400 dark:border-primary/30 rounded-lg text-gray-700 dark:text-primary hover:bg-gray-200 dark:hover:border-primary/50 hover:text-gray-900 dark:hover:text-primary transition-all"
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
            >
              <path d="M12 20h9" />
              <path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z" />
              <path d="m15 5 3 3" />
            </svg>
            <span className="text-sm">Edit</span>
          </button>

          <button
            type="button"
            className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-[#0a0e27]/60 border border-red-400 dark:border-red-500/30 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:border-red-500/50 hover:text-red-700 dark:hover:text-red-300 transition-all disabled:opacity-50"
            disabled={isLoading}
            onClick={onDelete}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
              <path
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="m18 9l-.84 8.398c-.127 1.273-.19 1.909-.48 2.39a2.5 2.5 0 0 1-1.075.973C15.098 21 14.46 21 13.18 21h-2.36c-1.279 0-1.918 0-2.425-.24a2.5 2.5 0 0 1-1.076-.973c-.288-.48-.352-1.116-.48-2.389L6 9m7.5 6.5v-5m-3 5v-5m-6-4h4.615m0 0l.386-2.672c.112-.486.516-.828.98-.828h3.038c.464 0 .867.342.98.828l.386 2.672m-5.77 0h5.77m0 0H19.5"
              />
            </svg>
            <span className="text-sm">{isLoading ? 'Deleting...' : 'Delete'}</span>
          </button>
        </div>
      </div>
      <div>
        <ul className="space-y-3 text-sm">
          <li className="pl-2">
            <span className="text-primary font-medium">Description:</span>{' '}
            <span className="text-gray-700 dark:text-gray-300">{capability.method_description}</span>
          </li>
          <li className="pl-2">
            <span className="text-primary font-medium">When to use:</span>{' '}
            <span className="text-gray-700 dark:text-gray-300">{capability.method_instruction}</span>
          </li>
        </ul>
      </div>
      <ReviewCapabilityModal isOpen={isEditModalOpen} onClose={onCloseEdit} capability={capabilityForEditing} />
    </div>
  );
};
