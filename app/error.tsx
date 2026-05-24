'use client';

import { useEffect } from 'react';

interface ErrorProps {
  error: Error;
  reset: () => void;
}

export default function RootError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('Unhandled app error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-4 py-16 text-center">
        <h1 className="text-4xl font-semibold">Something went wrong</h1>
        <p className="mt-4 text-base text-slate-300">
          An unexpected error occurred while rendering the app. Please refresh the page or try
          again.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="mt-8 rounded-md bg-white px-5 py-3 text-slate-950 shadow-lg shadow-slate-900/20"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
