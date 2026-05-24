import { memo } from 'react';
import { NodeProps } from 'reactflow';
import { IconNode } from './IconNode';
import { getNodeIcon, getNodeTheme } from './NodeRegistry';

export const AINode = memo((props: NodeProps) => {
  const { data = {}, selected, dragging } = props;
  const colorTheme = getNodeTheme('ai');
  return (
    <IconNode
      {...props}
      icon={data.icon || (props.type as string) || 'ai'}
      colorTheme={colorTheme}
      label={data.label || 'AI'}
      selected={selected}
      isDragging={dragging}
    />
  );
});
