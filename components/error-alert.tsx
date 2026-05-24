interface ErrorAlertProps {
  message: string
}

export function ErrorAlert({ message }: ErrorAlertProps) {
  return (
    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
      <span className="text-red-500 text-xl flex-shrink-0">⚠️</span>
      <div>
        <h3 className="font-semibold text-red-500 mb-1">Error</h3>
        <p className="text-sm text-red-500/80">{message}</p>
      </div>
    </div>
  )
}
