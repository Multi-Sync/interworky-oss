'use client';

import fireToast from '@/_common/hooks/fireToast';
import { useSessionManager } from '@/_common/hooks/useSession';
import { extractDomain } from '@/_common/utils/utils';
import { useRouter } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { BeatLoader } from 'react-spinners';
import { Button } from '@/app/components/ui/Button';
import InfoLabel from '@/app/components/InfoTooltip';
import Input from '@/app/components/ui/Input';

export default function Checkpoint() {
  const toast = fireToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const { session, status, isLoading: sessionLoading } = useSessionManager();

  // Fetch organization details and store them in localStorage
  const fetchOrganizationDetails = useCallback(async () => {
    try {
      const response = await fetch(`/api/models/organizations/created_by/${session?.id}`);
      const result = await response.json();
      if (!response.ok) {
        toast.error(`Failed to fetch account details: ${response.statusText}`);
        return null;
      }

      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem('organization', JSON.stringify(result));
          localStorage.setItem('userEmail', session?.email);
        }
      } catch (storageError) {
        console.error('LocalStorage error:', storageError);
      }

      return result;
    } catch (error) {
      console.error('Error fetching account details:', error);
      toast.error('An error occurred while fetching account details.');
      return null;
    }
  }, [session?.id, session?.email, toast]);

  // Handle redirects and Slack message for existing users
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    } else if (session?.hasOrg) {
      (async () => {
        const user = {
          id: session?.id,
          email: session?.email,
          name: session?.name,
          image: session?.image,
        };
        localStorage.setItem('user', JSON.stringify(user));
        await fetchOrganizationDetails();
        router.replace('/dashboard/home');
      })();
    }
  }, [status, session?.hasOrg, router, fetchOrganizationDetails]);

  // Show loading spinner while session is loading or redirecting
  if (sessionLoading || status === 'loading' || session?.hasOrg) {
    return (
      <div className="flex mt-[50%] -translate-y-[50%] items-center justify-center">
        <BeatLoader color="#058A7C" />
      </div>
    );
  }

  // Handle organization creation for new users
  const onSubmit = async (data, isSkip = false) => {
    try {
      setIsLoading(true);

      const user = {
        id: session.id,
        email: session.email,
        name: session.name,
        image: session.image,
      };
      localStorage.setItem('user', JSON.stringify(user));

      const hasWebsite = data.website && data.website.trim();
      const orgData = {
        organization_website: hasWebsite ? data.website.trim() : 'https://example.com',
        organization_name: hasWebsite ? extractDomain(data.website.trim()) : session.email.split('@')[0],
        creator_user_id: session.id,
      };

      const response = await fetch('/api/models/organizations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orgData),
      });
      const result = await response.json();

      if (response.ok) {
        await fetchOrganizationDetails();
        toast.success('Account created successfully! Welcome to Interworky.');
        // Redirect to dashboard home - OnboardingCTA will guide setup
        router.replace('/dashboard/home');
      } else {
        console.error('Account creation failed:', result);
        toast.error(result.error || 'Failed to create account');
      }
    } catch (error) {
      console.error('Error creating account:', error);
      toast.error('An unexpected error occurred, please report to hello@interworky.com');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center h-screen">
          <BeatLoader color="#058A7C" size={150} />
        </div>
      }
    >
      <div className="mb-8">
        <h1 className="font-semiBold lg:text-3xl text-secondary pb-5 text-lg">Complete your account</h1>
      </div>
      <form onSubmit={handleSubmit(data => onSubmit(data, false))} className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <div htmlFor="website" className="text-[#646565] font-medium flex items-center gap-2 justify-between">
            <InfoLabel
              label="Website (Optional)"
              tooltipText="Your website will be used to sync content into your AI Agent. You can add this later."
            />
          </div>
          <Controller
            name="website"
            control={control}
            defaultValue=""
            rules={{
              pattern: {
                value: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})(\/[\w .-]*)*\/?$/,
                message: 'Invalid website address',
              },
            }}
            render={({ field }) => (
              <Input
                {...field}
                type="text"
                className="border rounded-[14px] border-[#CBCAD7] p-3 outline-none cursor-text text-secondary placeholder-gray-400 text-black"
                autoFocus
                placeholder="https://www.example.com"
                onChange={e => {
                  let value = e.target.value;
                  if (!value.startsWith('http://') && !value.startsWith('https://')) {
                    value = 'https://' + value;
                  }
                  field.onChange(value);
                }}
              />
            )}
          />
          {errors.website && <span className="text-body text-red-500">{errors.website.message}</span>}
        </div>

        <div className="flex flex-col gap-3">
          <Button isLoading={isLoading} size={'medium'}>
            Create Account
          </Button>
          <Button
            type="button"
            intent="secondary"
            size={'medium'}
            onClick={() => onSubmit({}, true)}
            disabled={isLoading}
          >
            Skip for now
          </Button>
        </div>
      </form>
    </Suspense>
  );
}
