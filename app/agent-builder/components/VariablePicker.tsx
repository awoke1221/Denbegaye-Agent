'use client';

import { useState, useRef, useEffect } from 'react';
import { VariableOption } from '../hooks/useVariablePicker';

interface VariablePickerProps {
  variables: VariableOption[];
  onSelect: (variable: string) => void;
  fieldKey: string;
  debugData?: Record<string, any> | null;
}

const getCategoryIcon = (category: string) => {
  switch (category.toLowerCase()) {
    case 'output':
      return '📤';
    case 'data':
      return '📊';
    case 'meta':
      return '📝';
    default:
      return '🔗';
  }
};

const getCategoryColor = (category: string) => {
  switch (category.toLowerCase()) {
    case 'output':
      return '#3b82f6';
    case 'data':
      return '#10b981';
    case 'meta':
      return '#f59e0b';
    default:
      return '#8b5cf6';
  }
};

export function VariablePicker({ variables, onSelect, fieldKey, debugData }: VariablePickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
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

  const groupedByCategory = filtered.reduce(
    (acc, v) => {
      if (!acc[v.category]) acc[v.category] = [];
      acc[v.category].push(v);
      return acc;
    },
    {} as Record<string, VariableOption[]>
  );

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        title="Insert variable from previous node output"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          fontSize: '12px',
          fontWeight: 600,
          background: open
            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          border: 'none',
          borderRadius: '10px',
          cursor: 'pointer',
          color: '#fff',
          whiteSpace: 'nowrap',
          transition: 'all 0.3s ease',
          boxShadow: open
            ? '0 8px 24px rgba(102, 126, 234, 0.4)'
            : '0 4px 12px rgba(102, 126, 234, 0.2)',
          transform: open ? 'translateY(-2px)' : 'translateY(0)',
        }}
      >
        <span style={{ fontSize: '14px' }}>⚡</span>
        <span>Insert Variable</span>
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setOpen(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.3)',
              backdropFilter: 'blur(4px)',
              zIndex: 999,
              animation: 'fadeIn 0.2s ease',
            }}
          />
          {/* Modal */}
          <div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '90vw',
              maxWidth: '900px',
              maxHeight: '85vh',
              background: 'var(--color-popover)',
              border: '1px solid var(--color-border)',
              borderRadius: '20px',
              boxShadow: '0 24px 48px rgba(0, 0, 0, 0.2), 0 0 100px rgba(102, 126, 234, 0.15)',
              zIndex: 1000,
              display: 'flex',
              flexDirection: 'column',
              animation: 'slideUp 0.3s ease',
              overflow: 'hidden',
            }}
          >
            <style>{`
              @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
              }
              @keyframes slideUp {
                from {
                  opacity: 0;
                  transform: translate(-50%, -45%);
                }
                to {
                  opacity: 1;
                  transform: translate(-50%, -50%);
                }
              }
            `}</style>

            {/* Header */}
            <div
              style={{
                padding: '24px',
                borderBottom: '1px solid var(--color-border)',
                background: 'var(--color-card)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '16px',
                }}
              >
                <h2
                  style={{
                    margin: 0,
                    fontSize: '20px',
                    fontWeight: 700,
                    color: 'var(--color-foreground)',
                  }}
                >
                  ⚡ Insert Variable from Previous Node
                </h2>
                <button
                  onClick={() => setOpen(false)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    fontSize: '24px',
                    cursor: 'pointer',
                    color: 'var(--color-muted-foreground)',
                    padding: '4px 8px',
                  }}
                >
                  ✕
                </button>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'stretch',
                }}
              >
                <div style={{ position: 'relative', flex: 1 }}>
                  <span
                    style={{
                      position: 'absolute',
                      left: '14px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: '16px',
                      color: 'var(--color-muted-foreground)',
                    }}
                  >
                    🔍
                  </span>
                  <input
                    autoFocus
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search node ID, label, field name..."
                    style={{
                      width: '100%',
                      paddingLeft: '44px',
                      paddingRight: '14px',
                      paddingTop: '12px',
                      paddingBottom: '12px',
                      fontSize: '14px',
                      border: '2px solid var(--color-border)',
                      borderRadius: '12px',
                      background: 'var(--color-input)',
                      color: 'var(--color-foreground)',
                      outline: 'none',
                      transition: 'all 0.2s ease',
                    }}
                    onFocus={e => {
                      e.currentTarget.style.borderColor = '#667eea';
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                    }}
                    onBlur={e => {
                      e.currentTarget.style.borderColor = 'var(--color-border)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Content */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'row',
                minHeight: 0,
              }}
            >
              {/* Left: Variables List */}
              <div
                style={{
                  flex: 1,
                  borderRight: '1px solid var(--color-border)',
                  overflowY: 'auto',
                  maxHeight: '100%',
                }}
              >
                {variables.length === 0 ? (
                  <div
                    style={{
                      padding: '48px 32px',
                      textAlign: 'center',
                      fontSize: '14px',
                      color: 'var(--color-muted-foreground)',
                    }}
                  >
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔗</div>
                    <div style={{ fontWeight: 600, marginBottom: '4px' }}>
                      No Variables Available
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--color-muted-foreground)' }}>
                      Run the workflow or connect a preceding node to see available data.
                    </div>
                  </div>
                ) : Object.entries(grouped).length === 0 ? (
                  <div
                    style={{
                      padding: '48px 32px',
                      textAlign: 'center',
                      fontSize: '14px',
                      color: 'var(--color-muted-foreground)',
                    }}
                  >
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔎</div>
                    <div style={{ fontWeight: 600, marginBottom: '4px' }}>No Matches Found</div>
                    <div style={{ fontSize: '13px', color: 'var(--color-muted-foreground)' }}>
                      Try a different field name or node label.
                    </div>
                  </div>
                ) : (
                  Object.entries(grouped).map(([key, vars]) => {
                    const [nodeId, nodeLabel, nodeType] = key.split('|');
                    return (
                      <div key={key} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        {/* Node Header */}
                        <div
                          style={{
                            padding: '16px',
                            background: 'var(--color-card)',
                            borderBottom: '1px solid var(--color-border)',
                            position: 'sticky',
                            top: 0,
                            zIndex: 10,
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              marginBottom: '8px',
                            }}
                          >
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '32px',
                                height: '32px',
                                borderRadius: '10px',
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                color: '#fff',
                                fontWeight: 700,
                                fontSize: '14px',
                              }}
                            >
                              {nodeId.charAt(0).toUpperCase()}
                            </span>
                            <div style={{ flex: 1 }}>
                              <div
                                style={{
                                  fontWeight: 700,
                                  fontSize: '14px',
                                  color: 'var(--color-foreground)',
                                }}
                              >
                                {nodeLabel}
                              </div>
                              <div
                                style={{
                                  fontSize: '12px',
                                  color: 'var(--color-muted-foreground)',
                                  fontFamily: 'var(--font-mono)',
                                }}
                              >
                                ID: {nodeId}
                              </div>
                            </div>
                            <span
                              style={{
                                fontSize: '12px',
                                fontWeight: 600,
                                color: '#667eea',
                                background: 'rgba(102, 126, 234, 0.1)',
                                padding: '4px 10px',
                                borderRadius: '8px',
                              }}
                            >
                              {nodeType}
                            </span>
                          </div>
                        </div>

                        {/* Variables */}
                        {vars.map(v => (
                          <button
                            key={v.path}
                            type="button"
                            onClick={() => {
                              onSelect(`{{${v.path}}}`);
                              setSelectedPath(v.path);
                              setTimeout(() => setOpen(false), 200);
                              setSearch('');
                            }}
                            onMouseEnter={e => {
                              (e.currentTarget as HTMLElement).style.background =
                                'var(--color-input)';
                            }}
                            onMouseLeave={e => {
                              (e.currentTarget as HTMLElement).style.background = 'transparent';
                            }}
                            style={{
                              width: '100%',
                              padding: '16px',
                              textAlign: 'left',
                              background: 'transparent',
                              border: 'none',
                              borderBottom: '1px solid var(--color-border)',
                              cursor: 'pointer',
                              display: 'grid',
                              gap: '10px',
                              transition: 'all 0.2s ease',
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                                gap: '12px',
                              }}
                            >
                              <div style={{ flex: 1 }}>
                                <div
                                  style={{
                                    fontSize: '13px',
                                    fontFamily: 'var(--font-mono)',
                                    color: '#667eea',
                                    fontWeight: 600,
                                    wordBreak: 'break-all',
                                    marginBottom: '4px',
                                  }}
                                >
                                  {`{{${v.path}}}`}
                                  {v.description &&
                                    v.description.toLowerCase().includes('expected') && (
                                      <span
                                        style={{
                                          marginLeft: '8px',
                                          fontSize: '11px',
                                          color: 'var(--color-muted-foreground)',
                                          background: 'transparent',
                                          padding: '2px 6px',
                                          borderRadius: '6px',
                                          border: '1px solid var(--color-border)',
                                          fontWeight: 600,
                                        }}
                                      >
                                        Expected
                                      </span>
                                    )}
                                </div>
                                <div
                                  style={{
                                    fontSize: '12px',
                                    color: 'var(--color-muted-foreground)',
                                    lineHeight: 1.5,
                                  }}
                                >
                                  {v.description}
                                </div>
                              </div>
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  color: '#fff',
                                  background: getCategoryColor(v.category),
                                  padding: '4px 12px',
                                  borderRadius: '6px',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {getCategoryIcon(v.category)} {v.category.toUpperCase()}
                              </span>
                            </div>

                            {v.preview && (
                              <div
                                style={{
                                  padding: '10px 12px',
                                  background: 'var(--color-card)',
                                  borderRadius: '10px',
                                  border: '1px solid var(--color-border)',
                                  fontSize: '11px',
                                  color: 'var(--color-muted-foreground)',
                                  fontFamily: 'var(--font-mono)',
                                  maxHeight: '60px',
                                  overflow: 'hidden',
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                }}
                              >
                                <span
                                  style={{
                                    color: 'var(--color-muted-foreground)',
                                    fontWeight: 600,
                                  }}
                                >
                                  Value:
                                </span>{' '}
                                {v.preview}
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Right: Category Summary & Debug */}
              <div
                style={{
                  width: '320px',
                  borderLeft: '1px solid var(--color-border)',
                  overflowY: 'auto',
                  padding: '20px',
                  background: 'var(--color-card)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '20px',
                }}
              >
                {/* Category Summary */}
                <div>
                  <div
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: 'var(--color-foreground)',
                      marginBottom: '12px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    📊 Categories
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {Object.entries(groupedByCategory).map(([cat, items]) => (
                      <div
                        key={cat}
                        style={{
                          padding: '10px',
                          borderRadius: '10px',
                          background: 'var(--color-input)',
                          border: '1px solid var(--color-border)',
                          fontSize: '12px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <span>
                          {getCategoryIcon(cat)} {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </span>
                        <span
                          style={{
                            fontWeight: 700,
                            color: getCategoryColor(cat),
                            fontSize: '13px',
                          }}
                        >
                          {items.length}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Runtime Data Preview */}
                {debugData && (
                  <div>
                    <div
                      style={{
                        fontSize: '12px',
                        fontWeight: 700,
                        color: 'var(--color-foreground)',
                        marginBottom: '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      🔍 Runtime Data
                    </div>
                    <div
                      style={{
                        padding: '12px',
                        background: 'var(--color-input)',
                        borderRadius: '10px',
                        border: '1px solid var(--color-border)',
                        fontSize: '10px',
                        fontFamily: 'var(--font-mono)',
                        maxHeight: '200px',
                        overflowY: 'auto',
                        color: 'var(--color-foreground)',
                        lineHeight: 1.4,
                      }}
                    >
                      <pre
                        style={{
                          margin: 0,
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                        }}
                      >
                        {JSON.stringify(debugData, null, 2).slice(0, 600) +
                          (JSON.stringify(debugData, null, 2).length > 600 ? '\n...' : '')}
                      </pre>
                    </div>
                  </div>
                )}

                {/* Tips */}
                <div
                  style={{
                    padding: '12px',
                    background: 'rgba(102, 126, 234, 0.05)',
                    borderRadius: '10px',
                    border: '1px solid rgba(102, 126, 234, 0.2)',
                  }}
                >
                  <div
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: '#667eea',
                      marginBottom: '8px',
                    }}
                  >
                    💡 Tip
                  </div>
                  <div
                    style={{
                      fontSize: '11px',
                      color: 'var(--color-muted-foreground)',
                      lineHeight: 1.5,
                    }}
                  >
                    Use the search to find specific fields. The selected variable will be
                    automatically inserted into the field.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
