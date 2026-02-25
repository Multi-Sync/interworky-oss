'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Dialog from '../../Dialog';
import LoadingButton from '../assistantInfo/LoadingButton';
import { Button } from '../../ui/Button';

export function EditPersonalInfo({ isOpen, onClose, userData, onUpdate }) {
  const [formData, setFormData] = useState({
    id: '',
    fullName: '',
    phone: '',
    timezone: '',
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && userData) {
      setFormData({
        id: userData.id,
        fullName: `${userData.first_name || ''} ${userData.last_name || ''}`.trim(),
        phone: userData.phone || '',
        timezone: userData.timezone || '',
      });
      setErrors({});
    }
  }, [isOpen, userData]);

  const validate = () => {
    const newErrors = {};
    const names = formData.fullName.trim().split(/\s+/);

    if (!formData.fullName.trim()) {
      newErrors.name = 'Full name is required.';
    } else if (names.length < 2) {
      newErrors.name = 'Last name is required.';
    }

    if (!formData.phone.trim() || !/^\+?\d{10,15}$/.test(formData.phone)) {
      newErrors.phone = 'Enter a valid phone number.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleInputChange = (field, value) => {
    if (field === 'fullName') {
      // Allow typing space after first name, but clean up multiple spaces
      const cleanValue = value.replace(/\s{2,}/g, ' ');

      const words = cleanValue.split(' ').filter(word => word.length > 0);

      // If we have more than 2 words, limit to first two
      const limitedWords = words.slice(0, 2);

      const keepTrailingSpace = cleanValue.endsWith(' ') && words.length < 2;
      const finalValue = limitedWords.join(' ') + (keepTrailingSpace ? ' ' : '');

      setFormData(prev => ({ ...prev, [field]: finalValue }));

      if (words.length >= 2) {
        setErrors(prev => ({ ...prev, name: '' }));
      } else if (words.length === 1 && !cleanValue.endsWith(' ')) {
        setErrors(prev => ({ ...prev, name: 'Last name is required.' }));
      }
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };
  const handleSubmit = async e => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);

    try {
      const names = formData.fullName.trim().split(/\s+/).slice(0, 2);
      const submitData = {
        ...formData,
        first_name: names[0] || '',
        last_name: names[1] || '',
      };

      const response = await fetch(`/api/models/users/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        throw new Error('Failed to update user info.');
      }

      const updatedUserData = await response.json();
      toast.success('Account info is updated successfully!');
      await onUpdate(updatedUserData);
      onClose();
    } catch (error) {
      console.error('Error updating info:', error);
      toast.error('Failed to update user info. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = () => {
    return formData.fullName.trim() !== '' || formData.phone.trim() !== '';
  };

  if (!isOpen) return null;
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Profile"
      className="w-1/3 min-w-[390px] !bg-[#0a0e27]/95 !backdrop-blur-xl !border !border-primary/30 !shadow-2xl !shadow-primary/20"
    >
      <div className="bg-gradient-to-r from-primary/20 to-primary/20 backdrop-blur-sm border border-primary/30 py-3 px-5 rounded-lg mb-6">
        <div className="flex items-center gap-2 text-primary">
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
            className="lucide lucide-user"
          >
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span className="text-base ml-2 font-medium">Personal Info</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 justify-center">
        <div>
          <label className="block text-base text-gray-300 mb-2">Full Name</label>
          <input
            type="text"
            value={formData.fullName}
            onChange={e => handleInputChange('fullName', e.target.value)}
            className="w-full bg-[#0a0e27]/60 backdrop-blur-sm border border-primary/30 text-gray-200 text-body rounded-lg outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/30 py-3 px-5 transition-all"
            aria-label="Full Name"
            placeholder="Full name"
          />
          {errors.name && <p className="text-red-400 text-body mt-1">{errors.name}</p>}
        </div>
        <div className="mt-4">
          <label className="block text-base text-gray-300 mb-2">Phone Number</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={e => handleInputChange('phone', e.target.value)}
            className="w-full bg-[#0a0e27]/60 backdrop-blur-sm border border-primary/30 text-gray-200 text-body rounded-lg outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/30 py-3 px-5 transition-all"
            aria-label="Phone Number"
            placeholder="Phone number"
          />
          {errors.phone && <p className="text-red-400 text-body mt-1">{errors.phone}</p>}
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
