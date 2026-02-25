'use client';

import { Controller, useForm } from 'react-hook-form';
import { Suspense, useState } from 'react';

import Link from 'next/link';
import PasswordEye from '@/app/components/SetupAccount/PasswordEye';
import { RingLoader } from 'react-spinners';
import fireToast from '@/_common/hooks/fireToast';
import { useRouter } from 'next/navigation';
import { Signin } from '@/app/components/auth/GoogleButton';
import Input from '@/app/components/ui/Input';
import { Button } from '@/app/components/ui/Button';
import { getCSRFTokenFromMeta } from '@/lib/csrf';
import { setTokenAndUser } from '@/_common/utils/localStorage';
import { signIn } from 'next-auth/react';

export default function Login() {
  const toast = fireToast();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(null);
  const [loginError, setLoginError] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const fetchOrganizationDetails = async userId => {
    const response = await fetch(`/api/models/organizations/created_by/${userId}`);
    const result = await response.json();
    return result;
  };

  const onSubmit = async data => {
    setLoginError([]);
    try {
      setIsLoading(true);
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (result.success) {
        setTokenAndUser(result.token, result.user, 10 * 60 * 60 * 1000); // 10 hours in ms
        const organizationDetails = await fetchOrganizationDetails(result.user.id);
        if (organizationDetails) {
          localStorage.setItem('organization', JSON.stringify(organizationDetails));
        }
        // Create NextAuth session from client-side (this properly sets session cookie)
        const signInResult = await signIn('credentials', {
          email: data.email,
          password: data.password,
          redirect: false,
        });
        if (signInResult?.error) {
          toast.error('Failed', 'Session creation failed');
          setLoginError(['Session creation failed. Please try again.']);
          return;
        }
        router.push('/dashboard/home');
      } else {
        toast.error('Failed', result.message);
        setLoginError([result.message]);
      }
    } catch (error) {
      setLoginError(['An error occurred. Please try again.']);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center h-screen">
          <RingLoader color="#4A90E2" size={150} />
        </div>
      }
    >
      <div className="mb-6">
        <h1 className="font-semiBold lg:text-3xl text-secondary text-lg">Login to your account</h1>
      </div>
      <Signin title={'Login with Google'} />
      <div className="flex justify-center items-center my-2">
        <svg width="350" height="26" viewBox="0 0 399 26" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect opacity="0.8" y="12.25" width="165.5" height="1.5" fill="#CBCAD7" />
          <path
            d="M195.628 20.18C194.716 20.18 193.876 20.018 193.108 19.694C192.352 19.37 191.686 18.92 191.11 18.344C190.546 17.756 190.108 17.066 189.796 16.274C189.484 15.482 189.328 14.618 189.328 13.682C189.328 12.746 189.484 11.882 189.796 11.09C190.108 10.298 190.546 9.614 191.11 9.038C191.686 8.45 192.352 7.994 193.108 7.67C193.876 7.346 194.716 7.184 195.628 7.184C196.528 7.184 197.362 7.346 198.13 7.67C198.898 7.994 199.564 8.45 200.128 9.038C200.692 9.626 201.13 10.316 201.442 11.108C201.754 11.9 201.91 12.758 201.91 13.682C201.91 14.618 201.754 15.482 201.442 16.274C201.13 17.054 200.692 17.738 200.128 18.326C199.564 18.914 198.898 19.37 198.13 19.694C197.362 20.018 196.528 20.18 195.628 20.18ZM195.628 17.948C196.204 17.948 196.726 17.846 197.194 17.642C197.674 17.426 198.088 17.126 198.436 16.742C198.784 16.358 199.054 15.908 199.246 15.392C199.45 14.864 199.552 14.294 199.552 13.682C199.552 13.07 199.45 12.506 199.246 11.99C199.054 11.462 198.784 11.006 198.436 10.622C198.088 10.238 197.674 9.944 197.194 9.74C196.726 9.524 196.204 9.416 195.628 9.416C195.052 9.416 194.524 9.524 194.044 9.74C193.576 9.944 193.162 10.238 192.802 10.622C192.454 11.006 192.184 11.456 191.992 11.972C191.8 12.488 191.704 13.058 191.704 13.682C191.704 14.51 191.872 15.248 192.208 15.896C192.544 16.532 193.006 17.036 193.594 17.408C194.182 17.768 194.86 17.948 195.628 17.948ZM204.034 20V10.514H206.194L206.23 13.538L205.942 12.854C206.074 12.374 206.302 11.942 206.626 11.558C206.95 11.174 207.322 10.874 207.742 10.658C208.174 10.43 208.618 10.316 209.074 10.316C209.278 10.316 209.47 10.334 209.65 10.37C209.842 10.406 209.998 10.448 210.118 10.496L209.542 12.908C209.398 12.836 209.23 12.782 209.038 12.746C208.858 12.698 208.672 12.674 208.48 12.674C208.168 12.674 207.874 12.734 207.598 12.854C207.334 12.962 207.1 13.118 206.896 13.322C206.704 13.526 206.548 13.766 206.428 14.042C206.308 14.306 206.248 14.6 206.248 14.924V20H204.034Z"
            fill="#686677"
          />
          <rect opacity="0.8" x="233.5" y="12.25" width="165.5" height="1.5" fill="#CBCAD7" />
        </svg>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6 w-full">
        <input type="hidden" name="_csrf" value={getCSRFTokenFromMeta()} />
        <Controller
          name="email"
          control={control}
          defaultValue=""
          rules={{
            required: 'Email is required',
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Invalid email address',
            },
          }}
          render={({ field }) => (
            <Input
              {...field}
              type="email"
              placeholder="example@google.com"
              label="Email Address"
              error={errors.email?.message}
              className="bg-white cursor-text outline-none"
            />
          )}
        />
        <Controller
          name="password"
          control={control}
          defaultValue=""
          rules={{
            required: 'Password is required',
            minLength: {
              value: 8,
              message: 'Password must be at least 8 characters',
            },
          }}
          render={({ field }) => (
            <div className="relative">
              <Input
                {...field}
                type={showPassword ? 'text' : 'password'}
                label="Password"
                placeholder="Enter your password"
                error={errors.password?.message}
                className="bg-white cursor-text outline-none"
              />
              <PasswordEye show={showPassword} setShow={setShowPassword} />
            </div>
          )}
        />
        <Button intent={'underline'} className={'w-fit !py-0 !px-0'}>
          <Link href="/forget-password" className="text-primary font-medium">
            Forget password?
          </Link>
        </Button>
        <div className="flex flex-col gap-2">
          <Button isLoading={isLoading} size={'medium'}>
            Login
          </Button>

          <div className="text-secondary flex gap-1 justify-center items-center mt-3">
            Don’t have account?
            <Button intent={'underline'} className={'w-fit !py-0 !px-0'}>
              <Link href={'/setup-account'} className="text-primary font-medium">
                Create account
              </Link>
            </Button>
          </div>
        </div>
      </form>
    </Suspense>
  );
}
