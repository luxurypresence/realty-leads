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
