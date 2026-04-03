export type Pipeline =
  | 'buyer_active'
  | 'seller_listing'
  | 'rental'
  | 'commercial'
  | 'referral'
  | 'general_inquiry';

export interface InboundInquiry {
  name: string;
  email: string;
  phone?: string;
  message: string;
  source: string;
  propertyAddress?: string;
}

export interface RoutingResult {
  pipeline: Pipeline;
  confidence: number;
  reasoning: string;
  leadId: string;
}

export interface ExistingLead {
  id: string;
  name: string;
  email: string;
  phone: string;
  budget: number;
  propertyTypePreference: string[];
  locationPreference: string[];
  notes: string;
  assignedAgent?: string;
  previousPipeline?: Pipeline;
}

export interface BatchLeadRow {
  name: string;
  email: string;
  phone: string;
  notes: string;
  propertyInterest: string;
  source: string;
}

export interface BatchResult {
  totalRows: number;
  processed: number;
  failed: number;
  results: Array<{
    row: number;
    email: string;
    pipeline: Pipeline;
    status: 'routed' | 'failed';
    error?: string;
  }>;
}

export type RoutingEventType = 'lead_routed' | 'lead_rerouted' | 'lead_unassigned';

export interface RoutingEvent {
  id: string;
  leadId: string;
  eventType: RoutingEventType;
  pipeline: Pipeline;
  payload: Record<string, unknown>;
  status: 'pending' | 'delivered' | 'failed';
  retryCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface WebhookEndpoint {
  id: string;
  name: string;
  url: string;
  eventTypes: RoutingEventType[];
  active: boolean;
}

export interface DeliveryResult {
  eventId: string;
  endpointId: string;
  status: 'delivered' | 'failed';
  httpStatus?: number;
  error?: string;
}
