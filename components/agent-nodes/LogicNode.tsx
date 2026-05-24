import { memo } from 'react';
import { NodeProps } from 'reactflow';
import { IconNode } from './IconNode';
import { getNodeIcon, getNodeTheme } from './NodeRegistry';

export const LogicNode = memo((props: NodeProps) => {
  const { data, selected, dragging } = props;
  const Icon = getNodeIcon('settings');
  const colorTheme = getNodeTheme('logic');
  return (
    <IconNode
      {...props}
      icon={Icon}
      colorTheme={colorTheme}
      label={data.label}
      selected={selected}
      isDragging={dragging}
    />
  );
});
