import { useState } from 'react';
import { LayoutDashboard } from 'lucide-react';

export function GroupNode({ id, data, selected }: any) {
  const [collapsed, setCollapsed] = useState(data.collapsed || false);
  return (
    <div
      style={{
        border: selected
          ? '2px solid rgba(245, 158, 66, 0.95)'
          : '1.5px solid rgba(251, 191, 36, 0.9)',
        background: collapsed
          ? 'linear-gradient(135deg, rgba(254, 243, 199, 0.98), rgba(255, 250, 235, 0.92))'
          : 'linear-gradient(135deg, rgba(255, 247, 237, 0.92), rgba(255, 234, 213, 0.98))',
        borderRadius: 20,
        minWidth: 220,
        minHeight: 70,
        position: 'relative',
        boxShadow: selected
          ? '0 20px 60px rgba(251, 191, 36, 0.18)'
          : '0 12px 32px rgba(15, 23, 42, 0.08)',
        padding: 14,
        opacity: collapsed ? 0.75 : 1,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <LayoutDashboard style={{ color: '#ca8a04', width: 22, height: 22 }} />
        <span style={{ fontWeight: 700, color: '#92400e' }}>{data.label || 'Group'}</span>
        <button
          style={{
            marginLeft: 'auto',
            background: 'rgba(255,255,255,0.85)',
            border: '1px solid rgba(245, 158, 66, 0.35)',
            borderRadius: 999,
            padding: '6px 12px',
            cursor: 'pointer',
            color: '#92400e',
            fontWeight: 600,
          }}
          onClick={e => {
            e.stopPropagation();
            data.onToggleCollapse?.(id);
          }}
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? '+' : '–'}
        </button>
      </div>
      {!collapsed && (
        <div style={{ fontSize: 12, color: '#92400e', marginTop: 6, lineHeight: 1.5 }}>
          {data.description || 'Drag nodes here to group'}
        </div>
      )}
    </div>
  );
}
