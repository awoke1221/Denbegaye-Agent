import { Node } from 'reactflow';
import { AgentNodeData } from '@/stores/agentBuilderStore';

export const AgentBuilderTemplates: {
  id: string;
  name: string;
  description: string;
  category: string;
  featured?: boolean;
  icon?: string;
  nodes: Node<AgentNodeData>[];
  edges: { id: string; source: string; target: string; type: string }[];
}[] = [
  {
    id: 'social-content-generator',
    name: 'Social Content Generator',
    description: 'Generate social media posts with AI and publish to supported channels.',
    category: 'Social Media',
    featured: true,
    icon: 'MessageSquare',
    nodes: [
      {
        id: '1',
        type: 'ai-gemini',
        position: { x: 200, y: 100 },
        data: {
          label: 'AI Content Generator',
          icon: 'gemini',
          config: {
            action: 'generateText',
            model: 'gemini-1.5-flash',
            prompt: 'Create a short social media post about {topic} with a strong call to action.',
          },
        },
      },
      {
        id: '2',
        type: 'action-facebook',
        position: { x: 560, y: 80 },
        data: {
          label: 'Facebook Post',
          icon: 'facebook',
          config: {
            pageId: '',
            accessToken: '',
            message: '{output}',
          },
        },
      },
      {
        id: '3',
        type: 'action-telegram',
        position: { x: 560, y: 220 },
        data: {
          label: 'Telegram Message',
          icon: 'telegram',
          config: {
            botToken: '',
            chatId: '',
            message: '{output}',
          },
        },
      },
    ],
    edges: [
      { id: 'e1-2', source: '1', target: '2', type: 'default' },
      { id: 'e1-3', source: '1', target: '3', type: 'default' },
    ],
  },
  {
    id: 'calendar-event-scheduler',
    name: 'Calendar Event Scheduler',
    description: 'Use AI to draft event details and add them to Google Calendar.',
    category: 'Calendars',
    icon: 'Calendar',
    nodes: [
      {
        id: '1',
        type: 'ai-gemini',
        position: { x: 200, y: 100 },
        data: {
          label: 'Event Brief Generator',
          icon: 'gemini',
          config: {
            action: 'generateText',
            model: 'gemini-1.5-pro',
            prompt:
              'Given a meeting topic, generate an event title and description for a Google Calendar invite.',
          },
        },
      },
      {
        id: '2',
        type: 'calendar-google',
        position: { x: 560, y: 120 },
        data: {
          label: 'Google Calendar Event',
          icon: 'gcalendar',
          config: {
            calendarId: 'primary',
            eventSummary: '{output}',
            startISO: '2026-06-01T10:00:00Z',
            endISO: '2026-06-01T11:00:00Z',
          },
        },
      },
    ],
    edges: [{ id: 'e1-2', source: '1', target: '2', type: 'default' }],
  },
  {
    id: 'market-research-agent',
    name: 'Market Research Agent',
    description:
      'Takes a market and topic, runs 3 parallel web searches, synthesizes findings into a structured HTML briefing, and delivers it by email.',
    category: 'Research',
    icon: 'Search',
    nodes: [
      {
        id: 'node-1',
        type: 'trigger-manual',
        position: { x: 140, y: 80 },
        data: {
          label: 'Manual trigger',
          icon: 'wrench',
          config: {
            triggerName: 'Market Research Input',
            description: 'Enter research parameters',
            market: 'Ethiopia',
            topic: 'startup ecosystem',
            timeScope: 'last 6 months',
            inputSchema: 'Ethiopia startup ecosystem research',
          },
        },
      },
      {
        id: 'node-2',
        type: 'core-set',
        position: { x: 420, y: 80 },
        data: {
          label: 'Store variables',
          icon: 'database',
          config: {
            market: '{{node-1.output.market}}',
            topic: '{{node-1.output.topic}}',
            timeScope: '{{node-1.output.timeScope}}',
            today: 'new Date().toISOString().slice(0,10)',
            expression: `{
              market: "{{node-1.output.market}}",
              topic: "{{node-1.output.topic}}",
              timeScope: "{{node-1.output.timeScope}}",
              today: new Date().toISOString().slice(0,10)
            }`,
          },
        },
      },
      {
        id: 'node-3',
        type: 'tool-serpapi-search',
        position: { x: 140, y: 280 },
        data: {
          label: 'Search — overview',
          icon: 'search',
          config: {
            query:
              '{{variables.market}} {{variables.topic}} market overview {{variables.timeScope}}',
            provider: 'duckduckgo',
            engine: 'duckduckgo',
            maxResults: 5,
            resultCount: 5,
            apiKey: '',
          },
        },
      },
      {
        id: 'node-4',
        type: 'tool-serpapi-search',
        position: { x: 420, y: 280 },
        data: {
          label: 'Search — competitors',
          icon: 'search',
          config: {
            query: '{{variables.market}} {{variables.topic}} companies competitors funding 2025',
            provider: 'duckduckgo',
            engine: 'duckduckgo',
            maxResults: 5,
            resultCount: 5,
            apiKey: '',
          },
        },
      },
      {
        id: 'node-5',
        type: 'tool-serpapi-search',
        position: { x: 700, y: 280 },
        data: {
          label: 'Search — risks',
          icon: 'search',
          config: {
            query: '{{variables.market}} {{variables.topic}} risks regulation opportunities',
            provider: 'duckduckgo',
            engine: 'duckduckgo',
            maxResults: 5,
            resultCount: 5,
            apiKey: '',
          },
        },
      },
      {
        id: 'node-6',
        type: 'ai-gemini',
        position: { x: 420, y: 520 },
        data: {
          label: 'AI analyst',
          icon: 'gemini',
          config: {
            action: 'generateText',
            model: 'gemini-2.5-flash',
            systemPrompt: `You are a market research agent. You have received web search
results from three searches. Your task:

1. Select up to 7 genuinely relevant findings from the results.
For each finding include:
  - Title/headline
  - Source name and URL
  - 2-3 sentence summary
  - Category tag: one of [Market Move | Product Launch |
    Regulation | Partnership | Funding | Trend |
    Competitor Activity | Consumer Insight | Pricing | Other]

2. Write the briefing as clean HTML (no markdown).
Use: <h1> for title, <h2> for sections, <h3> for findings,
<p> for paragraphs, <a href=""> for sources, <strong> for
emphasis. Do NOT include <html>, <head>, or <body> tags.

3. Structure the HTML report with these sections:
  - Executive Summary
  - Key Findings (up to 7, each tagged)
  - Market Opportunities
  - Key Risks
  - Recommendations

Only include information from the search results provided.
If results are thin, say so honestly. Do not invent data.
Write as if briefing someone making a business decision.`,
            inputText: `Market: {{variables.market}}
Topic: {{variables.topic}}
Time scope: {{variables.timeScope}}
Date: {{variables.today}}

=== SEARCH 1: Overview ===
{{3.output.text}}

=== SEARCH 2: Competitors ===
{{4.output.text}}

=== SEARCH 3: Risks & Regulation ===
{{5.output.text}}`,
            maxTokens: 4000,
            temperature: 0.3,
          },
        },
      },
      {
        id: 'node-7',
        type: 'action-email',
        position: { x: 420, y: 760 },
        data: {
          label: 'Deliver report',
          icon: 'email',
          config: {
            provider: 'smtp',
            smtpHost: 'smtp.gmail.com',
            smtpPort: 587,
            smtpSecure: false,
            smtpUser: '',
            smtpPassword: '',
            from: '',
            to: '',
            subject: 'Market research ready: {{variables.market}} — {{variables.topic}}',
            body: `Your market research briefing is ready.

Market: {{variables.market}}
Topic: {{variables.topic}}
Date: {{variables.today}}

=== REPORT ===
{{6.output.text}}`,
          },
        },
      },
    ],
    edges: [
      { id: 'e1-2', source: 'node-1', target: 'node-2', type: 'default' },
      { id: 'e2-3', source: 'node-2', target: 'node-3', type: 'default' },
      { id: 'e2-4', source: 'node-2', target: 'node-4', type: 'default' },
      { id: 'e2-5', source: 'node-2', target: 'node-5', type: 'default' },
      { id: 'e3-6', source: 'node-3', target: 'node-6', type: 'default' },
      { id: 'e4-6', source: 'node-4', target: 'node-6', type: 'default' },
      { id: 'e5-6', source: 'node-5', target: 'node-6', type: 'default' },
      { id: 'e6-7', source: 'node-6', target: 'node-7', type: 'default' },
    ],
  },
];
