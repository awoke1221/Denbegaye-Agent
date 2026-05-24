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
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--color-foreground)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {label}
            {required && (
              <span style={{ color: '#ef4444', fontSize: '16px', lineHeight: 1 }}>•</span>
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
            padding: '12px 16px',
            fontSize: '13px',
            border: '2px solid var(--color-border)',
            borderRadius: '12px',
            background: disabled ? 'var(--color-muted)' : 'var(--color-input)',
            color: 'var(--color-foreground)',
            outline: 'none',
            transition: 'all 0.2s ease',
            fontWeight: 500,
          }}
          onFocus={e => {
            e.currentTarget.style.borderColor = '#667eea';
            e.currentTarget.style.boxShadow = '0 0 0 4px rgba(102, 126, 234, 0.1)';
          }}
          onBlur={e => {
            e.currentTarget.style.borderColor = 'var(--color-border)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        />
      </div>

      {description && (
        <p
          style={{
            fontSize: '12px',
            color: 'var(--color-muted-foreground)',
            margin: 0,
            lineHeight: 1.4,
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
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: '#fff',
                padding: '6px 12px',
                borderRadius: '10px',
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
