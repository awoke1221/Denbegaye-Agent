import React from 'react';
import {
  Mail,
  Send,
  Database,
  Webhook,
  Smartphone,
  Globe,
  Youtube,
  Facebook,
  Linkedin,
  Zap,
  Cpu,
  Settings,
  RotateCcw,
  Eye,
  Brain,
  Sparkles,
  MessageSquare,
  Calendar,
  Clock,
  FileText,
  Search,
  LucideProps,
} from 'lucide-react';

const OpenAIIcon: React.FC<LucideProps> = props => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <circle cx="12" cy="12" r="5.5" />
    <path d="M12 6.5v11" />
    <path d="M6.5 12h11" />
    <path d="M8.75 8.75l6.5 6.5" />
    <path d="M15.25 8.75l-6.5 6.5" />
  </svg>
);

const AnthropicIcon: React.FC<LucideProps> = props => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M4 19c0-7.18 5.82-13 13-13" />
    <path d="M7.5 6.5a9.52 9.52 0 0 1 9.5 9.5" />
    <path d="M12 8.5v7" />
    <path d="M9 13h6" />
  </svg>
);

const GroqIcon: React.FC<LucideProps> = props => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M6 6h6v6H6z" />
    <path d="M12 12h6v6h-6z" />
    <path d="M6 18h6" />
    <path d="M18 6v6" />
  </svg>
);

export const iconRegistry: Record<string, React.ComponentType<LucideProps>> = {
  openai: OpenAIIcon,
  anthropic: AnthropicIcon,
  groq: GroqIcon,
  grok: GroqIcon,
  gemini: Sparkles,
  deepseek: Brain,
  brain: Brain,
  telegram: MessageSquare,
  whatsapp: MessageSquare,
  email: Mail,
  send: Send,
  database: Database,
  webhook: Webhook,
  smartphone: Smartphone,
  globe: Globe,
  youtube: Youtube,
  facebook: Facebook,
  linkedin: Linkedin,
  ai: Brain,
  cpu: Cpu,
  clock: Clock,
  settings: Settings,
  loop: RotateCcw,
  eye: Eye,
  calendar: Calendar,
  gcalendar: Calendar,
  docs: FileText,
  sheets: FileText,
  gmail: Mail,
  search: Search,
  // ...add more as needed
};

export function getNodeIcon(type: string) {
  return iconRegistry[type] || Settings;
}
