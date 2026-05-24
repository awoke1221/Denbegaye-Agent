import { getNodeIcon } from "./IconRegistry";

export function DragPreviewNode({
  icon,
  color,
  bg,
  label,
}: {
  icon: any;
  color: string;
  bg: string;
  label: string;
}) {
  const Icon = icon;
  return (
    <div
      className={`rounded-xl shadow-2xl ${bg} border-2 border-white p-0.5 min-w-[120px] flex items-center gap-3 animate-dragPreview`}
      style={{ opacity: 0.95 }}
    >
      <span
        className={`flex items-center justify-center rounded-full bg-white shadow-lg w-10 h-10 border-2 border-white`}
      >
        <Icon className="w-6 h-6" style={{ color }} />
      </span>
      <span className="font-semibold text-base text-gray-800 drop-shadow-lg">
        {label}
      </span>
    </div>
  );
}

// Add this animation to your global CSS:
// @keyframes dragPreview { 0% { transform: scale(0.9) rotate(-2deg); } 100% { transform: scale(1.05) rotate(2deg); } }
// .animate-dragPreview { animation: dragPreview 0.3s cubic-bezier(.4,2,.6,1) alternate infinite; }
