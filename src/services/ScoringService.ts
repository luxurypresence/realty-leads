import { Engine } from 'json-rules-engine';
import type { RuleProperties } from 'json-rules-engine';
import rulesConfig from '../config/scoring-rules.json' with { type: 'json' };
import type { Lead } from '../types/lead.js';

const BASE_SCORE = 0;

class ScoringService {
  private engine: Engine;

  constructor(rules: RuleProperties[] = rulesConfig.rules as RuleProperties[]) {
    // allowUndefinedFacts not needed: every rule references the single 'lead' fact
    this.engine = new Engine(rules);
  }

  /**
   * Score a single lead against the configured ruleset.
   * Every matched rule's event contributes `params.points` to the total.
   * @returns A new Lead with `score` populated (input is never mutated)
   */
  async scoreLead(lead: Lead): Promise<Lead> {
    const { events } = await this.engine.run({ lead });
    const score = events.reduce(
      (sum, event) => sum + Number(event.params?.['points'] ?? 0),
      BASE_SCORE
    );
    return { ...lead, score };
  }

  /**
   * Score leads and prioritize them.
   * @returns New array of scored leads sorted by score descending
   */
  async scoreAll(leads: Lead[]): Promise<Lead[]> {
    const scored = await Promise.all(leads.map((lead) => this.scoreLead(lead)));
    return scored.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  }
}

export default ScoringService;
