import { getBezierPath, EdgeProps } from 'reactflow';

// Custom animated edge for glowing brand lines
export function BrandGlowEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}: EdgeProps) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const color = (data && data.color) || 'rgba(17, 24, 39, 0.5)';

  return (
    <g>
      <path
        id={id}
        style={{
          stroke: color,
          strokeWidth: 2.2,
          strokeLinecap: 'round',
          opacity: 0.9,
          ...style,
        }}
        className="animated-edge"
        d={edgePath}
        markerEnd={markerEnd}
      />
    </g>
  );
}
