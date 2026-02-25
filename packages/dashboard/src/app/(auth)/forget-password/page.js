'use client';

import { Controller, useForm } from 'react-hook-form';

import fireToast from '@/_common/hooks/fireToast';
import { Button } from '@/app/components/ui/Button';
import Input from '@/app/components/ui/Input';
import Image from 'next/image';
import { useState } from 'react';

export default function ForgetPassword() {
  const toast = fireToast();
  const [forgetPasswordError, setForgetPasswordError] = useState('');
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const renderEmail = () => {
    return (
      <div className="text-center">
        <Image src="/email-sent.png" alt="Success" width={50} height={50} className="mx-auto mb-4" />
        <h2 className="text-lg font-semiBold text-secondary">We sent you an email</h2>
        <p className=" text-secondary-light">Please check your inbox for a reset password email from Interworky.</p>
        <a href="mailto:hello@interworky.com" className="text-teal-600 underline">
          Didn’t receive an email?
        </a>
      </div>
    );
  };
  const onSubmit = async data => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/send-reset-password-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (result.success) {
        toast.success('Success', 'We have sent you an email');
        setIsEmailSent(true);
      } else {
        toast.error('Failed', result.message);
        setForgetPasswordError([result.message]);
      }
    } catch (error) {
      setForgetPasswordError(['An error occurred. Please try again.']);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div>
      <div className="mb-8">
        <h1 className="pb-5 font-semiBold text-subTitle lg:text-[32px] text-secondary">Forget your password?</h1>
        <p className="text-[#49475A] text-xs lg:text-base">
          {isEmailSent
            ? ''
            : 'Don’t worry, it happens to all of us, please enter your email below to recover your password'}
        </p>
      </div>
      {isEmailSent ? (
        renderEmail()
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className=" flex flex-col gap-6">
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
                label="Email"
                placeholder="example@google.com"
                error={errors.email?.message}
                helperText={'Please enter a valid email address'}
                className="text-body bg-white cursor-text outline-none text-secondary"
              />
            )}
          />
          <Button isLoading={isLoading}>Submit</Button>
          {forgetPasswordError && <p className="text-center text-red-500">{forgetPasswordError}</p>}
        </form>
      )}
    </div>
  );
}
