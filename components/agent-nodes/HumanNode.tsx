import { memo } from 'react';
import { NodeProps } from 'reactflow';
import { IconNode } from './IconNode';
import { getNodeIcon, getNodeTheme } from './NodeRegistry';

export const HumanNode = memo((props: NodeProps) => {
  const { data = {}, selected, dragging } = props;
  const colorTheme = getNodeTheme('human');
  return (
    <IconNode
      {...props}
      icon={data.icon || 'eye'}
      colorTheme={colorTheme}
      label={data.label || 'Human'}
      selected={selected}
      isDragging={dragging}
    />
  );
});
