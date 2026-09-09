import React from 'react';
import clsx from 'clsx';
import {
  Activity,
  Brain,
  Clock,
  Cloud,
  CreditCard,
  DollarSign,
  Eye,
  FileText,
  Globe,
  Image,
  Layers,
  Lightbulb,
  Map,
  MessageSquare,
  Phone,
  Repeat,
  RotateCcw,
  Search,
  Settings,
  Smile,
  Sparkles,
  TrendingUp,
  Users,
  Wrench,
  Zap,
  Cpu,
  Database,
  Mail,
  Webhook,
  Youtube,
  Facebook,
  Linkedin,
  Calendar,
  LucideProps,
} from 'lucide-react';

// Custom icon props interface
interface CustomIconProps {
  className?: string;
  style?: React.CSSProperties;
}

// Custom Google/Gemini icons
const GeminiIcon = ({ className, style }: CustomIconProps) => (
  <div
    className={clsx(
      'rounded-full bg-gradient-to-r from-blue-500 to-green-500 flex items-center justify-center w-12 h-12',
      className
    )}
    style={style}
  >
    <span className="text-white text-2xl font-bold">G</span>
  </div>
);

const GmailIcon = ({ className, style }: CustomIconProps) => (
  <div
    className={clsx(
      'rounded-full bg-red-500 flex items-center justify-center w-12 h-12',
      className
    )}
    style={style}
  >
    <Mail className="w-8 h-8 text-white" />
  </div>
);

