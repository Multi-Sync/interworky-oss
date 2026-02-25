'use client';

import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

const Input = forwardRef(
  (
    {
      className = '',
      type = 'text',
      label = '',
      error = '',
      disabled = false,
      required = false,
      id,
      name,
      placeholder = '',
      onChange,
      onBlur,
      onFocus,
      value,
      defaultValue,
      helperText = '',
      hideLabel = false,
      containerClassName = '',
      labelClassName = '',
      errorClassName = '',
      helperTextClassName = '',
      ...props
    },
    ref,
  ) => {
    const inputId = id || name || `input-${Math.random().toString(36).substring(2, 11)}`;

    return (
      <div className={cn('flex flex-col gap-1 w-full', containerClassName)}>
        {label && !hideLabel && (
          <label
            htmlFor={inputId}
            className={cn('text-body font-medium', error ? 'text-red-400' : 'text-secondary-light', labelClassName)}
          >
            {label}
            {required && <span className="ml-1 text-red-400">*</span>}
          </label>
        )}
        <input
          id={inputId}
          name={name}
          type={type}
          placeholder={placeholder}
          disabled={disabled}
          onChange={onChange}
          onBlur={onBlur}
          onFocus={onFocus}
          value={value}
          defaultValue={defaultValue}
          required={required}
          ref={ref}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          className={cn(
            'flex text-secondary placeholder-tertiary h-10 w-full border rounded-[14px] border-[#CBCAD7] px-4 py-6 text-base md:text-body font-medium bg-white',
            'ring-offset-background file:border-0 file:bg-transparent file:text-base file:font-medium',
            'placeholder:text-muted-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error && ' border-red-400 focus-visible:ring-red-400',
            className,
          )}
          {...props}
        />
        {error && (
          <p id={`${inputId}-error`} className={cn('mt-1 text-xs text-red-400', errorClassName)}>
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={`${inputId}-helper`} className={cn('text-tertiary mt-1 text-xs', helperTextClassName)}>
            {helperText}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';

export default Input;
