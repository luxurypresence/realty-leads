import ScoringService from '../services/ScoringService.js';
import type { Lead } from '../types/lead.js';

const makeLead = (overrides: Partial<Lead> = {}): Lead => ({
  id: 'lead-test',
  name: 'Test Lead',
  email: 'test@example.com',
  phone: '555-000-0000',
  source: 'Website Form',
  budget: 0,
  propertyTypePreference: [],
  locationPreference: [],
  inquiryDate: '2024-07-01T00:00:00Z',
  lastActivity: '2024-07-01T00:00:00Z',
  notes: '',
  emailEngagement: { openedEmails: 0, clickedLinks: 0 },
  websiteActivity: { pagesViewed: [], timeOnSiteMinutes: 0 },
  ...overrides,
});

describe('ScoringService', () => {
  const service = new ScoringService();

  describe('scoreLead', () => {
    it('scores 0 when no rules match', async () => {
      const scored = await service.scoreLead(makeLead());
      expect(scored.score).toBe(0);
    });

    it.each([
      [399999, 0],
      [400000, 3],
      [699999, 3],
      [700000, 8], // budget rules stack: +5 and +3
    ])('budget %i scores %i', async (budget, expected) => {
      const scored = await service.scoreLead(makeLead({ budget }));
      expect(scored.score).toBe(expected);
    });

    it('stacks property type preferences (House +2, Condo +1)', async () => {
      const house = await service.scoreLead(makeLead({ propertyTypePreference: ['House'] }));
      const condo = await service.scoreLead(makeLead({ propertyTypePreference: ['Condo'] }));
      const both = await service.scoreLead(makeLead({ propertyTypePreference: ['House', 'Condo'] }));

      expect(house.score).toBe(2);
      expect(condo.score).toBe(1);
      expect(both.score).toBe(3);
    });

    it('scores email engagement (opens >= 3 +1, clicks >= 1 +1, stackable)', async () => {
      const opens = await service.scoreLead(
        makeLead({ emailEngagement: { openedEmails: 3, clickedLinks: 0 } })
      );
      const clicks = await service.scoreLead(
        makeLead({ emailEngagement: { openedEmails: 0, clickedLinks: 1 } })
      );
      const both = await service.scoreLead(
        makeLead({ emailEngagement: { openedEmails: 5, clickedLinks: 3 } })
      );

      expect(opens.score).toBe(1);
      expect(clicks.score).toBe(1);
      expect(both.score).toBe(2);
    });

    it('combines all rule groups (550k + House + Condo + opens + clicks = 8)', async () => {
      const scored = await service.scoreLead(
        makeLead({
          budget: 550000,
          propertyTypePreference: ['House', 'Condo'],
          emailEngagement: { openedEmails: 5, clickedLinks: 3 },
        })
      );
      expect(scored.score).toBe(8);
    });

    it('does not mutate the input lead', async () => {
      const lead = makeLead({ budget: 700000 });
      const scored = await service.scoreLead(lead);

      expect(scored).not.toBe(lead);
      expect(lead.score).toBeUndefined();
    });
  });

  describe('scoreAll', () => {
    it('returns leads sorted by score descending without mutating input', async () => {
      const low = makeLead({ id: 'low' });
      const high = makeLead({ id: 'high', budget: 700000, propertyTypePreference: ['House'] });
      const mid = makeLead({ id: 'mid', budget: 400000 });
      const input = [low, mid, high];

      const scored = await service.scoreAll(input);

      expect(scored.map((l) => l.id)).toEqual(['high', 'mid', 'low']);
      expect(scored.map((l) => l.score)).toEqual([10, 3, 0]);
      expect(input.map((l) => l.id)).toEqual(['low', 'mid', 'high']);
      expect(input.every((l) => l.score === undefined)).toBe(true);
    });
  });
});
