## Summary

Adds a background event delivery system for routing notifications. When a lead is routed (or re-routed), a `RoutingEvent` record is written to the database. A poller picks up pending events and delivers them to registered webhook endpoints (CRM, agent dashboards, etc.). Failed deliveries are retried automatically.

Design goals: at-least-once delivery, minimal latency for downstream consumers, and easy registration of new webhook endpoints.

## Test Plan

- Verified events are created when leads are routed via `/leads/route`
- Confirmed poller picks up and delivers pending events to a test webhook endpoint
- Tested retry behavior by returning 500s from the test endpoint
- Checked that delivered events are marked as `delivered` and not reprocessed