const BRAND_ICON_URIS: Record<string, string> = {
  gemini: `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path fill='%234285f4' d='M12 24A14.304 14.304 0 0 0 0 12 14.304 14.304 0 0 0 12 0a14.304 14.304 0 0 0 12 12 14.304 14.304 0 0 0-12 12'/></svg>`,
  drive: `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path fill='%230F9D58' d='M8.267 14.68H0l3.498 6.09h8.444z'/><path fill='%23FBBC04' d='M14.982 14.68l-3.498 6.09L7.986 14.68 11.484 8.59z'/><path fill='%234285F4' d='M22.53 14.68H14.09l-3.106-5.388L14.48 2.23z'/></svg>`,
  sheets: `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path fill='%2334A853' d='M11.318 0H3.27A1.27 1.27 0 0 0 2 1.274v21.452A1.27 1.27 0 0 0 3.274 24h17.452A1.27 1.27 0 0 0 22 22.726V10.682L11.318 0z'/><path fill='%23188038' d='M22 10.682h-9.456A1.27 1.27 0 0 1 11.27 9.41L11.318 0 22 10.682z'/><path fill='%23fff' d='M7 14h10v1.5H7zm0 3h10v1.5H7zm0-6h4.5V12.5H7z'/></svg>`,
  gcalendar: `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path fill='%23188038' d='M0 0h24v24H0z' opacity='0'/><path fill='%234285F4' d='M16 2H8C4.686 2 2 4.686 2 8v8c0 3.314 2.686 6 6 6h8c3.314 0 6-2.686 6-6V8c0-3.314-2.686-6-6-6z'/><path fill='white' d='M8 6h8v2H8zm0 4h5v2H8zm0 4h8v2H8z'/></svg>`,
  gmail: `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path fill='%23EA4335' d='M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0z'/><path fill='%23fff' d='M5.4 7.8l6.6 4.6 6.6-4.6v8.4a1 1 0 0 1-1 1H6.4a1 1 0 0 1-1-1V7.8zm6.6 3.2L5.4 8.6l1.1-1.4 5.5 3.7 5.5-3.7 1.1 1.4-6.6 2.4z'/></svg>`,
  facebook: `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path fill='%231877F2' d='M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z'/></svg>`,
  linkedin: `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path fill='%230A66C2' d='M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z'/></svg>`,
  youtube: `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path fill='%23FF0000' d='M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z'/></svg>`,
  whatsapp: `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path fill='%2325D366' d='M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z'/></svg>`,
  telegram: `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path fill='%2326A5E4' d='M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z'/></svg>`,
  slack: `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><rect x='6' y='3' width='4' height='8' rx='2' fill='%2336C5F0'/><rect x='14' y='13' width='4' height='8' rx='2' fill='%2336C5F0'/><rect x='3' y='6' width='8' height='4' rx='2' fill='%23ECB22E'/><rect x='13' y='14' width='8' height='4' rx='2' fill='%23ECB22E'/><rect x='3' y='14' width='8' height='4' rx='2' fill='%232EB67D'/><rect x='13' y='3' width='8' height='4' rx='2' fill='%232EB67D'/><rect x='6' y='14' width='4' height='8' rx='2' fill='%23E01E5A'/></svg>`,
  sendgrid: `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><rect width='24' height='24' fill='%230093CF'/><path d='M4 8l8 5 8-5v8H4V8z' fill='%23fff'/><path d='M4 8l8 5 4-2.5V8H4z' fill='%2382C9FF'/></svg>`,
  javascript: `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><rect width='24' height='24' fill='%23f7df1e'/><path d='M7.4 16.6l1.1-.7c.2.5.5 1 .9 1 .5 0 .9-.2.9-.9V9.7h2.1v5.2c0 2.1-1.2 3.1-3.1 3.1-1.7 0-2.7-.8-3.1-2.1m8.7-.5l1.1-.7c.2.5.5.9.9.9.5 0 .9-.4.9-.9 0-.7-.5-.9-1.1-1.2l-.4-.1c-.8-.3-1.4-.6-1.4-1.6 0-1.5 1.1-2.1 2.4-2.1 1 0 1.7.3 2.1 1.2l-1.2.7c-.2-.5-.5-.7-.9-.7-.4 0-.7.2-.7.7 0 .4.2.6.7.8l.3.1c.8.3 1.3.6 1.3 1.6 0 1.1-.9 1.7-2.1 1.7-1.2 0-2-.6-2.4-1.4' fill='%23000'/></svg>`,
  python: `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><rect width='24' height='24' rx='4' fill='%233776AB'/><path d='M7 3h10v3H8.5C6.6 6 5 7.6 5 9.5V11H3V9.5C3 6.5 5.5 4 8.5 4H7z' fill='%23FFE052'/><circle cx='7' cy='6' r='1' fill='%23fff'/><path d='M17 21H7V18h8.5c1.9 0 3.5-1.6 3.5-3.5V13h2v1.5C21 18.5 18.5 21 15.5 21H17z' fill='%23FFE052'/><circle cx='17' cy='18' r='1' fill='%23fff'/></svg>`,
  openai: `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><rect width='24' height='24' fill='%23000000'/><path d='M8 6h8v2H10v4h6v2h-6v4h8v2H8V6z' fill='%23ffffff'/></svg>`,
  anthropic: `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><rect width='24' height='24' fill='%23f59e0b'/><path d='M6 6h12v12H6z' fill='%23ffffff'/><path d='M9 9h6v6H9z' fill='%23f59e0b'/></svg>`,
  grok: `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><rect width='24' height='24' fill='%232a9d8f'/><path d='M6 6h5v5H6zM13 6h5v5h-5zM6 13h5v5H6zM13 13h5v5h-5z' fill='%23ffffff'/></svg>`,
  deepseek: `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><rect width='24' height='24' fill='%23ef4444'/><circle cx='12' cy='12' r='7' fill='%23ffffff'/><circle cx='12' cy='12' r='4' fill='%23ef4444'/></svg>`,

  // Advanced Agent Brand Icons
  'agent-looping': `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><defs><linearGradient id='loopGrad' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' style='stop-color:%238b4513;stop-opacity:1' /><stop offset='100%' style='stop-color:%23d2691e;stop-opacity:1' /></linearGradient></defs><circle cx='12' cy='12' r='10' fill='url(%23loopGrad)' opacity='0.15'/><path d='M12 3 A9 9 0 0 1 20.78 6.22' stroke='%238b4513' stroke-width='2.5' fill='none' stroke-linecap='round'/><path d='M20.78 6.22 L18.36 8.64 L19.5 4.5 Z' fill='%238b4513'/><circle cx='12' cy='12' r='3' fill='%238b4513' opacity='0.8'/><circle cx='12' cy='12' r='8' fill='none' stroke='%238b4513' stroke-width='1.5' stroke-dasharray='2,2' opacity='0.6'/></svg>`,

  'agent-react': `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><defs><linearGradient id='reactGrad' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' style='stop-color:%239333ea;stop-opacity:1' /><stop offset='100%' style='stop-color:%23c084fc;stop-opacity:1' /></linearGradient></defs><circle cx='12' cy='12' r='10' fill='url(%23reactGrad)' opacity='0.15'/><path d='M8 12 L12 16 L16 12' stroke='%239333ea' stroke-width='2.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/><circle cx='12' cy='6' r='1.5' fill='%239333ea'/><path d='M12 7.5 L12 11.5' stroke='%239333ea' stroke-width='1.5' stroke-dasharray='1,1'/><circle cx='6' cy='14' r='1' fill='%239333ea' opacity='0.6'/><circle cx='18' cy='14' r='1' fill='%239333ea' opacity='0.6'/></svg>`,

  'agent-reasoning': `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><defs><linearGradient id='reasonGrad' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' style='stop-color:%2322c55e;stop-opacity:1' /><stop offset='100%' style='stop-color:%2386efac;stop-opacity:1' /></linearGradient></defs><circle cx='12' cy='12' r='10' fill='url(%23reasonGrad)' opacity='0.15'/><path d='M12 6 L15 10 L14 14 L12 12 L10 14 L9 10 Z' fill='%2322c55e' opacity='0.8'/><circle cx='6' cy='14' r='1.5' fill='%2322c55e'/><circle cx='18' cy='14' r='1.5' fill='%2322c55e'/><line x1='8' y1='13' x2='10' y2='12' stroke='%2322c55e' stroke-width='1' stroke-dasharray='1,1'/><line x1='16' y1='12' x2='14' y2='13' stroke='%2322c55e' stroke-width='1' stroke-dasharray='1,1'/></svg>`,

  'agent-planning': `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><defs><linearGradient id='planGrad' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' style='stop-color:%233b82f6;stop-opacity:1' /><stop offset='100%' style='stop-color:%2393c5fd;stop-opacity:1' /></linearGradient></defs><circle cx='12' cy='12' r='10' fill='url(%23planGrad)' opacity='0.15'/><rect x='5' y='6' width='14' height='12' rx='1' fill='none' stroke='%233b82f6' stroke-width='1.5'/><line x1='5' y1='9' x2='19' y2='9' stroke='%233b82f6' stroke-width='1.5'/><line x1='5' y1='12' x2='19' y2='12' stroke='%233b82f6' stroke-width='1.5'/><line x1='5' y1='15' x2='19' y2='15' stroke='%233b82f6' stroke-width='1.5'/><circle cx='7' cy='7.5' r='0.8' fill='%233b82f6'/></svg>`,

  'agent-multi': `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><defs><linearGradient id='multiGrad' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' style='stop-color:%23ec4899;stop-opacity:1' /><stop offset='100%' style='stop-color:%23f472b6;stop-opacity:1' /></linearGradient></defs><circle cx='12' cy='12' r='10' fill='url(%23multiGrad)' opacity='0.15'/><circle cx='12' cy='9' r='2' fill='%23ec4899'/><circle cx='7' cy='14' r='1.8' fill='%23ec4899' opacity='0.8'/><circle cx='17' cy='14' r='1.8' fill='%23ec4899' opacity='0.8'/><line x1='12' y1='10.8' x2='7.6' y2='12.8' stroke='%23ec4899' stroke-width='1' opacity='0.6'/><line x1='12' y1='10.8' x2='16.4' y2='12.8' stroke='%23ec4899' stroke-width='1' opacity='0.6'/><line x1='8' y1='15' x2='16' y2='15' stroke='%23ec4899' stroke-width='0.8' stroke-dasharray='2,2' opacity='0.5'/></svg>`,

  'agent-tool-using': `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><defs><linearGradient id='toolGrad' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' style='stop-color:%23f56565;stop-opacity:1' /><stop offset='100%' style='stop-color:%23fc8181;stop-opacity:1' /></linearGradient></defs><circle cx='12' cy='12' r='10' fill='url(%23toolGrad)' opacity='0.15'/><path d='M7.5 11 L9 12.5 L8.5 14 C8.3 14.6 8.8 15.1 9.4 14.9 L11 14' stroke='%23f56565' stroke-width='1.5' fill='none' stroke-linecap='round'/><circle cx='14.5' cy='8.5' r='1.2' fill='%23f56565' opacity='0.7'/><path d='M11.5 11.5 L14 9' stroke='%23f56565' stroke-width='1' stroke-dasharray='2,2' opacity='0.6'/><rect x='6' y='15' width='2' height='3' fill='%23f56565' opacity='0.6'/><rect x='9' y='14' width='1.5' height='4' fill='%23f56565' opacity='0.6'/></svg>`,

  'agent-memory': `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><defs><linearGradient id='memGrad' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' style='stop-color:%23fb923c;stop-opacity:1' /><stop offset='100%' style='stop-color:%23fed7aa;stop-opacity:1' /></linearGradient></defs><circle cx='12' cy='12' r='10' fill='url(%23memGrad)' opacity='0.15'/><rect x='7' y='5' width='10' height='3' rx='0.5' fill='none' stroke='%23fb923c' stroke-width='1.5'/><rect x='7' y='9' width='10' height='3' rx='0.5' fill='none' stroke='%23fb923c' stroke-width='1.5'/><rect x='7' y='13' width='10' height='3' rx='0.5' fill='none' stroke='%23fb923c' stroke-width='1.5'/><circle cx='9' cy='6.5' r='0.6' fill='%23fb923c'/><circle cx='9' cy='10.5' r='0.6' fill='%23fb923c' opacity='0.7'/><circle cx='9' cy='14.5' r='0.6' fill='%23fb923c' opacity='0.5'/></svg>`,
};

