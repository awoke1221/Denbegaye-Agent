import { memo } from 'react';
import { NodeProps } from 'reactflow';
import { IconNode } from './IconNode';
import { getNodeIcon, getNodeTheme } from './NodeRegistry';

export const ToolNode = memo((props: NodeProps) => {
  const { data = {}, selected, dragging } = props;
  const colorTheme = getNodeTheme('tool');
  return (
    <IconNode
      {...props}
      icon={data.icon || data.tool || (props.type as string) || 'tool'}
      colorTheme={colorTheme}
      label={data.label || 'Tool'}
      selected={selected}
      isDragging={dragging}
    />
  );
});
