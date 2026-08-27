import { NextResponse } from 'next/server';

const allowed = ['Cameras','Computing','Books','Electronics','Audio','Tools','Instruments','Study'];

export async function POST(request: Request) {
  const key = process.env.GROQ_API_KEY;
  if (!key) return NextResponse.json({ error: 'AI provider is not configured' }, { status: 503 });
  const { query } = await request.json() as { query?: string };
  if (!query || typeof query !== 'string' || query.length > 500) return NextResponse.json({ error: 'Invalid query' }, { status: 400 });
  const prompt = `You are the structured need interpreter for a verified Indian college resource-sharing app. Convert the student's request into practical resource needs. Return JSON only with exactly these fields: intent string, urgency string, categories array, requiredItems array, optionalItems array, keywords array, explanation string. categories may only contain: ${allowed.join(', ')}. Keep arrays concise. Student request: ${JSON.stringify(query)}`;
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', { method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: 'llama-3.3-70b-versatile', temperature: 0.15, response_format: { type: 'json_object' }, messages: [{ role: 'user', content: prompt }] }) });
    if (!response.ok) throw new Error('provider failure');
    const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const parsed = JSON.parse(payload.choices?.[0]?.message?.content || '{}') as Record<string, unknown>;
    const valid = typeof parsed.intent === 'string' && typeof parsed.urgency === 'string' && Array.isArray(parsed.categories) && parsed.categories.every(item => allowed.includes(String(item))) && Array.isArray(parsed.requiredItems) && Array.isArray(parsed.optionalItems) && Array.isArray(parsed.keywords) && typeof parsed.explanation === 'string';
    if (!valid) throw new Error('invalid structure');
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json({ error: 'AI response unavailable' }, { status: 502 });
  }
}
