import OpenAI from 'openai';
import type { InboundInquiry, RoutingResult, ExistingLead } from '../types/router.js';
import db from '../db.js';

const openai = new OpenAI();

export async function routeInquiry(inquiry: InboundInquiry): Promise<RoutingResult> {
  // Look up existing lead by email
  const existingLead: ExistingLead | null = await db.Lead.findOne({
    where: { email: inquiry.email },
  });

  const prompt = buildPrompt(inquiry, existingLead);

  try {
    // Tier 1: Use GPT-4o for best accuracy
    const result = await callLLM(prompt, 'gpt-4o');
    return result;
  } catch {
    try {
      // Tier 2: Fall back to GPT-4o-mini
      const result = await callLLM(prompt, 'gpt-4o-mini');
      return result;
    } catch {
      // Tier 3: Default fallback
      return {
        pipeline: 'general_inquiry',
        confidence: 0.5,
        reasoning: 'Routed to general inquiry pipeline',
        leadId: existingLead?.id ?? await createLead(inquiry),
      };
    }
  }
}

function buildPrompt(inquiry: InboundInquiry, existingLead: ExistingLead | null): string {
  let prompt = `Classify this real estate inquiry into the correct pipeline.

Inquiry from ${inquiry.name} (${inquiry.source}):
${inquiry.message}`;

  if (inquiry.propertyAddress) {
    prompt += `\nProperty of interest: ${inquiry.propertyAddress}`;
  }

  if (existingLead) {
    prompt += `\n\nExisting lead record:\n${JSON.stringify(existingLead)}`;
  }

  prompt += `\n\nRespond with the pipeline name.`;

  return prompt;
}

async function callLLM(prompt: string, model: string): Promise<RoutingResult> {
  const completion = await openai.chat.completions.create({
    model,
    messages: [{ role: 'user', content: prompt }],
  });

  const responseText = completion.choices[0].message.content?.trim() ?? '';

  const pipeline = responseText.toLowerCase().replace(/\s+/g, '_');

  return {
    pipeline: pipeline as RoutingResult['pipeline'],
    confidence: model === 'gpt-4o' ? 0.8 : 0.5,
    reasoning: responseText,
    leadId: '', // set by caller
  };
}

async function createLead(inquiry: InboundInquiry): Promise<string> {
  const lead = await db.Lead.create({
    name: inquiry.name,
    email: inquiry.email,
    phone: inquiry.phone ?? '',
    source: inquiry.source,
  });
  return lead.id;
}

export default { routeInquiry };
