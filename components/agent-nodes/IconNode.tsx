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
          boxShadow: `
            0 0 10px 0 rgba(99, 102, 241, 0.4),
            0 0 20px 0 rgba(99, 102, 241, 0.2),
            0 0 30px 0 rgba(99, 102, 241, 0.1),
            ${colorTheme.glow}
          `,
        }
      : { boxShadow: colorTheme.glow };

    const nodeContainerClasses = clsx(
      'relative flex flex-col items-center gap-3 rounded-[28px] border border-white/70 bg-white/90 p-4 shadow-[0_20px_60px_rgba(15,23,42,0.12)] backdrop-blur-xl transition-all duration-300',
      'node-base node-interactive',
      {
        'node-selected-state ring-1 ring-white/70 shadow-[0_25px_80px_rgba(59,130,246,0.18)]':
          selected,
        'node-drag-state node-dragging': isDragging,
        'node-hover-state node-float-hover shadow-[0_25px_60px_rgba(59,130,246,0.14)]':
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
            className="absolute inset-0 rounded-[28px] blur-2xl opacity-45 pointer-events-none"
            style={{
              background: `radial-gradient(circle, ${colorTheme.highlight} 0%, transparent 70%)`,
            }}
          />
        )}

        {/* Icon container with polished gradient and soft glow */}
        <div
          className={clsx(
            'flex items-center justify-center w-16 h-16 rounded-3xl text-white shadow-xl transition-all duration-300',
            colorTheme.bg,
            {
              'scale-110': isHoveringNode || selected,
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
            'mt-2 text-sm font-semibold text-center max-w-[96px] truncate select-none text-slate-950',
            'transition-all duration-300 drop-shadow',
            {
              'scale-105': selected || isHoveringNode,
            }
          )}
          title={label}
          style={{
            textShadow: selected || isHoveringNode ? '0 2px 8px rgba(0, 0, 0, 0.12)' : 'none',
          }}
        >
          {label}
        </span>

        {/* Tool connection handles */}
        <Handle
          type="target"
          position={Position.Top}
          id="tool-target"
          className="!w-4 !h-4 !rounded-sm !bg-cyan-500 !border-2 !border-cyan-300 !shadow-lg transition-all duration-200 hover:!bg-cyan-400"
          style={{ top: -6, left: '50%', transform: 'translateX(-50%)' }}
        />

        {/* Enhanced handles with better visibility */}
        <Handle
          type="target"
          position={Position.Left}
          id="flow-target"
          className={clsx(
            '!w-3 !h-3 !left-0 !top-1/2 !-translate-y-1/2',
            colorTheme.ring,
            '!bg-white border-2 border-white',
            'transition-all duration-200',
            'hover:!w-4 hover:!h-4 hover:shadow-xl',
            'shadow-lg',
            selected ? '!ring-2 !ring-offset-2' : ''
          )}
          style={{
            boxShadow: selected
              ? `0 0 12px 0 rgba(99, 102, 241, 0.4)`
              : '0 2px 8px rgba(0, 0, 0, 0.15)',
          }}
        />
        <Handle
          type="source"
          position={Position.Right}
          id="flow-source"
          className={clsx(
            '!w-3 !h-3 !right-0 !top-1/2 !-translate-y-1/2',
            colorTheme.ring,
            '!bg-white border-2 border-white',
            'transition-all duration-200',
            'hover:!w-4 hover:!h-4 hover:shadow-xl',
            'shadow-lg',
            selected ? '!ring-2 !ring-offset-2' : ''
          )}
          style={{
            boxShadow: selected
              ? `0 0 12px 0 rgba(99, 102, 241, 0.4)`
              : '0 2px 8px rgba(0, 0, 0, 0.15)',
          }}
        />

        <Handle
          type="source"
          position={Position.Bottom}
          id="tool-source"
          className="!w-4 !h-4 !rounded-sm !bg-cyan-500 !border-2 !border-cyan-300 !shadow-lg transition-all duration-200 hover:!bg-cyan-400"
          style={{ bottom: -6, left: '50%', transform: 'translateX(-50%)' }}
        />
      </div>
    );
  }
);

IconNode.displayName = 'IconNode';
