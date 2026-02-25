'use client';

import { useState } from 'react';
import Dialog from './Dialog';
import Input from './ui/Input';
import { useNotification } from '@/_common/utils/handleSlackNotification';
import { PhoneInput } from 'react-international-phone';
import 'react-international-phone/style.css';

const COMPANY_SIZE_OPTIONS = [
  { value: '1-10', label: '1-10 employees' },
  { value: '11-50', label: '11-50 employees' },
  { value: '51-200', label: '51-200 employees' },
  { value: '201-500', label: '201-500 employees' },
  { value: '500+', label: '500+ employees' },
];

const getSourceText = source => {
  const sourceMap = {
    hero: 'Hero Section',
    navbar: 'Navigation Bar',
    navbar_demo: 'Navigation Bar - Try a Demo',
    benefits_enterprise: 'Benefits - Enterprise Routing',
    benefits_voice: 'Benefits - Give Your Website a Voice',
    benefits_afterhours: 'Benefits - Explore After-Hours Carla',
    benefits_language: 'Benefits - Reach a Global Audience',
    benefits_happiness: 'Benefits - Deliver Instant Happiness',
    benefits_leads: 'Benefits - Convert Visitors to Leads',
    privacy: 'Privacy Section',
    hipaa_request: 'Security & Compliance - HIPAA Request',
    pricing_code: 'Pricing - Get a Code',
    pricing_starter: 'Pricing - Starter Plan',
    pricing_premium: 'Pricing - Premium Plan',
    product: 'Product Page',
    product_ai_agent: 'Product - AI Agent Customization',
    product_website_sync: 'Product - Website Synchronization',
    product_knowledge_base: 'Product - Custom Knowledge Base',
    product_naming_personality: 'Product - Naming & Personality',
    product_theme: 'Product - Theme Customization',
    product_capabilities: 'Product - Custom Capabilities',
    agent_checker: 'Agent Checker Page',
    schedule_demo: 'Try Demo',
    afterhours_demo: 'After Hours Carla - Schedule a Demo',
    blog: 'Blog Page',
    blog_cta: 'Blog - CTA Section',
    footer_contact: 'Footer - Contact',
  };
  return sourceMap[source] || 'Unknown Source';
};

