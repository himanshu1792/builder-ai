"use client";

import { useState } from "react";

interface PasswordFieldProps {
  name: string;
  label: string;
  defaultValue?: string;
  error?: string[];
}

export function PasswordField({
  name,
  label,
  defaultValue,
  error,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label
        htmlFor={name}
        className="mb-1.5 block text-sm font-medium text-text-primary"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={name}
          name={name}
          type={visible ? "text" : "password"}
          defaultValue={defaultValue}
          className={`w-full rounded-lg border bg-surface px-3 py-2 pr-10 text-sm text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 ${
            error && error.length > 0
              ? "border-red-400 focus:border-red-500 focus:ring-red-500/20"
              : "border-border hover:border-border-hover"
          }`}
          placeholder={`Enter ${label.toLowerCase()}`}
        />
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-text-muted transition-colors hover:text-text-secondary"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? (
            /* Eye-off icon */
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M9.41301 9.41337C9.23023 9.60982 9.00943 9.76747 8.76412 9.87697C8.5188 9.98647 8.25393 10.0457 7.98539 10.0512C7.71685 10.0567 7.44984 10.0082 7.20032 9.90876C6.9508 9.8093 6.72388 9.66098 6.53178 9.46888C6.33968 9.27678 6.19136 9.04986 6.0919 8.80034C5.99244 8.55082 5.94395 8.28381 5.94943 8.01527C5.95492 7.74673 6.01419 7.48186 6.12369 7.23655C6.23319 6.99123 6.39084 6.77043 6.58729 6.58765M11.96 11.96C10.8204 12.8287 9.43274 13.3099 7.99967 13.3334C3.33301 13.3334 0.666676 8.00004 0.666676 8.00004C1.49561 6.4546 2.64609 5.10445 4.03967 4.04004L11.96 11.96ZM6.59967 2.82671C7.05856 2.71935 7.5286 2.66575 8.00034 2.66671C12.667 2.66671 15.3337 8.00004 15.3337 8.00004C14.9287 8.75712 14.446 9.46989 13.893 10.1267L6.59967 2.82671Z"
                stroke="currentColor"
                strokeWidth="1.33"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M0.666676 0.666626L15.3333 15.3333"
                stroke="currentColor"
                strokeWidth="1.33"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            /* Eye icon */
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M0.666676 8.00004C0.666676 8.00004 3.33334 2.66671 8.00001 2.66671C12.6667 2.66671 15.3333 8.00004 15.3333 8.00004C15.3333 8.00004 12.6667 13.3334 8.00001 13.3334C3.33334 13.3334 0.666676 8.00004 0.666676 8.00004Z"
                stroke="currentColor"
                strokeWidth="1.33"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M8 10C9.10457 10 10 9.10457 10 8C10 6.89543 9.10457 6 8 6C6.89543 6 6 6.89543 6 8C6 9.10457 6.89543 10 8 10Z"
                stroke="currentColor"
                strokeWidth="1.33"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>
      </div>
      {error && error.length > 0 && (
        <p className="mt-1.5 text-xs text-red-600">{error[0]}</p>
      )}
    </div>
  );
}
