'use client';

import { useState, useRef, useEffect } from 'react';
import { VariableOption } from '../hooks/useVariablePicker';

interface VariablePickerProps {
  variables: VariableOption[];
  onSelect: (variable: string) => void;
  fieldKey: string;
}

export function VariablePicker({ variables, onSelect, fieldKey }: VariablePickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = variables.filter(
    v =>
      v.path.toLowerCase().includes(search.toLowerCase()) ||
      v.displayPath.toLowerCase().includes(search.toLowerCase()) ||
      v.description.toLowerCase().includes(search.toLowerCase()) ||
      v.nodeLabel.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = filtered.reduce(
    (acc, v) => {
      const key = `${v.nodeId}|${v.nodeLabel}|${v.nodeType}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(v);
      return acc;
    },
    {} as Record<string, VariableOption[]>
  );

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        title="Insert variable from previous node"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 8px',
          fontSize: '11px',
          background: open ? 'var(--color-background-secondary)' : 'transparent',
          border: '1px solid var(--color-border-tertiary)',
          borderRadius: '6px',
          cursor: 'pointer',
          color: 'var(--color-text-secondary)',
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{ fontSize: '13px' }}>{'{ }'}</span>
        <span>Variables</span>
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '8px',
            width: '340px',
            maxHeight: '420px',
            overflowY: 'auto',
            background: 'var(--color-background-primary)',
            border: '1px solid var(--color-border-secondary)',
            borderRadius: '12px',
            boxShadow: '0 16px 32px rgba(0,0,0,0.12)',
            zIndex: 1000,
            fontFamily: 'var(--font-sans)',
          }}
        >
          <div
            style={{
              padding: '10px',
              borderBottom: '1px solid var(--color-border-tertiary)',
            }}
          >
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search variables..."
              style={{
                width: '100%',
                padding: '8px 10px',
                fontSize: '12px',
                border: '1px solid var(--color-border-tertiary)',
                borderRadius: '8px',
                background: 'var(--color-background-secondary)',
                color: 'var(--color-text-primary)',
                outline: 'none',
              }}
            />
          </div>

          {variables.length === 0 && (
            <div
              style={{
                padding: '16px',
                textAlign: 'center',
                fontSize: '12px',
                color: 'var(--color-text-secondary)',
              }}
            >
              No previous nodes connected yet. Connect a node to this one to see its outputs.
            </div>
          )}

          {Object.entries(grouped).map(([key, vars]) => {
            const [nodeId, nodeLabel, nodeType] = key.split('|');
            return (
              <div key={key}>
                <div
                  style={{
                    padding: '8px 12px 6px',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'var(--color-text-secondary)',
                    background: 'var(--color-background-secondary)',
                    borderBottom: '1px solid var(--color-border-tertiary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span
                    style={{
                      background: 'var(--color-background-secondary)',
                      color: 'var(--color-accent-primary)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '10px',
                    }}
                  >
                    {nodeId}
                  </span>
                  <span>{nodeLabel}</span>
                  <span
                    style={{
                      fontSize: '10px',
                      color: 'var(--color-text-tertiary)',
                    }}
                  >
                    {nodeType}
                  </span>
                </div>
                {vars.map(v => (
                  <button
                    key={v.path}
                    type="button"
                    onClick={() => {
                      onSelect(`{{${v.path}}}`);
                      setOpen(false);
                      setSearch('');
                    }}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      width: '100%',
                      padding: '10px 12px',
                      textAlign: 'left',
                      background: 'transparent',
                      border: 'none',
                      borderBottom: '1px solid var(--color-border-tertiary)',
                      cursor: 'pointer',
                      gap: '4px',
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.background =
                        'var(--color-background-secondary)';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.background = 'transparent';
                    }}
                  >
                    <span
                      style={{
                        fontSize: '12px',
                        color: 'var(--color-accent-primary)',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {`{{${v.path}}}`}
                    </span>
                    <span
                      style={{
                        fontSize: '11px',
                        color: 'var(--color-text-secondary)',
                      }}
                    >
                      {v.description}
                    </span>
                    {v.preview && (
                      <span
                        style={{
                          fontSize: '10px',
                          color: 'var(--color-text-tertiary)',
                          fontFamily: 'var(--font-mono)',
                          background: 'var(--color-background-secondary)',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {v.preview}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