export default function UserInfoModal({ isOpen, onClose, actionType = 'hire', source = 'hero' }) {
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    phone: '',
    companySize: '',
    company: '',
    preferredHost: 'first_available',
    utm_source: '',
    utm_medium: '',
    utm_campaign: '',
    utm_term: '',
    utm_content: '',
    page_path: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { handleNotification, isSending } = useNotification();

  const isValidPhone = value => {
    if (!value) return true; // optional
    const digits = (value || '').replace(/[^\d]/g, '');
    return digits.length >= 8 && digits.length <= 15; // relaxed E.164 window
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.companySize) {
      newErrors.companySize = 'Company size is required';
    }

    if (formData.phone && !isValidPhone(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const actionText =
        actionType === 'hire' ? 'Hire Carla for free' : actionType === 'demo' ? 'Schedule a Demo' : 'Test on Your Site';
      const sourceText = getSourceText(source);
      const phoneLine = formData.phone ? `\n📞 Phone: ${formData.phone}` : '';
      const companyLine = formData.company ? `\n🏢 Company: ${formData.company}` : '';
      const utms = [
        formData.utm_source && `utm_source=${formData.utm_source}`,
        formData.utm_medium && `utm_medium=${formData.utm_medium}`,
        formData.utm_campaign && `utm_campaign=${formData.utm_campaign}`,
        formData.utm_term && `utm_term=${formData.utm_term}`,
        formData.utm_content && `utm_content=${formData.utm_content}`,
      ]
        .filter(Boolean)
        .join('&');
      const utmLine = utms ? `\n🔗 UTMs: ${utms}` : '';
      const pathLine = formData.page_path ? `\n📄 Page: ${formData.page_path}` : '';
      const hostMap = {
        Ahmed: 'Ahmed Schrute (CT - Austin, TX)',
        gibu: 'Gibu George (PT - San Francisco, CA)',
        first_available: 'First available',
      };
      const hostLine = `\n👥 Preferred Host: ${hostMap[formData.preferredHost]}`;
      const message = `🎯 New Lead: ${actionText}\n📍 Source: ${sourceText}\n\n📧 Email: ${formData.email}\n👤 Name: ${formData.name}${phoneLine}${companyLine}\n🏢 Company Size: ${formData.companySize}${hostLine} ${formData.companySize}${utmLine}${pathLine}\n\n⏰ Timestamp: ${new Date().toLocaleString()}`;

      await handleNotification(message);

      setIsSuccess(true);

      // Auto close after 3 seconds
      setTimeout(() => {
        onClose();
        setIsSuccess(false);
        setFormData({
          email: '',
          name: '',
          phone: '',
          companySize: '',
          company: '',
          preferredHost: 'first_available',
          utm_source: '',
          utm_medium: '',
          utm_campaign: '',
          utm_term: '',
          utm_content: '',
          page_path: '',
        });
        setErrors({});
      }, 3000);
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
      // Reset form when closing
      setFormData({
        email: '',
        name: '',
        phone: '',
        companySize: '',
        company: '',
        preferredHost: 'first_available',
        utm_source: '',
        utm_medium: '',
        utm_campaign: '',
        utm_term: '',
        utm_content: '',
        page_path: '',
      });
      setErrors({});
      setIsSuccess(false);
    }
  };

  // Capture UTMs and page path when modal opens
  if (typeof window !== 'undefined' && isOpen && !formData.page_path) {
    try {
      const url = new URL(window.location.href);
      const qp = url.searchParams;
      setFormData(prev => ({
        ...prev,
        utm_source: qp.get('utm_source') || prev.utm_source,
        utm_medium: qp.get('utm_medium') || prev.utm_medium,
        utm_campaign: qp.get('utm_campaign') || prev.utm_campaign,
        utm_term: qp.get('utm_term') || prev.utm_term,
        utm_content: qp.get('utm_content') || prev.utm_content,
        page_path: url.pathname + url.search,
      }));
    } catch (e) {
      // ignore
    }
  }

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleClose}
      title={
        isSuccess
          ? 'Thank You!'
          : source === 'pricing_code'
            ? 'Get Your Access Code'
            : actionType === 'demo'
              ? 'Schedule a Demo'
              : `${actionType === 'hire' ? 'Hire Carla' : 'Test on Your Site'}`
      }
      className="w-full max-w-md"
      hideCloseButton={isSubmitting || isSuccess}
    >
      {isSuccess ? (
        <div className="py-8 text-center">
          <div className="mb-6">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              {source === 'pricing_code'
                ? 'Your access code is on the way!'
                : actionType === 'demo'
                  ? 'Demo scheduled successfully!'
                  : 'Thank you for your interest!'}
            </h3>
            <p className="text-gray-600">
              {source === 'pricing_code'
                ? 'Check your email for your personalized access code and pricing information.'
                : actionType === 'demo'
                  ? "We'll reach out to you soon to schedule your personalized demo."
                  : 'Our team will contact you within 24 hours to get started.'}
            </p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="mb-6 text-center">
            <p className="text-gray-600">
              {source === 'pricing_code'
                ? 'Fill out the form below to receive your personalized access code and pricing information'
                : actionType === 'demo'
                  ? 'Schedule a personalized demo to see how Carla can help your business'
                  : actionType === 'hire'
                    ? 'Get started with Carla for your business'
                    : 'Test Carla on your website before committing'}
            </p>
          </div>

          <Input
            label="Email Address"
            type="email"
            placeholder="your@email.com"
            value={formData.email}
            onChange={e => handleInputChange('email', e.target.value)}
            error={errors.email}
            required
          />

          <Input
            label="Full Name"
            type="text"
            placeholder="John Doe"
            value={formData.name}
            onChange={e => handleInputChange('name', e.target.value)}
            error={errors.name}
            required
          />

          <Input
            label="Company (optional)"
            type="text"
            placeholder="Acme Inc."
            value={formData.company}
            onChange={e => handleInputChange('company', e.target.value)}
          />

          {/* Meet our team - human context selection */}
          <div className="space-y-2">
            <span className="block text-sm font-medium text-gray-700">Who would you prefer to meet?</span>
            <div className="sm:grid-cols-3 grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => handleInputChange('preferredHost', 'Ahmed')}
                className={`rounded-lg border p-3 text-left transition ${formData.preferredHost === 'Ahmed' ? 'border-[#058A7C] bg-[#058A7C]/10' : 'border-gray-300 hover:bg-gray-50'}`}
              >
                <div className="flex items-center gap-2">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Ahmed Schrute</div>
                    <div className="text-xs text-gray-600">Central Time - Austin, TX</div>
                  </div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => handleInputChange('preferredHost', 'gibu')}
                className={`rounded-lg border p-3 text-left transition ${formData.preferredHost === 'gibu' ? 'border-[#058A7C] bg-[#058A7C]/10' : 'border-gray-300 hover:bg-gray-50'}`}
              >
                <div className="flex items-center gap-2">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Gibu George</div>
                    <div className="text-xs text-gray-600">Pacific Time - San Francisco, CA</div>
                  </div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => handleInputChange('preferredHost', 'first_available')}
                className={`rounded-lg border p-3 text-left transition ${formData.preferredHost === 'first_available' ? 'border-[#058A7C] bg-[#058A7C]/10' : 'border-gray-300 hover:bg-gray-50'}`}
              >
                <div className="text-sm font-semibold text-gray-900">First available</div>
                <div className="text-xs text-gray-600">We’ll route to the earliest slot</div>
              </button>
            </div>
            <p className="text-xs text-gray-500">We will send calendar options in your local time zone.</p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Phone Number (optional)</label>
            <PhoneInput
              defaultCountry="us"
              value={formData.phone}
              onChange={val => handleInputChange('phone', val)}
              className="ripe-compact w-full"
              inputClassName={`w-full h-10 rounded-[14px] border px-4 text-base text-secondary bg-white ${
                errors.phone ? 'border-red-500 focus:ring-2 focus:ring-red-400' : 'border-[#CBCAD7]'
              }`}
            />
            {errors.phone ? (
              <p className="text-sm text-red-500">{errors.phone}</p>
            ) : (
              <p className="text-xs text-gray-500">Includes country code via the dropdown</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Company Size <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.companySize}
              onChange={e => handleInputChange('companySize', e.target.value)}
              className={`w-full px-4 py-3 border rounded-md outline-none transition-colors bg-white text-gray-700 ${
                errors.companySize
                  ? 'border-red-500 focus:ring-2 focus:ring-red-400'
                  : 'border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-400'
              }`}
              required
            >
              <option value="">Select company size</option>
              {COMPANY_SIZE_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.companySize && <p className="mt-1 text-sm text-red-500">{errors.companySize}</p>}
          </div>

          <div className="-mt-2 text-xs text-gray-500">
            By submitting, you consent to be contacted about your request. We use Google Tag Manager for performance
            analytics. See our{' '}
            <a href="/privacy" className="underline">
              Privacy Policy
            </a>
            .
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex-1 px-4 py-3 text-gray-700 transition-colors bg-gray-100 border border-gray-300 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isSending}
              className="flex-1 px-4 py-3 bg-[#058A7C] text-white rounded-md hover:bg-[#047A6C] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isSubmitting || isSending ? (
                <>
                  <svg
                    className="animate-spin w-4 h-4 mr-2 -ml-1 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  {source === 'pricing_code'
                    ? 'Generating Code...'
                    : actionType === 'demo'
                      ? 'Scheduling Demo...'
                      : actionType === 'hire'
                        ? 'Getting Started...'
                        : 'Testing...'}
                </>
              ) : source === 'pricing_code' ? (
                'Get My Code'
              ) : actionType === 'demo' ? (
                'Schedule Demo'
              ) : actionType === 'hire' ? (
                'Get Started'
              ) : (
                'Test Now'
              )}
            </button>
          </div>
        </form>
      )}
    </Dialog>
  );
}
