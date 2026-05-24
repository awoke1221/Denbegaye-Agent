import { memo } from 'react';
import { NodeProps } from 'reactflow';
import { IconNode } from './IconNode';
import { getNodeIcon, getNodeTheme } from './NodeRegistry';

export const OrchestrationNode = memo((props: NodeProps) => {
  const { data = {}, selected, dragging } = props;
  const colorTheme = getNodeTheme('orchestration');
  return (
    <IconNode
      {...props}
      icon={data.icon || 'cpu'}
      colorTheme={colorTheme}
      label={data.label || 'Orchestration'}
      selected={selected}
      isDragging={dragging}
    />
  );
});
