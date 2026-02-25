'use client';

import { useState } from 'react';
import Dialog from '../../Dialog';
import { Button } from '../../ui/Button';
import { RingLoader } from 'react-spinners';
import useFireToast from '@/_common/hooks/fireToast';

export default function AiCapabilityBuilder({ isOpen, onClose, onCapabilityGenerated, organizationEmail }) {
  const [description, setDescription] = useState('');
  const [destinationType, setDestinationType] = useState('email'); // 'email' or 'webhook'
  const [destinationValue, setDestinationValue] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const toast = useFireToast();

  const handleGenerate = async () => {
    if (!description.trim()) {
      toast.warning('Warning', 'Please enter a description for the capability');
      return;
    }

    setIsGenerating(true);

    try {
      // Build enhanced description with destination info
      let enhancedDescription = description.trim();

      if (destinationValue.trim()) {
        if (destinationType === 'email') {
          enhancedDescription += `. Send an email to ${destinationValue.trim()}.`;
        } else if (destinationType === 'webhook') {
          enhancedDescription += `. Make a POST request to ${destinationValue.trim()}.`;
        }
      }

      const requestBody = {
        description: enhancedDescription,
      };

      const response = await fetch('/api/ai/generate-capability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to generate capability');
      }

      // Success! Pass the generated capability to parent
      toast.success('Success', 'Capability generated successfully. Please review and save.');
      onCapabilityGenerated(data.capability);

      // Reset and close
      setDescription('');
      setDestinationType('email');
      setDestinationValue('');
      onClose();
    } catch (error) {
      console.error('Error generating capability:', error);
      toast.error('Error', error.message || 'Failed to generate capability');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClose = () => {
    if (!isGenerating) {
      setDescription('');
      setDestinationType('email');
      setDestinationValue('');
      onClose();
    }
  };

  return (
    <Dialog
      title="AI Capability Builder"
      isOpen={isOpen}
      onClose={handleClose}
      className="max-w-2xl !bg-white/95 dark:!bg-[#0a0e27]/95 !backdrop-blur-xl !border !border-primary/30 !shadow-2xl !shadow-primary/20"
    >
      <div className="space-y-6">
        <div>
          <p className="text-sm text-gray-700 dark:text-gray-400 mb-4">
            Describe what you want this capability to do in plain natural language. The AI will automatically generate
            the structure for you.
          </p>

          <div className="bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30 rounded-lg p-4 mb-4">
            <h4 className="font-semibold text-sm text-primary mb-3">💡 Examples:</h4>
            <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-2.5">
              <li className="flex items-start">
                <span className="text-primary mr-2 font-bold">•</span>
                <span className="text-gray-700 dark:text-gray-300">
                  &quot;Capture user email, phone, and message for customer support inquiries&quot;
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2 font-bold">•</span>
                <span className="text-gray-700 dark:text-gray-300">
                  &quot;Collect name, email, and case description for lawsuit filing requests&quot;
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2 font-bold">•</span>
                <span className="text-gray-700 dark:text-gray-300">
                  &quot;Book appointments with name, email, preferred date, and time&quot;
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div>
          <label
            htmlFor="capability-description"
            className="block font-semibold text-sm text-gray-700 dark:text-gray-300 mb-2"
          >
            What should this capability do?
          </label>
          <textarea
            id="capability-description"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="e.g., Capture customer contact information including name, email, and phone number"
            className="w-full min-h-[100px] px-4 py-3 border border-border-default-light dark:border-border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-gray-300 placeholder:text-gray-400 dark:placeholder:text-gray-500 resize-y bg-white dark:bg-surface"
            disabled={isGenerating}
          />
        </div>

        <div>
          <label className="block font-semibold text-sm text-gray-700 dark:text-gray-300 mb-3">
            Where should the data go?
          </label>
          <div className="space-y-3">
            {/* Destination Type Selector */}
            <div className="flex gap-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="destinationType"
                  value="email"
                  checked={destinationType === 'email'}
                  onChange={e => setDestinationType(e.target.value)}
                  className="mr-2 text-primary focus:ring-primary"
                  disabled={isGenerating}
                />
                <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">📧 Send Email</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="destinationType"
                  value="webhook"
                  checked={destinationType === 'webhook'}
                  onChange={e => setDestinationType(e.target.value)}
                  className="mr-2 text-primary focus:ring-primary"
                  disabled={isGenerating}
                />
                <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">🔗 Webhook URL</span>
              </label>
            </div>

            {/* Destination Value Input */}
            {destinationType === 'email' ? (
              <input
                type="email"
                value={destinationValue}
                onChange={e => setDestinationValue(e.target.value)}
                placeholder="support@company.com"
                className="w-full px-4 py-3 border border-border-default-light dark:border-border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-gray-300 placeholder:text-gray-400 dark:placeholder:text-gray-500 bg-white dark:bg-surface"
                disabled={isGenerating}
              />
            ) : (
              <input
                type="url"
                value={destinationValue}
                onChange={e => setDestinationValue(e.target.value)}
                placeholder="https://api.example.com/webhook"
                className="w-full px-4 py-3 border border-border-default-light dark:border-border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-gray-300 placeholder:text-gray-400 dark:placeholder:text-gray-500 bg-white dark:bg-surface"
                disabled={isGenerating}
              />
            )}
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {destinationType === 'email'
                ? 'Email address where the collected information will be sent'
                : 'API endpoint URL that will receive the data via POST request'}
            </p>
          </div>
        </div>

        {isGenerating && (
          <div className="flex flex-col items-center justify-center py-8 bg-gradient-to-br from-primary/10 to-primary/20 rounded-lg border border-primary/30">
            <RingLoader color="#058A7C" size={50} />
            <p className="mt-4 text-sm text-gray-700 dark:text-gray-300 font-medium">
              AI is generating your capability...
            </p>
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">This may take a few seconds</p>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-border-default-light dark:border-border-default">
          <Button intent="secondary" onClick={handleClose} disabled={isGenerating}>
            Cancel
          </Button>
          <Button onClick={handleGenerate} isLoading={isGenerating} disabled={!description.trim()}>
            ✨ Generate Capability
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
