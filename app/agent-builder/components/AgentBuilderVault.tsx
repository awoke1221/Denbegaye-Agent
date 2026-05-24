'use client';

import type { Dispatch, SetStateAction } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Database, Eye, Settings, Trash2, Plus, Zap, Clock } from 'lucide-react';

interface Credential {
  id: string;
  provider: string;
  label?: string;
  is_active: boolean;
  created_at: string;
  last_used_at?: string;
}

interface CredentialForm {
  provider: string;
  label: string;
  apiKey: string;
}

interface AgentBuilderVaultProps {
  credentials: Credential[];
  credentialForm: CredentialForm;
  setCredentialForm: Dispatch<SetStateAction<CredentialForm>>;
  createCredential: () => void;
}

export function AgentBuilderVault({
  credentials,
  credentialForm,
  setCredentialForm,
  createCredential,
}: AgentBuilderVaultProps) {
  return (
    <div className="flex-1 p-8 overflow-y-auto bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 via-emerald-800 to-teal-800 dark:from-slate-100 dark:via-emerald-100 dark:to-teal-100 bg-clip-text text-transparent">
              Credentials Vault
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl">
              Securely manage your API keys, tokens, and authentication credentials with
              enterprise-grade encryption
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={() => setCredentialForm({ provider: 'openai', label: '', apiKey: '' })}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Credential
            </Button>
            <Button
              variant="outline"
              className="border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <Database className="w-5 h-5 mr-2" />
              Import/Export
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-emerald-50 to-teal-100/50 dark:from-emerald-950/50 dark:to-teal-900/30 border-emerald-200/50 dark:border-emerald-800/50 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <Database className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                    {credentials.length}
                  </p>
                  <p className="text-sm text-emerald-600 dark:text-emerald-400">
                    Active Credentials
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/50 dark:to-blue-900/30 border-blue-200/50 dark:border-blue-800/50 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                    {credentials.filter(c => c.is_active).length}
                  </p>
                  <p className="text-sm text-blue-600 dark:text-blue-400">Validated Keys</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/50 dark:to-amber-900/30 border-amber-200/50 dark:border-amber-800/50 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-900 dark:text-amber-100">
                    {
                      credentials.filter(c => {
                        const lastUsed = new Date(c.last_used_at || 0);
                        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                        return lastUsed < thirtyDaysAgo;
                      }).length
                    }
                  </p>
                  <p className="text-sm text-amber-600 dark:text-amber-400">Unused (30+ days)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 space-y-6">
            <Card className="shadow-xl border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-100">
                      Stored Credentials
                    </CardTitle>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      Manage your API keys and authentication tokens
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-slate-300 dark:border-slate-600"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Show All
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-4">
                    {credentials.map(cred => (
                      <div
                        key={cred.id}
                        className="group flex items-center justify-between p-6 border border-slate-200/60 dark:border-slate-700/60 rounded-xl hover:border-emerald-300 dark:hover:border-emerald-600 hover:shadow-lg hover:bg-gradient-to-r hover:from-emerald-50/50 hover:to-teal-50/50 dark:hover:from-emerald-950/20 dark:hover:to-teal-950/20 transition-all duration-300 backdrop-blur-sm"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="relative">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/50 dark:to-teal-900/50 flex items-center justify-center shadow-lg">
                              <Database className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div
                              className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-800 ${
                                cred.is_active ? 'bg-emerald-500' : 'bg-red-500'
                              }`}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                              {cred.label || cred.provider}
                            </h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              Provider: {cred.provider}
                            </p>
                            <div className="flex items-center space-x-4 mt-2">
                              <span className="text-xs text-slate-500 dark:text-slate-400">
                                Created: {new Date(cred.created_at).toLocaleDateString()}
                              </span>
                              {cred.last_used_at && (
                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                  Last used: {new Date(cred.last_used_at).toLocaleDateString()}
                                </span>
                              )}
                              <Badge
                                variant={cred.is_active ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {cred.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="hover:bg-blue-100 dark:hover:bg-blue-900"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="hover:bg-amber-100 dark:hover:bg-amber-900 text-amber-600 dark:text-amber-400"
                          >
                            <Settings className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="hover:bg-red-100 dark:hover:bg-red-900 text-red-600 dark:text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {credentials.length === 0 && (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                          <Database className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                          No credentials stored
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-sm mx-auto">
                          Add your first API key or authentication token to get started with secure
                          credential management.
                        </p>
                        <Button
                          onClick={() =>
                            setCredentialForm({ provider: 'openai', label: '', apiKey: '' })
                          }
                          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Your First Credential
                        </Button>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="shadow-xl border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  Add New Credential
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Provider
                  </Label>
                  <Select
                    value={credentialForm.provider}
                    onValueChange={value =>
                      setCredentialForm({ ...credentialForm, provider: value })
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="openai">OpenAI</SelectItem>
                      <SelectItem value="gemini">Google Gemini</SelectItem>
                      <SelectItem value="deepseek">DeepSeek</SelectItem>
                      <SelectItem value="anthropic">Anthropic</SelectItem>
                      <SelectItem value="groq">Groq</SelectItem>
                      <SelectItem value="gmail">Gmail</SelectItem>
                      <SelectItem value="slack">Slack</SelectItem>
                      <SelectItem value="discord">Discord</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Label (optional)
                  </Label>
                  <Input
                    value={credentialForm.label}
                    onChange={e => setCredentialForm({ ...credentialForm, label: e.target.value })}
                    placeholder="e.g. Production OpenAI Key"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    API Key / Token
                  </Label>
                  <Input
                    type="password"
                    value={credentialForm.apiKey}
                    onChange={e => setCredentialForm({ ...credentialForm, apiKey: e.target.value })}
                    placeholder="Enter your API key"
                    className="mt-1"
                  />
                </div>

                <Button
                  onClick={createCredential}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
                  disabled={!credentialForm.apiKey.trim()}
                >
                  <Database className="w-4 h-4 mr-2" />
                  Save Credential
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-xl border-0 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 backdrop-blur-xl">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold text-amber-800 dark:text-amber-200">
                      Security Best Practices
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 rounded-full bg-amber-500 mt-2"></div>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    Use environment-specific keys for different deployments
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 rounded-full bg-amber-500 mt-2"></div>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    Rotate API keys regularly for enhanced security
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 rounded-full bg-amber-500 mt-2"></div>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    Monitor credential usage and revoke unused keys
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
