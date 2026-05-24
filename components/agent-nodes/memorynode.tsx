import React, { memo } from 'react';
import { NodeProps } from 'reactflow';
import { IconNode } from './IconNode';
import { getNodeIcon, getNodeTheme } from './NodeRegistry';

export const MemoryNode = memo((props: NodeProps) => {
  const { data, selected } = props;

  const label = data?.label || 'Memory';
  const icon = getNodeIcon('agent-memory');
  const theme = getNodeTheme('memory');

  // Extract common config values to show in overlay
  const config = data?.config || {};
  const vectorStore = config.vectorStore || config.vector_store || 'unspecified';
  const namespace = config.namespace || config.ns || '-';
  const persist = config.persist ?? config.persistent ?? false;
  const topK = config.topK ?? config.top_k ?? config.topKForSimilarity ?? '-';
  const similarityThreshold = config.similarityThreshold ?? config.similarity_threshold ?? '-';

  // Create a small overlay content when node is selected
  const overlay = selected ? (
    <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-max min-w-[220px] max-w-xs rounded-xl border bg-white/95 p-2 text-xs shadow-lg z-30">
      <div className="flex items-center justify-between gap-2">
        <strong className="text-[0.72rem]">Store:</strong>
        <span className="truncate text-[0.72rem] text-slate-700">{vectorStore}</span>
      </div>
      <div className="flex items-center justify-between gap-2 mt-1">
        <strong className="text-[0.72rem]">Namespace:</strong>
        <span className="truncate text-[0.72rem] text-slate-700">{namespace}</span>
      </div>
      <div className="flex items-center justify-between gap-2 mt-1">
        <strong className="text-[0.72rem]">Persist:</strong>
        <span className="truncate text-[0.72rem] text-slate-700">{persist ? 'yes' : 'no'}</span>
      </div>
      <div className="flex items-center justify-between gap-2 mt-1">
        <strong className="text-[0.72rem]">Top K:</strong>
        <span className="truncate text-[0.72rem] text-slate-700">{String(topK)}</span>
      </div>
      <div className="flex items-center justify-between gap-2 mt-1">
        <strong className="text-[0.72rem]">Threshold:</strong>
        <span className="truncate text-[0.72rem] text-slate-700">
          {String(similarityThreshold)}
        </span>
      </div>
    </div>
  ) : null;

  return (
    <div className="relative">
      {overlay}
      <IconNode
        {...props}
        icon={'agent-memory'}
        colorTheme={theme}
        label={label}
        selected={selected}
      />
    </div>
  );
});

export default MemoryNode;
