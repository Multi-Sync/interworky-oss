'use client';

import { useState, useEffect } from 'react';
import Dialog from '../../Dialog';
import { Button } from '../../ui/Button';
import useAssistantState from '@/_common/hooks/useAssistantState';
import useCustomCapability from '@/_common/hooks/useCustomCapability';
import useFireToast from '@/_common/hooks/fireToast';

export default function ReviewCapabilityModal({ isOpen, onClose, capability: initialCapability }) {
  const [capability, setCapability] = useState(initialCapability);
  const [isSaving, setIsSaving] = useState(false);
  const { state } = useAssistantState();
  const { mutateCustomCapabilities } = useCustomCapability();
  const toast = useFireToast();

  // Update capability when initialCapability changes
  useEffect(() => {
    if (initialCapability) {
      // Ensure required fields exist with defaults
      const safeCapability = {
        ...initialCapability,
        dynamic_params: initialCapability.dynamic_params || [],
        fixed_params: initialCapability.fixed_params || [],
        email_config: initialCapability.email_config || {
          to: '',
          subject: '',
          from_name: 'Interworky Assistant',
          template_type: 'simple',
        },
      };
      setCapability(safeCapability);
    }
  }, [initialCapability]);

  const handleSave = async () => {
    setIsSaving(true);

    try {
      const data = {
        organization_id: state.organizationId,
        assistant_id: state.assistantId,
        method_name: capability.method_name.split(' ').join('_'), // Convert spaces to underscores
        method_description: capability.method_description,
        method_instruction: capability.method_instruction,
        capability_type: capability.capability_type || 'http',
        dynamic_params: capability.dynamic_params || [],
        fixed_params: capability.fixed_params || [],
        auth: '',
        public: true,
      };

      // Add type-specific fields
      if (data.capability_type === 'http') {
        data.method_verb = capability.method_verb;
        data.method_endpoint = capability.method_endpoint;
      } else if (data.capability_type === 'email') {
        data.email_config = capability.email_config;
      }

      // Determine if we're editing or creating based on ID
      const isEditing = capability.id;
      const url = isEditing ? `/api/models/organization-methods/${capability.id}` : '/api/models/organization-methods';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to save capability');
      }

      const result = await response.json();

      // Show warning if it exists (e.g., hitting OpenAI's 128 tool limit)
      if (result.warning) {
        toast.warning('Capability Saved', result.warning);
      } else {
        toast.success('Success', isEditing ? 'Capability updated successfully' : 'Capability saved successfully');
      }

      mutateCustomCapabilities();
      onClose();
    } catch (error) {
      console.error('Error saving capability:', error);
      toast.error('Error', error.message || 'Failed to save capability');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFieldChange = (field, value) => {
    setCapability(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleEmailConfigChange = (field, value) => {
    setCapability(prev => ({
      ...prev,
      email_config: {
        ...prev.email_config,
        [field]: value,
      },
    }));
  };

  const handleParamChange = (index, field, value) => {
    setCapability(prev => ({
      ...prev,
      dynamic_params: prev.dynamic_params.map((param, i) => (i === index ? { ...param, [field]: value } : param)),
    }));
  };

  const addDynamicParam = () => {
    setCapability(prev => ({
      ...prev,
      dynamic_params: [
        ...prev.dynamic_params,
        {
          field_name: '',
          field_type: 'string',
          field_description: '',
          field_required: true,
        },
      ],
    }));
  };

  const removeParam = index => {
    setCapability(prev => ({
      ...prev,
      dynamic_params: prev.dynamic_params.filter((_, i) => i !== index),
    }));
  };

  if (!capability) {
    return (
      <Dialog
        title="Review & Edit Capability"
        isOpen={isOpen}
        onClose={onClose}
        className="max-w-3xl !bg-white/95 dark:!bg-[#0a0e27]/95 !backdrop-blur-xl !border !border-primary/30 !shadow-2xl !shadow-primary/20"
      >
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-gray-700 dark:text-gray-400">Loading capability...</p>
          </div>
        </div>
      </Dialog>
    );
  }

  const isEmailCapability = capability.capability_type === 'email';
  const isHttpCapability = !isEmailCapability;
  const isEditing = !!capability.id;
  const dialogTitle = isEditing ? 'Edit Capability' : 'Review & Save Capability';

  return (
    <Dialog
      title={dialogTitle}
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-3xl !bg-white/95 dark:!bg-[#0a0e27]/95 !backdrop-blur-xl !border !border-primary/30 !shadow-2xl !shadow-primary/20"
    >
      <div className="space-y-6">
        {/* Capability Type Badge */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Type:</span>
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
              isEmailCapability
                ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                : 'bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30'
            }`}
          >
            {isEmailCapability ? '📧 Email' : '🔗 HTTP'}
          </span>
        </div>

        {/* Basic Info Section */}
        <div className="bg-gray-50 dark:bg-surface-elevated border border-border-default-light dark:border-border-default rounded-lg p-5 space-y-4">
          <h3 className="font-semibold text-primary text-base">Basic Information</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1.5">Capability Name</label>
            <input
              type="text"
              value={capability.method_name}
              onChange={e => handleFieldChange('method_name', e.target.value)}
              className="w-full px-4 py-2.5 border border-border-default-light dark:border-border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-gray-300 bg-white dark:bg-surface"
              placeholder="e.g., capture_contact_info"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1.5">Description</label>
            <textarea
              value={capability.method_description}
              onChange={e => handleFieldChange('method_description', e.target.value)}
              className="w-full px-4 py-2.5 border border-border-default-light dark:border-border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-gray-300 bg-white dark:bg-surface min-h-[80px] resize-y"
              placeholder="Brief description of what this capability does"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1.5">When to Use</label>
            <textarea
              value={capability.method_instruction}
              onChange={e => handleFieldChange('method_instruction', e.target.value)}
              className="w-full px-4 py-2.5 border border-border-default-light dark:border-border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-gray-300 bg-white dark:bg-surface min-h-[80px] resize-y"
              placeholder="Instructions for when the AI should use this capability"
            />
          </div>
        </div>

        {/* Destination Section */}
        <div className="bg-gray-50 dark:bg-surface-elevated border border-border-default-light dark:border-border-default rounded-lg p-5 space-y-4">
          <h3 className="font-semibold text-primary text-base">
            {isEmailCapability ? 'Email Configuration' : 'HTTP Configuration'}
          </h3>

          {isEmailCapability ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1.5">
                  Recipient Email
                </label>
                <input
                  type="email"
                  value={capability.email_config?.to || ''}
                  onChange={e => handleEmailConfigChange('to', e.target.value)}
                  className="w-full px-4 py-2.5 border border-border-default-light dark:border-border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-gray-300 bg-white dark:bg-surface"
                  placeholder="support@company.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1.5">
                  Email Subject
                </label>
                <input
                  type="text"
                  value={capability.email_config?.subject || ''}
                  onChange={e => handleEmailConfigChange('subject', e.target.value)}
                  className="w-full px-4 py-2.5 border border-border-default-light dark:border-border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-gray-300 bg-white dark:bg-surface"
                  placeholder="New Request from {{user_name}}"
                />
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1.5">
                  Use {'{{field_name}}'} to insert dynamic values from parameters
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1.5">From Name</label>
                  <input
                    type="text"
                    value={capability.email_config?.from_name || 'Interworky Assistant'}
                    onChange={e => handleEmailConfigChange('from_name', e.target.value)}
                    className="w-full px-4 py-2.5 border border-border-default-light dark:border-border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-gray-300 bg-white dark:bg-surface"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1.5">
                    Template Style
                  </label>
                  <select
                    value={capability.email_config?.template_type || 'simple'}
                    onChange={e => handleEmailConfigChange('template_type', e.target.value)}
                    className="w-full px-4 py-2.5 border border-border-default-light dark:border-border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-gray-300 bg-white dark:bg-surface"
                  >
                    <option value="simple">Simple</option>
                    <option value="detailed">Detailed</option>
                  </select>
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1.5">HTTP Method</label>
                <select
                  value={capability.method_verb}
                  onChange={e => handleFieldChange('method_verb', e.target.value)}
                  className="w-full px-4 py-2.5 border border-border-default-light dark:border-border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-gray-300 bg-white dark:bg-surface"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                  <option value="PATCH">PATCH</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1.5">
                  Endpoint URL
                </label>
                <input
                  type="url"
                  value={capability.method_endpoint}
                  onChange={e => handleFieldChange('method_endpoint', e.target.value)}
                  className="w-full px-4 py-2.5 border border-border-default-light dark:border-border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-gray-300 bg-white dark:bg-surface"
                  placeholder="https://api.example.com/endpoint"
                />
              </div>
            </>
          )}
        </div>

        {/* Parameters Section */}
        <div className="bg-gray-50 dark:bg-surface-elevated border border-border-default-light dark:border-border-default rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-primary text-base">Parameters</h3>
            <button
              type="button"
              onClick={addDynamicParam}
              className="text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
              Add Parameter
            </button>
          </div>

          {capability.dynamic_params?.map((param, index) => (
            <div
              key={index}
              className="bg-white dark:bg-surface rounded-lg border border-border-default-light dark:border-border-default p-4 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={param.field_name}
                    onChange={e => handleParamChange(index, 'field_name', e.target.value)}
                    className="px-3 py-2 border border-border-default-light dark:border-border-default rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm text-gray-900 dark:text-gray-300 bg-gray-50 dark:bg-surface-elevated"
                    placeholder="field_name"
                  />
                  <select
                    value={param.field_type}
                    onChange={e => handleParamChange(index, 'field_type', e.target.value)}
                    className="px-3 py-2 border border-border-default-light dark:border-border-default rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm text-gray-900 dark:text-gray-300 bg-gray-50 dark:bg-surface-elevated"
                  >
                    <option value="string">Text</option>
                    <option value="number">Number</option>
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => removeParam(index)}
                  className="ml-2 text-red-600 dark:text-red-400 hover:text-red-500 dark:hover:text-red-300"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
              <textarea
                value={param.field_description}
                onChange={e => handleParamChange(index, 'field_description', e.target.value)}
                className="w-full px-3 py-2 border border-border-default-light dark:border-border-default rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm text-gray-900 dark:text-gray-300 bg-gray-50 dark:bg-surface-elevated resize-none"
                placeholder="Description of what this parameter represents"
                rows={2}
              />
            </div>
          ))}

          {(!capability.dynamic_params || capability.dynamic_params.length === 0) && (
            <div className="text-center py-8 text-gray-600 dark:text-gray-400 text-sm">
              No parameters yet. Click &quot;Add Parameter&quot; to add one.
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-border-default-light dark:border-border-default">
          <Button intent="secondary" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} isLoading={isSaving}>
            💾 Save Capability
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
