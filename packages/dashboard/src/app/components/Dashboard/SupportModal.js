'use client';

import { useState, useEffect } from 'react';
import Dialog from '../Dialog';
import Input from '../ui/Input';
import { Button } from '../ui/Button';
import { useNotification } from '@/_common/utils/handleSlackNotification';
import { getOrganization, getUser } from '@/_common/utils/localStorage';
import useFireToast from '@/_common/hooks/fireToast';

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

const CATEGORY_OPTIONS = [
  { value: 'technical', label: 'Technical Issue' },
  { value: 'billing', label: 'Billing Question' },
  { value: 'feature', label: 'Feature Request' },
  { value: 'bug', label: 'Bug Report' },
  { value: 'other', label: 'Other' },
];

export default function SupportModal({ isOpen, onClose, version = '' }) {
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    priority: 'medium',
    category: 'technical',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { handleNotification } = useNotification();
  const { success, error } = useFireToast();

  // Get user and organization context
  const organization = getOrganization();
  const user = getUser();
  const userEmail = user?.email || '';

  // Pre-fill subject with organization name when modal opens
  useEffect(() => {
    if (isOpen) {
      const org = getOrganization();
      if (org?.organization?.organization_name) {
        const orgName = org.organization.organization_name;
        setFormData(prev => {
          // Only update if the subject is empty or matches the default pattern
          if (!prev.subject || prev.subject.startsWith('Support request -')) {
            return {
              ...prev,
              subject: `Support request - ${orgName}`,
            };
          }
          return prev;
        });
      }
    }
  }, [isOpen]); // Only depend on isOpen

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        subject: '',
        message: '',
        priority: 'medium',
        category: 'technical',
      });
      setErrors({});
    }
  }, [isOpen]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const formatSlackMessage = () => {
    const timestamp = new Date().toISOString();
    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

    return `🚨 Support Request from ${organization?.organization?.organization_name || 'Unknown Organization'}

👤 User: ${userEmail}
📧 Email: ${userEmail}
🏢 Organization: ${organization?.organization?.organization_name || 'Not provided'}
🌐 Website: ${organization?.organization?.organization_website || 'Not provided'}
📱 Version: Interworky v${version}

📋 Subject: ${formData.subject}
🏷️ Priority: ${PRIORITY_OPTIONS.find(p => p.value === formData.priority)?.label || formData.priority}
📂 Category: ${CATEGORY_OPTIONS.find(c => c.value === formData.category)?.label || formData.category}

💬 Message:
${formData.message}

---
⏰ Timestamp: ${timestamp}
🔗 Dashboard: ${currentUrl}`;
  };

  const handleSubmit = async e => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const slackMessage = formatSlackMessage();
      await handleNotification(slackMessage);

      success('Support request sent!', 'Our team will get back to you within 24 hours.');
      onClose();

      // Reset form
      setFormData({
        subject: '',
        message: '',
        priority: 'medium',
        category: 'technical',
      });
      setErrors({});
    } catch (err) {
      console.error('Error sending support request:', err);
      error('Failed to send request', 'Please try again or contact us directly at hello@interworky.com');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleClose}
      title="Contact Support"
      className="w-full max-w-lg"
      hideCloseButton={isSubmitting}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <Input
            label="Subject"
            value={formData.subject}
            onChange={e => handleInputChange('subject', e.target.value)}
            placeholder="Brief description of your issue"
            error={errors.subject}
            required
            disabled={isSubmitting}
          />

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-body font-medium text-secondary-light mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={e => handleInputChange('priority', e.target.value)}
                disabled={isSubmitting}
                className="flex text-secondary h-10 w-full border rounded-[14px] border-[#CBCAD7] px-4 py-2 text-base md:text-body font-medium bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                {PRIORITY_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-body font-medium text-secondary-light mb-1">Category</label>
              <select
                value={formData.category}
                onChange={e => handleInputChange('category', e.target.value)}
                disabled={isSubmitting}
                className="flex text-secondary h-10 w-full border rounded-[14px] border-[#CBCAD7] px-4 py-2 text-base md:text-body font-medium bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                {CATEGORY_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-body font-medium text-secondary-light mb-1">
              Message <span className="text-red-400">*</span>
            </label>
            <textarea
              value={formData.message}
              onChange={e => handleInputChange('message', e.target.value)}
              placeholder="Please describe your issue in detail..."
              disabled={isSubmitting}
              rows={6}
              className={`w-full p-4 rounded-lg bg-[#F7F7F7] text-body text-secondary outline-none resize-none border transition-colors ${
                errors.message
                  ? 'border-red-400 focus:ring-2 focus:ring-red-400'
                  : 'border-[#CBCAD7] focus:ring-2 focus:ring-primary'
              }`}
            />
            {errors.message && <p className="mt-1 text-xs text-red-400">{errors.message}</p>}
            <p className="mt-1 text-xs text-tertiary">Minimum 10 characters required</p>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="button" intent="secondary" onClick={handleClose} disabled={isSubmitting} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" intent="primary" isLoading={isSubmitting} disabled={isSubmitting} className="flex-1">
            {isSubmitting ? 'Sending...' : 'Send Request'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
