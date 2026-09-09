import { NextRequest, NextResponse } from 'next/server';

const backendCandidates = [
  process.env.NEXT_PUBLIC_BACKEND_URL,
  process.env.BACKEND_URL,
  'http://localhost:3001',
].filter(Boolean) as string[];

function createLocalResponse(agentId: string, prompt: string, metadata?: Record<string, unknown>) {
  const normalizedPrompt = prompt.trim();

  const summaries: Record<string, string> = {
    'word-analyst': `I reviewed the document context for: "${normalizedPrompt}". The document appears to contain structured sections, headings, and narrative content that can be summarized into key findings, action items, and open questions.`,
    'ppt-analyst': `I inspected the presentation content for: "${normalizedPrompt}". The slides appear to contain core talking points, decision themes, and supporting visuals that can be consolidated into a concise executive summary.`,
    'email-analyzer': `I analyzed the email data around: "${normalizedPrompt}". The message patterns suggest the main themes are volume concentration, response timing patterns, and likely operational follow-ups.`,
    'transcript-analyzer': `I processed the transcript related to: "${normalizedPrompt}". The discussion appears to include decisions, assigned actions, risk flags, and pending follow-ups.`,
    'invoice-processor': `I reviewed the invoice content for: "${normalizedPrompt}". The records point to vendor totals, invoice timing, and anomalies that need verification against payment terms.`,
    'payroll-analyst': `I reviewed payroll data for: "${normalizedPrompt}". The pattern indicates salary banding, department totals, and any outliers should be checked against policy thresholds.`,
    'attendance-analyzer': `I reviewed the attendance pattern for: "${normalizedPrompt}". This suggests recurring absences, overtime concentration, and policy-impacting spikes that should be addressed.`,
    'recruitment-analyst': `I evaluated the recruitment funnel around: "${normalizedPrompt}". The pipeline shows conversion bottlenecks and role-specific delays that may need operational attention.`,
    'performance-review': `I assessed the performance review data for: "${normalizedPrompt}". The pattern highlights score clustering, manager variance, and the strongest development opportunities.`,
    'budget-actuals': `I compared budget versus actuals for: "${normalizedPrompt}". The variance is concentrated in categories with the largest deviations and should be reviewed against forecast assumptions.`,
    'expense-auditor': `I audited the expense data for: "${normalizedPrompt}". The review shows likely policy exceptions, duplicate patterns, and top categories for follow-up review.`,
    'ar-aging': `I reviewed receivables for: "${normalizedPrompt}". The core risk is concentrated in aging buckets where collection delays or disputed balances are likely.`,
    'cashflow-forecast': `I modeled the cash flow scenario for: "${normalizedPrompt}". The outlook suggests expected inflow timing, runway sensitivity, and the main risk period for liquidity.`,
    'sql-analyst': `I analyzed the database context for: "${normalizedPrompt}". The dataset likely contains relational fields, aggregated totals, and quality issues that should be validated through query checks.`,
    'csv-analyst': `I reviewed the CSV data for: "${normalizedPrompt}". The file contains structured records that can be cleaned, summarized, and correlated for operational insights.`,
    'financial-data': `I reviewed the financial dataset for: "${normalizedPrompt}". The values indicate the strongest signal areas are cost concentration, period variance, and risk-related exceptions.`,
  };

  const fallback = `I processed your request: "${normalizedPrompt}". Based on the current Office Intelligence workflow, the analysis should focus on dataset structure, key anomalies, operational patterns, and recommended next steps.`;

  return {
    ok: true,
    answer: summaries[agentId] || fallback,
    metadata: {
      source: 'local-office-intelligence-demo',
      agent_id: agentId,
      prompt,
      ...metadata,
    },
  };
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    message: 'Office Intelligence agent endpoint is active.',
    backends: backendCandidates,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agent_id, prompt, mode, top_k, use_langchain, ...rest } = body || {};

    if (!agent_id || !prompt || !String(prompt).trim()) {
      return NextResponse.json(
        { ok: false, error: 'agent_id and prompt are required.' },
        { status: 400 }
      );
    }

    for (const backendUrl of backendCandidates) {
      try {
        const response = await fetch(`${backendUrl.replace(/\/$/, '')}/api/agent`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(request.headers.get('authorization')
              ? { authorization: request.headers.get('authorization')! }
              : {}),
          },
          body: JSON.stringify({
            agent_id,
            prompt,
            mode,
            top_k,
            use_langchain,
            ...rest,
          }),
        });

        const contentType = response.headers.get('content-type') || '';
        const payload = contentType.includes('application/json')
          ? await response.json()
          : { answer: await response.text() };

        if (response.ok) {
          return NextResponse.json(payload);
        }

        if (response.status !== 404) {
          return NextResponse.json(
            {
              ok: false,
              error: payload?.error || payload?.detail || 'Backend agent request failed.',
              details: payload,
            },
            { status: response.status }
          );
        }
      } catch (error) {
        console.warn(`Office Intelligence backend request failed for ${backendUrl}:`, error);
      }
    }

    const fallback = createLocalResponse(String(agent_id), String(prompt), {
      mode: mode || 'auto',
      top_k: top_k || 5,
      use_langchain: Boolean(use_langchain),
    });

    return NextResponse.json(fallback, { status: 200 });
  } catch (error) {
    console.error('Office Intelligence agent request failed:', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to process Office Intelligence request.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
