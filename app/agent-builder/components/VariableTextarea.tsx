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
  executionResults?: Record<string, any> | null;
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
  executionResults,
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
          <VariablePicker
            variables={availableVariables}
            onSelect={handleVariableSelect}
            fieldKey={fieldKey}
            debugData={executionResults}
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
            minHeight: '140px',
            padding: '12px 16px',
            fontSize: '13px',
            border: '2px solid var(--color-border)',
            borderRadius: '12px',
            background: disabled ? 'var(--color-muted)' : 'var(--color-input)',
            color: 'var(--color-foreground)',
            resize: 'vertical',
            outline: 'none',
            fontFamily: 'var(--font-mono)',
            lineHeight: 1.6,
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

      {value && value.includes('{{') && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            marginTop: '8px',
            padding: '12px',
            background:
              'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
            borderRadius: '12px',
            border: '1px solid rgba(102, 126, 234, 0.1)',
          }}
        >
          <div
            style={{
              width: '100%',
              fontSize: '11px',
              fontWeight: 600,
              color: '#667eea',
              marginBottom: '4px',
            }}
          >
            ⚡ Inserted Variables:
          </div>
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
              {`{{${match[1]}}}`}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
