'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useNotification } from '@/_common/utils/handleSlackNotification';

export default function InlineEmailCapture({ source = 'hero-inline' }) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { handleNotification } = useNotification();

  const handleSubmit = async e => {
    e.preventDefault();

    // Validate email
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }

    if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)) {
      setError('Please enter a valid email');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await handleNotification(`New email signup from ${source}: ${email}`);

      // Store email for prefilling setup form
      sessionStorage.setItem('prefilledEmail', email);

      // Redirect to /new for lower friction conversion
      router.push('/new');
    } catch {
      setError('Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-6 flex flex-col sm:flex-row gap-3 max-w-md lg:mx-0 mx-auto animate-fade-in-up"
    >
      <div className="flex-1 relative">
        <input
          type="email"
          value={email}
          onChange={e => {
            setEmail(e.target.value);
            if (error) setError('');
          }}
          placeholder="Enter your work email"
          className={`w-full px-4 py-3 rounded-full bg-white/10 border
            ${error ? 'border-red-400' : 'border-white/20'}
            text-white placeholder-gray-400 focus:outline-none
            focus:border-emerald-400 transition-colors`}
          disabled={isLoading}
        />
        {error && <p className="absolute -bottom-6 left-4 text-xs text-red-400">{error}</p>}
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className="px-6 py-3 bg-[#058A7C] hover:bg-[#047A6C] text-white
          font-semibold rounded-full transition-colors disabled:opacity-50
          disabled:cursor-not-allowed flex items-center justify-center gap-2
          whitespace-nowrap"
      >
        {isLoading ? (
          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          <>
            Get Started Free
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </>
        )}
      </button>
    </form>
  );
}
