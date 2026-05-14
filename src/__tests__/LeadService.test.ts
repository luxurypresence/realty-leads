import LeadService from '../services/LeadService.js';
import leadsData from '../leads.json' with { type: 'json' };
import type { Lead } from '../types/lead.js';

describe('LeadService', () => {
  describe('find', () => {
    it('returns all leads from the underlying data', () => {
      const service = new LeadService();
      const result = service.find();

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength((leadsData as Lead[]).length);
      expect(result).toEqual(leadsData);
    });

    it('returns a new array each call so callers cannot mutate internal state', () => {
      const service = new LeadService();
      const first = service.find();
      const second = service.find();

      expect(first).not.toBe(second);
      expect(first).toEqual(second);

      first.pop();
      expect(service.find()).toHaveLength((leadsData as Lead[]).length);
    });
  });
});
