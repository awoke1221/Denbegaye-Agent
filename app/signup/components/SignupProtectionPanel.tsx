'use client';

interface SignupProtectionPanelProps {
  cooldownMessage: string;
  failedAttempts: number;
  cooldownSeconds: number;
}

export function SignupProtectionPanel({
  cooldownMessage,
  failedAttempts,
  cooldownSeconds,
}: SignupProtectionPanelProps) {
  if (!cooldownMessage) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-3xl border border-amber-400/30 bg-amber-500/10 p-4 text-sm text-amber-100"
    >
      <p className="font-semibold text-amber-200">Signup protection active</p>
      <p className="mt-2 text-slate-200">{cooldownMessage}</p>
      {failedAttempts > 0 && cooldownSeconds === 0 && (
        <p className="mt-2 text-slate-400">
          If you need help, check your email and password before retrying.
        </p>
      )}
    </div>
  );
}
