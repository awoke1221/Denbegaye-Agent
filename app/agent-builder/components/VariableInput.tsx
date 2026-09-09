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
  executionResults?: Record<string, any> | null;
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
  executionResults,
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {label && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <label
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {label}
            {required && (
              <span style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1 }}>
                •
              </span>
            )}
          </label>
          {type !== 'password' && (
            <VariablePicker
              variables={availableVariables}
              onSelect={handleVariableSelect}
              fieldKey={fieldKey}
              debugData={executionResults}
            />
          )}
        </div>
      )}

      <div style={{ position: 'relative' }}>
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
            padding: '12px 14px',
            fontSize: '13px',
            border: '1px solid var(--border-default)',
            borderRadius: '12px',
            background: disabled ? 'rgba(17,24,39,0.02)' : 'rgba(255,255,255,0.34)',
            color: 'var(--text-primary)',
            outline: 'none',
            transition: 'all 0.2s ease',
            fontWeight: 500,
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6)',
          }}
          onFocus={e => {
            e.currentTarget.style.borderColor = 'var(--border-focus)';
            e.currentTarget.style.boxShadow =
              '0 0 0 3px rgba(17,24,39,0.05), inset 0 1px 0 rgba(255,255,255,0.6)';
          }}
          onBlur={e => {
            e.currentTarget.style.borderColor = 'var(--border-default)';
            e.currentTarget.style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.6)';
          }}
        />
      </div>

      {description && (
        <p
          style={{
            fontSize: '12px',
            color: 'var(--text-secondary)',
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          {description}
        </p>
      )}

      {type !== 'password' && value && value.includes('{{') && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
          {Array.from(value.matchAll(/\{\{([^}]+)\}\}/g)).map((match, i) => (
            <span
              key={i}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '11px',
                background: 'rgba(17,24,39,0.05)',
                color: 'var(--text-primary)',
                padding: '6px 10px',
                borderRadius: '9999px',
                border: '1px solid var(--border-default)',
                fontFamily: 'var(--font-mono)',
                fontWeight: 600,
                animation: 'slideInUp 0.3s ease',
              }}
            >
              <style>{`
                @keyframes slideInUp {
                  from {
                    opacity: 0;
                    transform: translateY(8px);
                  }
                  to {
                    opacity: 1;
                    transform: translateY(0);
                  }
                }
              `}</style>
              {`⚡ {{${match[1]}}}`}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
