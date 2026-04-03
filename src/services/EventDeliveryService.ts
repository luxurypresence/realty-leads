import db from '../db.js';
import type { RoutingEvent, WebhookEndpoint, DeliveryResult } from '../types/router.js';

const POLL_INTERVAL_MS = 5_000;

export function startEventPoller(): void {
  setInterval(async () => {
    try {
      await processEvents();
    } catch (error) {
      console.error('Event poller error:', error);
    }
  }, POLL_INTERVAL_MS);

  console.log(`Event delivery poller started (every ${POLL_INTERVAL_MS}ms)`);
}

async function processEvents(): Promise<void> {
  // Fetch all pending events
  const events: RoutingEvent[] = await db.RoutingEvent.findAll({
    where: { status: 'pending' },
  });

  if (events.length === 0) return;

  // Deliver all events concurrently
  const deliveryPromises = events.map(async (event) => {
    const results = await deliverEvent(event);
    return { event, results };
  });

  const outcomes = await Promise.all(deliveryPromises);

  // Update event statuses based on delivery results
  for (const { event, results } of outcomes) {
    const allDelivered = results.every((r) => r.status === 'delivered');

    if (allDelivered) {
      await db.RoutingEvent.update(
        { status: 'delivered', updatedAt: new Date() },
        { where: { id: event.id } }
      );
    } else {
      await db.RoutingEvent.update(
        { status: 'pending', retryCount: event.retryCount + 1, updatedAt: new Date() },
        { where: { id: event.id } }
      );
    }
  }
}

async function deliverEvent(event: RoutingEvent): Promise<DeliveryResult[]> {
  // Find all endpoints subscribed to this event type
  const endpoints: WebhookEndpoint[] = await db.WebhookEndpoint.findAll({
    where: { active: true },
  });

  const subscribedEndpoints = endpoints.filter((ep) =>
    ep.eventTypes.includes(event.eventType)
  );

  const results: DeliveryResult[] = [];

  for (const endpoint of subscribedEndpoints) {
    try {
      const response = await fetch(endpoint!.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId: event.id,
          eventType: event.eventType,
          leadId: event.leadId,
          pipeline: event.pipeline,
          payload: event.payload,
          timestamp: event.createdAt,
        }),
      });

      if (!response.ok) {
        results.push({
          eventId: event.id,
          endpointId: endpoint.id,
          status: 'failed',
          httpStatus: response.status,
          error: `HTTP ${response.status}`,
        });
      } else {
        results.push({
          eventId: event.id,
          endpointId: endpoint.id,
          status: 'delivered',
          httpStatus: response.status,
        });
      }
    } catch (error) {
      results.push({
        eventId: event.id,
        endpointId: endpoint.id,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Network error',
      });
    }
  }

  return results;
}

export default { startEventPoller };
