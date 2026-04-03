import { parse } from 'csv-parse/sync';
import { routeInquiry } from './LeadRouterService.js';
import type { BatchLeadRow, BatchResult, InboundInquiry } from '../types/router.js';
import db from '../db.js';

export async function processBatch(
  fileBuffer: Buffer,
  uploadedBy: string
): Promise<BatchResult> {
  const csvString = fileBuffer.toString('utf-8');
  const rows: BatchLeadRow[] = parse(csvString, {
    columns: true,
    skip_empty_lines: true,
  });

  const result: BatchResult = {
    totalRows: rows.length,
    processed: 0,
    failed: 0,
    results: [],
  };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    try {
      // Convert CSV row to an inbound inquiry
      const inquiry: InboundInquiry = {
        name: row.name,
        email: row.email,
        phone: row.phone,
        message: row.notes || `Open house lead interested in ${row.propertyInterest}`,
        source: row.source || 'open_house',
        propertyAddress: row.propertyInterest,
      };

      // Route through the AI router
      const routingResult = await routeInquiry(inquiry);

      // Save the routed lead to the database
      await db.Lead.create({
        name: row.name,
        email: row.email,
        phone: row.phone,
        source: inquiry.source,
        pipeline: routingResult.pipeline,
        confidence: routingResult.confidence,
        routedAt: new Date(),
        uploadedBy,
      });

      // Notify the assigned team
      await notifyTeam(routingResult.pipeline, {
        leadName: row.name,
        leadEmail: row.email,
        leadPhone: row.phone,
        pipeline: routingResult.pipeline,
        confidence: routingResult.confidence,
        reasoning: routingResult.reasoning,
        propertyInterest: row.propertyInterest,
        source: inquiry.source,
        routedAt: new Date().toISOString(),
      }).catch(() => {});

      result.processed++;
      result.results.push({
        row: i + 1,
        email: row.email,
        pipeline: routingResult.pipeline,
        status: 'routed',
      });
    } catch (error) {
      result.failed++;
      result.results.push({
        row: i + 1,
        email: row.email,
        pipeline: 'general_inquiry',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return result;
}

async function notifyTeam(
  pipeline: string,
  payload: Record<string, unknown>
): Promise<void> {
  const webhookUrl = await db.WebhookConfig.findOne({
    where: { pipeline, event: 'lead_routed' },
  });

  if (!webhookUrl) return;

  await fetch(webhookUrl.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export default { processBatch };