const createBrandIcon = (src: string, alt: string) => {
  return (props: LucideProps) => (
    <div
      className={clsx('flex items-center justify-center w-full h-full', props.className)}
      style={props.style}
    >
      <img src={src} alt={alt} className="w-full h-full object-contain" />
    </div>
  );
};

export const iconRegistry: Record<string, React.ComponentType<LucideProps>> = {
  gemini: createBrandIcon(BRAND_ICON_URIS.gemini, 'Gemini'),
  drive: createBrandIcon(BRAND_ICON_URIS.drive, 'Drive'),
  sheets: createBrandIcon(BRAND_ICON_URIS.sheets, 'Sheets'),
  gcalendar: createBrandIcon(BRAND_ICON_URIS.gcalendar, 'Google Calendar'),
  gmail: createBrandIcon(BRAND_ICON_URIS.gmail, 'Gmail'),
  facebook: createBrandIcon(BRAND_ICON_URIS.facebook, 'Facebook'),
  linkedin: createBrandIcon(BRAND_ICON_URIS.linkedin, 'LinkedIn'),
  youtube: createBrandIcon(BRAND_ICON_URIS.youtube, 'YouTube'),
  whatsapp: createBrandIcon(BRAND_ICON_URIS.whatsapp, 'WhatsApp'),
  telegram: createBrandIcon(BRAND_ICON_URIS.telegram, 'Telegram'),
  slack: createBrandIcon(BRAND_ICON_URIS.slack, 'Slack'),
  sendgrid: createBrandIcon(BRAND_ICON_URIS.sendgrid, 'SendGrid'),
  javascript: createBrandIcon(BRAND_ICON_URIS.javascript, 'JavaScript'),
  python: createBrandIcon(BRAND_ICON_URIS.python, 'Python'),
  openai: createBrandIcon(BRAND_ICON_URIS.openai, 'OpenAI'),
  anthropic: createBrandIcon(BRAND_ICON_URIS.anthropic, 'Anthropic'),
  grok: createBrandIcon(BRAND_ICON_URIS.grok, 'Grok'),
  deepseek: createBrandIcon(BRAND_ICON_URIS.deepseek, 'DeepSeek'),
  brain: Brain,
  email: Mail,
  webhook: Webhook,
  globe: Globe,
  message: MessageSquare,
  calendar: Calendar,
  settings: Settings,
  eye: Eye,
  wrench: Wrench,
  cloud: Cloud,
  phone: Phone,
  'credit-card': CreditCard,
  'trending-up': TrendingUp,
  'dollar-sign': DollarSign,
  smile: Smile,
  image: Image,
  cpu: Cpu,
  database: Database,
  clock: Clock,
  zap: Zap,
  layers: Layers,
  'rotate-ccw': RotateCcw,
  'file-text': FileText,
  search: Search,
  schedule: Clock,
  http: Globe,
  if: Zap,
  switch: Layers,
  loop: RotateCcw,
  wait: Clock,
  mail: Mail,
  activity: Activity,
  repeat: Repeat,
  lightbulb: Lightbulb,
  map: Map,
  users: Users,
};

