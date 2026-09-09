'use client';

interface LoginProtectionPanelProps {
  cooldownMessage: string;
  failedAttempts: number;
  cooldownSeconds: number;
}

export function LoginProtectionPanel({
  cooldownMessage,
  failedAttempts,
  cooldownSeconds,
}: LoginProtectionPanelProps) {
  if (!cooldownMessage) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-3xl border border-amber-400/30 bg-amber-50 p-4 text-sm text-amber-900"
    >
      <p className="font-semibold text-amber-900">
        {cooldownSeconds > 0 ? 'Temporary login cooldown' : 'Login protection active'}
      </p>
      <p className="mt-2 text-amber-800">{cooldownMessage}</p>
      {failedAttempts > 0 && cooldownSeconds === 0 && (
        <p className="mt-2 text-amber-700">
          If you need help, verify your email and password before trying again.
        </p>
      )}
    </div>
  );
}
