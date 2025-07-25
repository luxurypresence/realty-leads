import leadsData from '../leads.json' assert { type: 'json' };
class LeadService {
    leads;
    constructor() {
        this.leads = leadsData;
    }
    /**
     * Find leads
     * @returns {Lead[]} Array of leads
     */
    find() {
        return [...this.leads];
    }
}
export default LeadService;
//# sourceMappingURL=LeadService.js.map