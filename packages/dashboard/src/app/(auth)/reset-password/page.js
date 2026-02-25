'use client';

import { Controller, useForm } from 'react-hook-form';
import { getUser, removeOrg, removeTokenAndUser, setTokenAndUser } from '@/_common/utils/localStorage';
import { Suspense, useEffect, useRef } from 'react';

import PasswordEye from '@/app/components/SetupAccount/PasswordEye';
import fireToast from '@/_common/hooks/fireToast';
import useDecodeToken from '@/_common/hooks/useDecodeToken';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Input from '@/app/components/ui/Input';
import { Button } from '@/app/components/ui/Button';
import { BeatLoader } from 'react-spinners';
import { useNotification } from '@/_common/utils/handleSlackNotification';
import { signIn } from 'next-auth/react';

function ResetPassword() {
  const toast = fireToast();
  const router = useRouter();
  const { handleNotification } = useNotification();
  const hasTrackedPageView = useRef(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetPasswordError, setResetPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const password = watch('password');

  const { userId, decodeError } = useDecodeToken();

  // Track password page view (only for users coming from /new flow)
  useEffect(() => {
    if (hasTrackedPageView.current) return;

    const pendingSyncData = sessionStorage.getItem('pendingSync');
    if (pendingSyncData) {
      try {
        const { domain } = JSON.parse(pendingSyncData);
        handleNotification(`[/new → Password] User on password reset page: ${domain}`);
        hasTrackedPageView.current = true;
      } catch (e) {
        // Ignore parse errors
      }
    }
  }, [handleNotification]);

  const fetchOrganizationDetails = async () => {
    try {
      const user = getUser();
      if (!user?.id) {
        toast.error('User not authenticated');
        return null;
      }

      const response = await fetch(`/api/models/organizations/created_by/${user.id}`);
      const result = await response.json();
      if (!response.ok) {
        toast.error(`Failed to fetch Account details: ${response.statusText}`);
        return null;
      }

      try {
        localStorage.setItem('organization', JSON.stringify(result));
      } catch (storageError) {
        console.error('LocalStorage error:', storageError);
        // Continue execution even if storage fails
      }

      return result;
    } catch (error) {
      console.error('Error fetching organization details:', error);
      toast.error('An error occurred while fetching Account details.');
      return null;
    }
  };

  const onSubmit = async data => {
    if (decodeError) {
      return;
    }
    setResetPasswordError('');
    try {
      setIsLoading(true);
      const response = await fetch('/api/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...data, id: userId }),
      });

      const result = await response.json();
      if (result.success) {
        setTokenAndUser(result.token, result.user, 5 * 60 * 60 * 1000); // Save the token and user data for 5 hours

        // Track successful password reset for /new flow users
        const pendingSyncData = sessionStorage.getItem('pendingSync');
        if (pendingSyncData) {
          try {
            const { domain } = JSON.parse(pendingSyncData);
            handleNotification(`[/new → Password] ✅ Password set successfully: ${domain}`);
            // Mark that user completed password setup (for dashboard tracking)
            sessionStorage.setItem('newFlowPasswordSet', 'true');
          } catch (e) {
            // Ignore parse errors
          }
        }

        // Create NextAuth session (required for dashboard access)
        const signInResult = await signIn('credentials', {
          email: result.user.email,
          password: data.password,
          redirect: false,
        });

        if (signInResult?.error) {
          toast.error('Failed', 'Session creation failed');
          setResetPasswordError(['Session creation failed. Please try logging in.']);
          return;
        }

        const org = await fetchOrganizationDetails();
        router.push('/dashboard/home');
      } else {
        toast.error('Failed', result.message);
        setResetPasswordError([result.message]);
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      setResetPasswordError(['An error occurred. Please try again.']);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="pb-5 font-semiBold text-subTitle lg:text-[32px] text-secondary">Set New Password</h1>
        <p className="text-[#49475A] text-xs lg:text-base">Please set a new password for your account</p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        <Controller
          name="password"
          control={control}
          defaultValue=""
          rules={{
            required: 'Password is required',
            minLength: { value: 8, message: 'Password must be at least 8 characters' },
          }}
          render={({ field }) => (
            <div className="relative">
              <Input
                {...field}
                type={showPassword ? 'text' : 'password'}
                label="New password"
                placeholder="New password"
                error={errors.password?.message}
                className="text-body bg-white cursor-text outline-none text-secondary"
              />
              <PasswordEye show={showPassword} setShow={setShowPassword} />
            </div>
          )}
        />

        <Controller
          name="confirmPassword"
          control={control}
          defaultValue=""
          rules={{
            required: 'Confirm Password is required',
            validate: value => value === password || 'Passwords do not match',
          }}
          render={({ field }) => (
            <div className="relative">
              <Input
                {...field}
                type={showConfirmPassword ? 'text' : 'password'}
                label="Confirm password"
                placeholder="Confirm password"
                error={errors.confirmPassword?.message}
                className="text-body bg-white cursor-text outline-none text-secondary"
              />
              <PasswordEye show={showConfirmPassword} setShow={setShowConfirmPassword} />
            </div>
          )}
        />

        <Button disabled={isLoading || decodeError} isLoading={isLoading}>
          Submit
        </Button>
        {resetPasswordError && <p className="text-center text-red-500">{resetPasswordError}</p>}
      </form>
    </div>
  );
}
export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen">
          <BeatLoader color="#058A7C" size={24} />
        </div>
      }
    >
      <ResetPassword />
    </Suspense>
  );
}
