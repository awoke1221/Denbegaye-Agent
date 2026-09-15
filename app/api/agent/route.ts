import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getOfficeIntelligenceUser } from '@/lib/office-intelligence-auth';
import { getOfficeIntelligenceServiceToken } from '@/lib/office-intelligence-service-auth';

const officeIntelligenceUrl = process.env.OFFICE_INTELLIGENCE_URL || 'http://localhost:8000';
const officeIntelligenceMockEnabled = process.env.OFFICE_INTELLIGENCE_MOCK === 'true';

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

export async function GET(request: NextRequest) {
  const user = await getOfficeIntelligenceUser(request);
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    message: 'Office Intelligence agent endpoint is active.',
    backend: officeIntelligenceUrl,
    mockEnabled: officeIntelligenceMockEnabled,
  });
}

export async function POST(request: NextRequest) {
  try {
    const user = await getOfficeIntelligenceUser(request);
    if (!user) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      agent_id,
      prompt,
      mode = 'auto',
      use_langchain = true,
      table_csv,
      table_json,
      file_path,
      db_file,
      top_k = 5,
      confirm = false,
    } = body || {};

    if (!agent_id || !prompt || !String(prompt).trim()) {
      return NextResponse.json(
        { ok: false, error: 'agent_id and prompt are required.' },
        { status: 400 }
      );
    }

    const requestId = request.headers.get('x-request-id') || randomUUID();
    const serviceToken = getOfficeIntelligenceServiceToken();
    const workerPayload = {
      agent_id,
      prompt,
      mode,
      use_langchain,
      table_csv,
      table_json,
      file_path,
      db_file,
      top_k,
      confirm,
    };

    try {
      const response = await fetch(`${officeIntelligenceUrl.replace(/\/$/, '')}/agent/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-request-id': requestId,
          authorization: `Bearer ${serviceToken}`,
        },
        body: JSON.stringify(workerPayload),
      });

      const contentType = response.headers.get('content-type') || '';
      const payload = contentType.includes('application/json')
        ? await response.json()
        : { detail: await response.text() };

      if (!response.ok) {
        const workerError = payload?.detail || payload?.error;
        const errorMessage =
          typeof workerError === 'string'
            ? workerError
            : workerError?.message || 'Office Intelligence request failed.';
        return NextResponse.json(
          {
            ok: false,
            error: errorMessage,
            request_id: requestId,
            details: payload,
          },
          { status: response.status }
        );
      }

      return NextResponse.json(payload, {
        headers: { 'x-request-id': requestId },
      });
    } catch (error) {
      console.error('Office Intelligence backend request failed:', error);

      if (officeIntelligenceMockEnabled) {
        return NextResponse.json(
          createLocalResponse(String(agent_id), String(prompt), {
            mode,
            top_k,
            use_langchain: Boolean(use_langchain),
            request_id: requestId,
          }),
          { headers: { 'x-request-id': requestId } }
        );
      }

      return NextResponse.json(
        {
          ok: false,
          error: 'Office Intelligence service is unavailable.',
          request_id: requestId,
          details: error instanceof Error ? error.message : 'Unknown connection error',
        },
        { status: 502, headers: { 'x-request-id': requestId } }
      );
    }
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
