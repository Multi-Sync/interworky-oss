'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { isPlaceholderWebsite } from '@/_common/utils/utils';
import Dialog from '../../Dialog';
import LoadingButton from '../assistantInfo/LoadingButton';
import { Button } from '../../ui/Button';
export function EditOrganization({ isOpen, onClose, organizationData, onUpdate }) {
  const [formData, setFormData] = useState({
    id: '',
    organization_name: '',
    organization_website: '',
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    if (isOpen && organizationData) {
      setFormData({
        id: organizationData.id,
        organization_name: organizationData.organization_name || '',
        organization_website: isPlaceholderWebsite(organizationData.organization_website)
          ? ''
          : organizationData.organization_website || '',
      });
      setErrors({});
    }
  }, [organizationData, isOpen]);
  const validate = () => {
    const newErrors = {};
    if (!formData.organization_name.trim()) {
      newErrors.organization_name = 'Organization name is required.';
    }
    const websiteRegex = /^(?:https?:\/\/)?((?:www\.)?(?:[a-zA-Z0-9_-]+\.)+[a-zA-Z]{2,})(\/[a-zA-Z0-9#?&=._-]*)?$/i;
    // Only validate if website is provided (empty is allowed)
    if (formData.organization_website.trim() && !websiteRegex.test(formData.organization_website)) {
      newErrors.organization_website = 'Enter a valid Website.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };
  const updateOrganizationData = formattedData => {
    const currentOrgData = JSON.parse(localStorage.getItem('organization') || '{}');
    localStorage.setItem(
      'organization',
      JSON.stringify({
        ...currentOrgData,
        organization: formattedData.organization,
      }),
    );
    window.dispatchEvent(new Event('storage'));
  };
  const handleSubmit = async e => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    try {
      // If website is empty, set it to placeholder
      const websiteToSubmit = formData.organization_website.trim()
        ? formData.organization_website.toLowerCase()
        : 'https://example.com';

      const response = await fetch(`/api/models/organizations/${formData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organization_name: formData.organization_name,
          organization_website: websiteToSubmit,
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to update organization');
      }
      const updatedData = await response.json();
      const formattedData = {
        organization: {
          id: formData.id,
          organization_name: updatedData.organization_name,
          organization_website: updatedData.organization_website,
        },
      };
      updateOrganizationData(formattedData);
      toast.success('Organization updated successfully');
      await onUpdate(formattedData);
      onClose();
    } catch (error) {
      console.error('Error updating organization:', error);
      toast.error('Failed to update organization');
    } finally {
      setIsLoading(false);
    }
  };
  const isFormValid = () => {
    return formData.organization_name.trim() !== '' || formData.organization_website.trim() !== '';
  };
  if (!isOpen) return null;
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Organization"
      className="w-1/3 min-w-[390px] !bg-[#0a0e27]/95 !backdrop-blur-xl !border !border-primary/30 !shadow-2xl !shadow-primary/20"
    >
      <div className="bg-gradient-to-r from-primary/20 to-primary/20 backdrop-blur-sm border border-primary/30 py-3 px-5 rounded-lg mb-6">
        <div className="flex items-center gap-2 text-primary">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 16 16" strokeWidth="2">
            <path
              fill="currentColor"
              fillRule="evenodd"
              d="m8.36 1.37l6.36 5.8l-.71.71L13 6.964v6.526l-.5.5h-3l-.5-.5v-3.5H7v3.5l-.5.5h-3l-.5-.5V6.972L2 7.88l-.71-.71l6.35-5.8zM4 6.063v6.927h2v-3.5l.5-.5h3l.5.5v3.5h2V6.057L8 2.43z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-base ml-2 font-medium">Organization Info</span>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6 justify-center">
        <div>
          <label htmlFor="organization-name" className="block text-base text-gray-300 mb-2">
            Organization Name
          </label>
          <input
            id="organization-name"
            type="text"
            value={formData.organization_name}
            onChange={e => handleInputChange('organization_name', e.target.value)}
            className="w-full bg-[#0a0e27]/60 backdrop-blur-sm border border-primary/30 text-gray-200 text-body rounded-lg outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/30 py-3 px-5 transition-all"
            placeholder="Enter organization name"
          />
          {errors.organization_name && <p className="text-red-400 text-body mt-1">{errors.organization_name}</p>}
        </div>
        <div>
          <label htmlFor="organization-website" className="block text-base text-gray-300 mb-2">
            Website
          </label>
          <input
            id="organization-website"
            type="text"
            value={formData.organization_website}
            onChange={e => handleInputChange('organization_website', e.target.value)}
            className="w-full bg-[#0a0e27]/60 backdrop-blur-sm border border-primary/30 text-gray-200 text-body rounded-lg outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/30 py-3 px-5 transition-all"
            placeholder="Enter website URL"
          />
          {errors.organization_website && <p className="text-red-400 text-body mt-1">{errors.organization_website}</p>}
        </div>
        <div className="py-10 flex justify-center">
          <Button
            id="save-assistant"
            type="submit"
            isLoading={isLoading}
            disabled={isLoading || !isFormValid()}
            className={'w-full'}
          >
            Save
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
