'use client';

import { useRef } from 'react';
import { VariablePicker } from './VariablePicker';
import { VariableOption } from '../hooks/useVariablePicker';

interface VariableTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  availableVariables: VariableOption[];
  fieldKey: string;
  label?: string;
  required?: boolean;
  description?: string;
  className?: string;
}

export function VariableTextarea({
  value,
  onChange,
  placeholder,
  rows = 3,
  disabled,
  availableVariables,
  fieldKey,
  label,
  required,
  description,
  className,
}: VariableTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleVariableSelect = (variable: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      onChange((value || '') + variable);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const current = value || '';
    const newValue = current.slice(0, start) + variable + current.slice(end);

    onChange(newValue);

    setTimeout(() => {
      textarea.focus();
      const newPos = start + variable.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
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
            style={{
              fontSize: '12px',
              fontWeight: 500,
              color: 'var(--color-text-secondary)',
            }}
          >
            {label}
            {required && <span style={{ color: 'var(--color-danger)', marginLeft: '4px' }}>*</span>}
          </label>
          <VariablePicker
            variables={availableVariables}
            onSelect={handleVariableSelect}
            fieldKey={fieldKey}
          />
        </div>
      )}

      <div style={{ position: 'relative' }}>
        <textarea
          ref={textareaRef}
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          disabled={disabled}
          className={className}
          style={{
            width: '100%',
            minHeight: '120px',
            padding: '10px',
            fontSize: '12px',
            border: '1px solid var(--color-border-tertiary)',
            borderRadius: '8px',
            background: 'var(--color-background-secondary)',
            color: 'var(--color-text-primary)',
            resize: 'vertical',
            outline: 'none',
            fontFamily: 'var(--font-sans)',
            lineHeight: 1.6,
          }}
        />
      </div>

      {description && (
        <p
          style={{
            fontSize: '11px',
            color: 'var(--color-text-tertiary)',
            margin: 0,
          }}
        >
          {description}
        </p>
      )}

      {value && value.includes('{{') && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '6px',
            marginTop: '4px',
          }}
        >
          {Array.from(value.matchAll(/\{\{([^}]+)\}\}/g)).map((match, i) => (
            <span
              key={i}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
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
