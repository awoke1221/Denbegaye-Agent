'use client';

import type { Dispatch, SetStateAction } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Database, RotateCcw, Save, Settings, Zap } from 'lucide-react';

interface AgentBuilderSettingsProps {
  apiKeys: {
    openai: string;
    gemini: string;
    deepseek: string;
    gmail: string;
  };
  setApiKeys: Dispatch<SetStateAction<AgentBuilderSettingsProps['apiKeys']>>;
  showNodePalette: boolean;
  setShowNodePalette: Dispatch<SetStateAction<boolean>>;
  saveApiKeys: () => void;
}

export function AgentBuilderSettings({
  apiKeys,
  setApiKeys,
  showNodePalette,
  setShowNodePalette,
  saveApiKeys,
}: AgentBuilderSettingsProps) {
  return (
    <div className="flex-1 p-8 overflow-y-auto bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 via-blue-800 to-indigo-800 dark:from-slate-100 dark:via-blue-100 dark:to-indigo-100 bg-clip-text text-transparent">
            System Settings
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Configure your agent builder preferences, API integrations, and system behavior
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="shadow-xl border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-100">
                    API Keys
                  </CardTitle>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Configure your AI service API keys
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center">
                    <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                    OpenAI API Key
                  </Label>
                  <Input
                    type="password"
                    value={apiKeys.openai}
                    onChange={e => setApiKeys({ ...apiKeys, openai: e.target.value })}
                    placeholder="sk-..."
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center">
                    <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                    Google Gemini API Key
                  </Label>
                  <Input
                    type="password"
                    value={apiKeys.gemini}
                    onChange={e => setApiKeys({ ...apiKeys, gemini: e.target.value })}
                    placeholder="AIza..."
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center">
                    <div className="w-3 h-3 rounded-full bg-purple-500 mr-2"></div>
                    DeepSeek API Key
                  </Label>
                  <Input
                    type="password"
                    value={apiKeys.deepseek}
                    onChange={e => setApiKeys({ ...apiKeys, deepseek: e.target.value })}
                    placeholder="sk-..."
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center">
                    <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                    Gmail Username
                  </Label>
                  <Input
                    type="text"
                    value={apiKeys.gmail}
                    onChange={e => setApiKeys({ ...apiKeys, gmail: e.target.value })}
                    placeholder="your-email@gmail.com"
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Keys are stored locally and encrypted
                </p>
                <Button
                  onClick={saveApiKeys}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Keys
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-xl border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
                  <Settings className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-100">
                    Builder Preferences
                  </CardTitle>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Customize your workflow building experience
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Auto-save
                    </Label>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Automatically save your work every 30 seconds
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Show node palette
                    </Label>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Display the node palette by default
                    </p>
                  </div>
                  <Switch checked={showNodePalette} onCheckedChange={setShowNodePalette} />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Real-time execution
                    </Label>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Show live execution updates
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Keyboard shortcuts
                    </Label>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Enable Ctrl+Z, Ctrl+Y, etc.
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-xl border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <Database className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-100">
                    System Information
                  </CardTitle>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Current system status and version info
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Version
                  </Label>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">v2.1.0</p>
                </div>
                <div>
                  <Label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Environment
                  </Label>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    Production
                  </p>
                </div>
                <div>
                  <Label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Backend
                  </Label>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    Connected
                  </p>
                </div>
                <div>
                  <Label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Database
                  </Label>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Healthy</p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                <Button variant="outline" className="w-full">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Check for Updates
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-xl border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-100">
                    Advanced Settings
                  </CardTitle>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Expert configuration options
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Execution Timeout (seconds)
                  </Label>
                  <Input type="number" defaultValue="300" className="mt-1" min="30" max="3600" />
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Max Concurrent Executions
                  </Label>
                  <Input type="number" defaultValue="5" className="mt-1" min="1" max="20" />
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Log Retention (days)
                  </Label>
                  <Input type="number" defaultValue="30" className="mt-1" min="1" max="365" />
                </div>
              </div>

              <div className="flex space-x-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <Button variant="outline" className="flex-1">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset to Defaults
                </Button>
                <Button className="flex-1 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white">
                  <Save className="w-4 h-4 mr-2" />
                  Save Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
