import React, { memo, useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import clsx from 'clsx';
import { getNodeIcon } from './NodeRegistry';
import { Settings } from 'lucide-react';

export type IconNodeProps = NodeProps & {
  icon: string | React.ComponentType<any>;
  colorTheme: {
    bg: string;
    ring: string;
    icon: string;
    glow: string;
    highlight: string;
    pulse?: string;
  };
  label: string;
  selected?: boolean;
  isWebhook?: boolean;
  isDragging?: boolean;
  onClick?: () => void;
};

// Helper function to render icons consistently
const renderIcon = (icon: any, className: string = '') => {
  const iconWrapperClass = clsx('flex items-center justify-center w-full h-full', className);

  if (typeof icon === 'function') {
    const IconComponent = icon;
    return <IconComponent className={iconWrapperClass} />;
  } else if (typeof icon === 'string' && icon.startsWith('<svg')) {
    return <div className={iconWrapperClass} dangerouslySetInnerHTML={{ __html: icon }} />;
  } else if (typeof icon === 'string') {
    // It's a Lucide icon name
    const IconComponent = getNodeIcon(icon);
    return <IconComponent className={iconWrapperClass} />;
  } else {
    // Fallback
    return <Settings className={iconWrapperClass} />;
  }
};

export const IconNode = memo(
  ({ data, selected, isDragging, icon, colorTheme, label, isWebhook, ...rest }: IconNodeProps) => {
    const [isClickAnimating, setIsClickAnimating] = useState(false);
    const [isHoveringNode, setIsHoveringNode] = useState(false);

    // Handle click with ripple animation
    const handleNodeClick = (e: React.MouseEvent) => {
      setIsClickAnimating(true);
      setTimeout(() => setIsClickAnimating(false), 400);
      rest.onClick?.();
    };

    // Advanced animation classes with multiple layers
    const nodeShadowStyle = selected
      ? {
          boxShadow: `0 0 0 1px rgba(17, 24, 39, 0.08), 0 10px 22px rgba(15, 23, 42, 0.05)`,
        }
      : { boxShadow: colorTheme.glow };

    const nodeContainerClasses = clsx(
      'relative flex flex-col items-center gap-3 rounded-[18px] border border-[var(--border-default)] bg-[rgba(255,255,255,0.72)] p-3 shadow-[0_10px_22px_rgba(15,23,42,0.04)] backdrop-blur-sm transition-all duration-200',
      'node-base node-interactive',
      {
        'node-selected-state ring-1 ring-[rgba(17,24,39,0.12)] shadow-[0_12px_24px_rgba(15,23,42,0.06)]':
          selected,
        'node-drag-state node-dragging': isDragging,
        'node-hover-state node-float-hover shadow-[0_12px_24px_rgba(15,23,42,0.05)]':
          isHoveringNode && !isDragging,
        'node-click-pulse': isClickAnimating,
      }
    );

    return (
      <div
        className={nodeContainerClasses}
        tabIndex={0}
        aria-label={label}
        onClick={handleNodeClick}
        onMouseEnter={() => setIsHoveringNode(true)}
        onMouseLeave={() => setIsHoveringNode(false)}
        style={{ outline: 'none' }}
      >
        {/* Background aura layer (only visible on selection) */}
        {selected && (
          <div
            className="absolute inset-0 rounded-[18px] blur-md opacity-20 pointer-events-none"
            style={{
              background: `radial-gradient(circle, ${colorTheme.highlight} 0%, transparent 78%)`,
            }}
          />
        )}

        {/* Icon container with polished neutral block styling */}
        <div
          className={clsx(
            'flex items-center justify-center w-11 h-11 rounded-xl border border-[rgba(17,24,39,0.08)] bg-[var(--bg-subtle)] text-[var(--text-primary)] shadow-[inset_0_1px_0_rgba(255,255,255,0.66)] transition-all duration-200',
            colorTheme.bg,
            {
              'scale-[1.03]': isHoveringNode || selected,
            }
          )}
          style={nodeShadowStyle}
        >
          {(() => {
            const ProcessedIcon = getNodeIcon(icon);
            return <ProcessedIcon className={clsx('w-8 h-8', colorTheme.icon)} />;
          })()}
        </div>

        {/* Status indicator badge */}
        {data?.config?.isConfigured !== undefined && (
          <span
            className={clsx(
              'absolute top-2 right-2 block h-3 w-3 rounded-full ring-2 ring-white',
              'transition-all duration-300 shadow-lg',
              data.config.isConfigured
                ? 'bg-emerald-400 animate-pulse'
                : 'bg-rose-400 animate-bounce'
            )}
            style={{
              boxShadow: data.config.isConfigured
                ? '0 0 8px 0 rgba(52, 211, 153, 0.4)'
                : '0 0 8px 0 rgba(248, 113, 113, 0.4)',
            }}
          />
        )}

        {/* Execution state indicator */}
        {data?.executionState && (
          <div className="absolute -top-1 -right-1 flex items-center justify-center">
            <div
              className={clsx(
                'w-5 h-5 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-xs font-bold',
                {
                  'bg-yellow-400 text-yellow-900 animate-pulse': data.executionState === 'pending',
                  'bg-blue-500 text-white animate-spin': data.executionState === 'executing',
                  'bg-green-500 text-white': data.executionState === 'completed',
                  'bg-red-500 text-white': data.executionState === 'failed',
                }
              )}
              title={
                data.executionState === 'failed' && data.executionError
                  ? data.executionError
                  : undefined
              }
            >
              {data.executionState === 'pending' && '⏳'}
              {data.executionState === 'executing' && '⚡'}
              {data.executionState === 'completed' && '✓'}
              {data.executionState === 'failed' && '✗'}
            </div>
          </div>
        )}

        {data?.executionState === 'failed' && data.executionError && (
          <div
            className="mt-2 rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-[0.68rem] font-medium leading-tight text-red-700"
            title={data.executionError}
          >
            {data.executionError.length > 60
              ? `${data.executionError.slice(0, 60)}...`
              : data.executionError}
          </div>
        )}

        {/* Enhanced label with dynamic styling */}
        <span
          className={clsx(
            'mt-1 text-[11px] font-medium tracking-[0.12em] text-center uppercase max-w-[96px] truncate select-none text-[var(--text-primary)]',
            'transition-all duration-200',
            {
              'scale-[1.02]': selected || isHoveringNode,
            }
          )}
          title={label}
        >
          {label}
        </span>

        {/* Tool connection handles */}
        <Handle
          type="target"
          position={Position.Top}
          id="tool-target"
          className="!w-3 !h-3 !rounded-full !bg-[var(--bg-surface)] !border !border-[rgba(17,24,39,0.32)] transition-all duration-200"
          style={{ top: -5, left: '50%', transform: 'translateX(-50%)' }}
        />

        {/* Enhanced handles with better visibility */}
        <Handle
          type="target"
          position={Position.Left}
          id="flow-target"
          className={clsx(
            '!w-2.5 !h-2.5 !left-0 !top-1/2 !-translate-y-1/2',
            '!bg-[var(--bg-surface)] border border-[rgba(17,24,39,0.28)]',
            'transition-all duration-200',
            'hover:!w-3 hover:!h-3',
            selected ? 'shadow-[0_0_0_2px_rgba(17,24,39,0.05)]' : ''
          )}
          style={{
            boxShadow: selected ? '0 0 0 2px rgba(17, 24, 39, 0.05)' : 'none',
          }}
        />
        <Handle
          type="source"
          position={Position.Right}
          id="flow-source"
          className={clsx(
            '!w-2.5 !h-2.5 !right-0 !top-1/2 !-translate-y-1/2',
            '!bg-[var(--bg-surface)] border border-[rgba(17,24,39,0.28)]',
            'transition-all duration-200',
            'hover:!w-3 hover:!h-3',
            selected ? 'shadow-[0_0_0_2px_rgba(17,24,39,0.05)]' : ''
          )}
          style={{
            boxShadow: selected ? '0 0 0 2px rgba(17, 24, 39, 0.05)' : 'none',
          }}
        />

        <Handle
          type="source"
          position={Position.Bottom}
          id="tool-source"
          className="!w-3 !h-3 !rounded-full !bg-[var(--bg-surface)] !border !border-[rgba(17,24,39,0.32)] transition-all duration-200"
          style={{ bottom: -5, left: '50%', transform: 'translateX(-50%)' }}
        />
      </div>
    );
  }
);

IconNode.displayName = 'IconNode';
