export default function LoadingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-4 py-16 text-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-white border-t-transparent" />
        <p className="mt-4 text-base text-slate-300">Loading the app...</p>
      </div>
    </div>
  );
}