const NODE_TYPE_ICON_ALIASES: Record<string, string> = {
  'calendar-google': 'gcalendar',
  'data-google-sheets': 'sheets',
  'data-gmail': 'gmail',
  'trigger-gmail': 'gmail',
  'trigger-slack-event': 'slack',
  'action-slack': 'slack',
  'action-sendgrid': 'sendgrid',
  'core-code-js': 'javascript',
  'core-code-python': 'python',
  'trigger-calendar-event': 'calendar',
};

const resolveIconKey = (type: string): string => {
  const normalizedType = type.toLowerCase().trim();
  if (iconRegistry[normalizedType]) {
    return normalizedType;
  }

  if (NODE_TYPE_ICON_ALIASES[normalizedType]) {
    return NODE_TYPE_ICON_ALIASES[normalizedType];
  }

  if (normalizedType.includes('-')) {
    const fallback = normalizedType.split('-').slice(-1)[0];
    if (iconRegistry[fallback]) {
      return fallback;
    }
  }

  return normalizedType;
};

export function getNodeIcon(type: string | React.ComponentType<any>) {
  if (typeof type === 'string') {
    if (type.startsWith('<svg')) {
      // It's an SVG string, return a component that renders it with proper centering and scaling
      return (props: LucideProps) => (
        <div
          className={clsx('flex items-center justify-center w-full h-full', props.className)}
          style={props.style}
        >
          <div
            className="w-12 h-12 flex items-center justify-center"
            dangerouslySetInnerHTML={{ __html: type }}
          />
        </div>
      );
    } else {
      // Resolve node-type and provider aliases before looking up the icon registry
      const iconKey = resolveIconKey(type);
      const IconComponent = iconRegistry[iconKey];
      if (IconComponent) {
        return IconComponent;
      } else {
        return (props: LucideProps) => (
          <div
            className={clsx('flex items-center justify-center w-full h-full', props.className)}
            style={props.style}
          >
            <Settings className="w-12 h-12" />
          </div>
        );
      }
    }
  } else {
    const ComponentType = type;
    return (props: LucideProps) => (
      <div
        className={clsx('flex items-center justify-center w-full h-full', props.className)}
        style={props.style}
      >
        <ComponentType className="w-12 h-12" />
      </div>
    );
  }
}

