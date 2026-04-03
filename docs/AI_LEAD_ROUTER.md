# AI Lead Router

The AI Lead Router automatically classifies inbound real estate inquiries and routes them to the appropriate pipeline for follow-up.

## Components

1. **Routing Engine** — Uses an LLM to analyze inquiry text and lead history, then assigns a pipeline (`buyer_active`, `seller_listing`, `rental`, `commercial`, `referral`, `general_inquiry`).
2. **Batch Ingestion** — Accepts CSV uploads (e.g., open house sign-in sheets) and routes each lead through the engine, notifying assigned teams.
3. **Event Delivery** — Publishes routing events to downstream systems (CRM, agent dashboards) via webhooks with delivery tracking.

## Architecture

```
Inbound Inquiry ──▶ LeadRouterService ──▶ Pipeline Assignment
                         │
        CSV Upload ──▶ BatchIngestionService ──▶ Notifications
                         │
                    EventDeliveryService ──▶ Webhooks (CRM, dashboards)
```
