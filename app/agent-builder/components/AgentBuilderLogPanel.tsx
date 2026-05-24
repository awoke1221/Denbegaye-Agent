'use client';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, ChevronDown, ChevronUp, FileText } from 'lucide-react';

interface AgentBuilderLogPanelProps {
  showLogPanel: boolean;
  setShowLogPanel: React.Dispatch<React.SetStateAction<boolean>>;
  log: string[];
}

export function AgentBuilderLogPanel({
  showLogPanel,
  setShowLogPanel,
  log,
}: AgentBuilderLogPanelProps) {
  return (
    <div className="border-t border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50">
      <div className="p-4">
        <Button
          variant="ghost"
          onClick={() => setShowLogPanel(!showLogPanel)}
          className="w-full justify-between text-left font-medium"
        >
          <span className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Execution Logs ({log.length})
          </span>
          {showLogPanel ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>
        {showLogPanel && (
          <ScrollArea className="h-48 mt-2">
            <div className="space-y-1 text-sm">
              {log.length === 0 ? (
                <p className="text-slate-500 dark:text-slate-400 italic">No logs yet...</p>
              ) : (
                log.map((entry, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2 p-2 rounded bg-slate-50 dark:bg-slate-800/50"
                  >
                    <Clock className="w-3 h-3 mt-0.5 text-slate-400 flex-shrink-0" />
                    <span className="text-slate-700 dark:text-slate-300">{entry}</span>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
