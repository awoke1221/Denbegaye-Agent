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
  // Pick color based on source node type if available
  const color = (data && data.color) || '#6366f1';
  return (
    <g>
      <path
        id={id}
        style={{
          stroke: color,
          strokeWidth: 3,
          filter: 'url(#glow)',
          ...style,
        }}
        className="animated-edge"
        d={edgePath}
        markerEnd={markerEnd}
      />
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
    </g>
  );
}