export type NodeTypeKey =
  | 'ai'
  | 'tool'
  | 'webhook'
  | 'logic'
  | 'memory'
  | 'orchestration'
  | 'human'
  | 'action'
  | 'input'
  | 'denbegaye-agent'
  | string;

export type NodeTheme = {
  bg: string;
  ring: string;
  icon: string;
  glow: string;
  highlight: string;
  pulse?: string;
};

export const nodeThemeRegistry: Record<NodeTypeKey, NodeTheme> = {
  ai: {
    bg: 'bg-[rgba(17,24,39,0.06)]',
    ring: 'ring-[rgba(17,24,39,0.2)]',
    icon: 'text-[var(--text-primary)]',
    glow: '0 10px 22px 0 rgba(15,23,42,0.06)',
    highlight: 'rgba(17,24,39,0.08)',
  },
  tool: {
    bg: 'bg-[rgba(17,24,39,0.06)]',
    ring: 'ring-[rgba(17,24,39,0.2)]',
    icon: 'text-[var(--text-primary)]',
    glow: '0 10px 22px 0 rgba(15,23,42,0.06)',
    highlight: 'rgba(17,24,39,0.08)',
  },
  webhook: {
    bg: 'bg-[rgba(17,24,39,0.06)]',
    ring: 'ring-[rgba(17,24,39,0.2)]',
    icon: 'text-[var(--text-primary)]',
    glow: '0 10px 22px 0 rgba(15,23,42,0.06)',
    highlight: 'rgba(17,24,39,0.08)',
    pulse: 'animate-pulse-webhook',
  },
  logic: {
    bg: 'bg-[rgba(17,24,39,0.06)]',
    ring: 'ring-[rgba(17,24,39,0.2)]',
    icon: 'text-[var(--text-primary)]',
    glow: '0 10px 22px 0 rgba(15,23,42,0.06)',
    highlight: 'rgba(17,24,39,0.08)',
  },
  memory: {
    bg: 'bg-[rgba(17,24,39,0.06)]',
    ring: 'ring-[rgba(17,24,39,0.2)]',
    icon: 'text-[var(--text-primary)]',
    glow: '0 10px 22px 0 rgba(15,23,42,0.06)',
    highlight: 'rgba(17,24,39,0.08)',
  },
  orchestration: {
    bg: 'bg-[rgba(17,24,39,0.06)]',
    ring: 'ring-[rgba(17,24,39,0.2)]',
    icon: 'text-[var(--text-primary)]',
    glow: '0 10px 22px 0 rgba(15,23,42,0.06)',
    highlight: 'rgba(17,24,39,0.08)',
  },
  human: {
    bg: 'bg-[rgba(17,24,39,0.06)]',
    ring: 'ring-[rgba(17,24,39,0.2)]',
    icon: 'text-[var(--text-primary)]',
    glow: '0 10px 22px 0 rgba(15,23,42,0.06)',
    highlight: 'rgba(17,24,39,0.08)',
  },
  action: {
    bg: 'bg-[rgba(17,24,39,0.06)]',
    ring: 'ring-[rgba(17,24,39,0.2)]',
    icon: 'text-[var(--text-primary)]',
    glow: '0 10px 22px 0 rgba(15,23,42,0.06)',
    highlight: 'rgba(17,24,39,0.08)',
  },
  input: {
    bg: 'bg-[rgba(17,24,39,0.06)]',
    ring: 'ring-[rgba(17,24,39,0.2)]',
    icon: 'text-[var(--text-primary)]',
    glow: '0 10px 22px 0 rgba(15,23,42,0.06)',
    highlight: 'rgba(17,24,39,0.08)',
  },
  'denbegaye-agent': {
    bg: 'bg-[rgba(17,24,39,0.06)]',
    ring: 'ring-[rgba(17,24,39,0.2)]',
    icon: 'text-[var(--text-primary)]',
    glow: '0 10px 22px 0 rgba(15,23,42,0.06)',
    highlight: 'rgba(17,24,39,0.08)',
    pulse: 'animate-pulse-agent',
  },
};

export function getNodeTheme(type: NodeTypeKey): NodeTheme {
  return nodeThemeRegistry[type] || nodeThemeRegistry['ai'];
}
