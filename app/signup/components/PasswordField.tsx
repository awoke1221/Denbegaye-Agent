'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PasswordFieldProps {
  id: string;
  name: string;
  label: string;
  value: string;
  placeholder: string;
  disabled?: boolean;
  hasError?: boolean;
  errorMessage?: string;
  ariaDescribedBy?: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function PasswordField({
  id,
  name,
  label,
  value,
  placeholder,
  disabled,
  hasError = false,
  errorMessage,
  ariaDescribedBy,
  onChange,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          name={name}
          type={visible ? 'text' : 'password'}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className="bg-slate-950/95 text-white pr-10 disabled:opacity-60 disabled:cursor-not-allowed"
          disabled={disabled}
          aria-invalid={hasError}
          aria-describedby={ariaDescribedBy}
          autoComplete="new-password"
          spellCheck={false}
          autoCapitalize="off"
        />

        <button
          type="button"
          onClick={() => setVisible(prev => !prev)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          title={visible ? 'Hide password' : 'Show password'}
          className="absolute inset-y-0 right-2 flex items-center rounded-md px-2 text-slate-400 transition-colors duration-150 hover:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-400"
        >
          {visible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </div>

      {errorMessage ? (
        <p id={`${id}-error`} role="alert" className="text-sm text-rose-300">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
