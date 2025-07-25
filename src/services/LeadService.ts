import leadsData from '../leads.json' assert { type: 'json' };
import type { Lead } from '../types/lead.js';

class LeadService {
  private leads: Lead[];

  constructor() {
    this.leads = leadsData as Lead[];
  }

  /**
   * Find leads
   * @returns {Lead[]} Array of leads
   */
  find(): Lead[] {
    return [...this.leads];
  }
}

export default LeadService; 