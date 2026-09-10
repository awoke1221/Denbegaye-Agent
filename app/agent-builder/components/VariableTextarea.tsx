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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {label && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
          }}
        >
          <label
            style={{
              fontSize: '10px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              letterSpacing: '0.1em',
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
            minHeight: '112px',
            padding: '11px 13px',
            fontSize: '13px',
            border: '1px solid var(--input-border)',
            borderRadius: '10px',
            background: disabled
              ? 'var(--bg-subtle)'
              : 'linear-gradient(145deg, var(--input-bg), var(--bg-subtle))',
            color: 'var(--text-primary)',
            resize: 'vertical',
            outline: 'none',
            fontFamily: 'var(--font-mono)',
            lineHeight: 1.55,
            transition: 'border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease',
            fontWeight: 500,
            boxShadow: '0 1px 2px var(--shadow-soft), inset 0 1px 0 rgba(255,255,255,0.45)',
          }}
          onFocus={e => {
            e.currentTarget.style.borderColor = 'var(--input-focus)';
            e.currentTarget.style.boxShadow =
              '0 0 0 3px var(--input-focus-ring), 0 4px 12px var(--shadow-soft)';
          }}
          onBlur={e => {
            e.currentTarget.style.borderColor = 'var(--input-border)';
            e.currentTarget.style.boxShadow =
              '0 1px 2px var(--shadow-soft), inset 0 1px 0 rgba(255,255,255,0.45)';
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
              fontWeight: 700,
              color: 'var(--text-secondary)',
              marginBottom: '4px',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
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
              {`{{${match[1]}}}`}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
