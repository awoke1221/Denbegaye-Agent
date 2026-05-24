'use client';

import { useRef } from 'react';
import { VariablePicker } from './VariablePicker';
import { VariableOption } from '../hooks/useVariablePicker';

interface VariableInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  availableVariables: VariableOption[];
  fieldKey: string;
  label?: string;
  required?: boolean;
  type?: 'text' | 'password' | 'email';
  description?: string;
  className?: string;
}

export function VariableInput({
  value,
  onChange,
  placeholder,
  disabled,
  availableVariables,
  fieldKey,
  label,
  required,
  type = 'text',
  description,
  className,
}: VariableInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleVariableSelect = (variable: string) => {
    const input = inputRef.current;
    if (!input) {
      onChange((value || '') + variable);
      return;
    }
    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    const current = value || '';
    const newValue = current.slice(0, start) + variable + current.slice(end);
    onChange(newValue);
    setTimeout(() => {
      input.focus();
      const newPos = start + variable.length;
      input.setSelectionRange(newPos, newPos);
    }, 0);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {label && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
          }}
        >
          <label
            style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-text-secondary)' }}
          >
            {label}
            {required && <span style={{ color: 'var(--color-danger)', marginLeft: '4px' }}>*</span>}
          </label>
          {type !== 'password' && (
            <VariablePicker
              variables={availableVariables}
              onSelect={handleVariableSelect}
              fieldKey={fieldKey}
            />
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type={type}
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={className}
        style={{
          width: '100%',
          padding: '11px 12px',
          fontSize: '12px',
          border: '1px solid var(--color-border-tertiary)',
          borderRadius: '8px',
          background: 'var(--color-background-secondary)',
          color: 'var(--color-text-primary)',
          outline: 'none',
        }}
      />

      {description && (
        <p style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', margin: 0 }}>
          {description}
        </p>
      )}

      {type !== 'password' && value && value.includes('{{') && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {Array.from(value.matchAll(/\{\{([^}]+)\}\}/g)).map((match, i) => (
            <span
              key={i}
              style={{
                fontSize: '10px',
                background: 'var(--color-background-secondary)',
                color: 'var(--color-accent-primary)',
                padding: '3px 8px',
                borderRadius: '999px',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {'{'}
              {match[1]}
              {'}'}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
