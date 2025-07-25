export interface EmailEngagement {
  openedEmails: number;
  clickedLinks: number;
}

export interface WebsiteActivity {
  pagesViewed: string[];
  timeOnSiteMinutes: number;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: string;
  budget: number;
  propertyTypePreference: string[];
  locationPreference: string[];
  inquiryDate: string;
  lastActivity: string;
  notes: string;
  emailEngagement: EmailEngagement;
  websiteActivity: WebsiteActivity;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  count?: number;
  error?: string;
  message?: string;
} 