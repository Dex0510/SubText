import OpenAI from 'openai';
import { env } from '../config/env';
import { Timeline, TimelineMessage } from '../services/timeline';
import { HotZone } from './scout';
import { formatMessagesForLLM, extractMessagesInRange } from './base';

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

export interface GottmanBehavior {
  count: number;
  examples: Array<{
    index: number;
    quote: string;
    explanation: string;
    severity: 'low' | 'medium' | 'high';
  }>;
  frequency_per_1000: number;
  percentile: number;
}

export interface ClinicianFindings {
  criticism: GottmanBehavior;
  contempt: GottmanBehavior;
  defensiveness: GottmanBehavior;
  stonewalling: GottmanBehavior;
  repair_attempts: {
    count: number;
    success_rate: number;
    examples: Array<{ index: number; quote: string; outcome: string }>;
  };
  overall_health_score: number;
}

export class ClinicianAgent {
  async analyze(hotZones: HotZone[], timeline: Timeline): Promise<ClinicianFindings> {
    const findings: ClinicianFindings = {
      criticism: { count: 0, examples: [], frequency_per_1000: 0, percentile: 0 },
      contempt: { count: 0, examples: [], frequency_per_1000: 0, percentile: 0 },
      defensiveness: { count: 0, examples: [], frequency_per_1000: 0, percentile: 0 },
      stonewalling: { count: 0, examples: [], frequency_per_1000: 0, percentile: 0 },
      repair_attempts: { count: 0, success_rate: 0, examples: [] },
      overall_health_score: 50,
    };

    for (const zone of hotZones) {
      const zoneMessages = extractMessagesInRange(timeline.messages, zone.start_index, zone.end_index);
      const zoneText = formatMessagesForLLM(zoneMessages);

      const prompt = `You are a clinical psychologist trained in Gottman's SPAFF coding system.
Analyze this conversation episode and code for Gottman's Four Horsemen:

1. Criticism: Attacks on character ("You always...", "You never...", "What's wrong with you")
2. Contempt: Disrespect, sarcasm, mockery, eye-roll emoji, name-calling, sneering
3. Defensiveness: Making excuses, counter-attacks, playing victim, "Yes but..." responses
4. Stonewalling: Withdrawal, one-word replies, silence, refusal to engage, changing subject

Also identify repair attempts:
- Apologies, humor, affection, de-escalation, compromise offers
- Note whether each repair attempt succeeded or was rejected

Conversation episode:
${zoneText}

Return ONLY valid JSON:
{
  "criticism": [
    {"index": 42, "quote": "You never listen to me", "explanation": "Character attack using 'never'", "severity": "medium"}
  ],
  "contempt": [...],
  "defensiveness": [...],
  "stonewalling": [...],
  "repair_attempts": [
    {"index": 55, "quote": "Look, I'm sorry, can we talk?", "outcome": "rejected"}
  ]
}`;

      try {
        const response = await openai.chat.completions.create({
          model: 'gpt-4.1',
          messages: [
            { role: 'system', content: 'You are a Gottman Method specialist. Respond with valid JSON only.' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.2,
          max_tokens: 3000,
          response_format: { type: 'json_object' },
        });

        const content = response.choices[0]?.message?.content || '{}';
        const zoneFindings = JSON.parse(content);

        for (const behavior of ['criticism', 'contempt', 'defensiveness', 'stonewalling'] as const) {
          const items = zoneFindings[behavior] || [];
          findings[behavior].count += items.length;
          findings[behavior].examples.push(...items);
        }

        if (zoneFindings.repair_attempts) {
          findings.repair_attempts.examples.push(...zoneFindings.repair_attempts);
          findings.repair_attempts.count += zoneFindings.repair_attempts.length;
        }
      } catch (err) {
        console.error('Clinician analysis error for zone:', err);
      }
    }

    // Calculate frequencies and percentiles
    const totalMessages = hotZones.reduce((sum, z) => sum + (z.end_index - z.start_index), 0) || 1;

    for (const behavior of ['criticism', 'contempt', 'defensiveness', 'stonewalling'] as const) {
      findings[behavior].frequency_per_1000 = Math.round((findings[behavior].count / totalMessages) * 1000);
      findings[behavior].percentile = this.calculatePercentile(findings[behavior].frequency_per_1000);
    }

    // Calculate repair success rate
    const repairs = findings.repair_attempts.examples;
    const successful = repairs.filter(r => r.outcome === 'accepted' || r.outcome === 'successful');
    findings.repair_attempts.success_rate = repairs.length > 0
      ? Math.round((successful.length / repairs.length) * 100)
      : 0;

    // Calculate overall health score (0-100)
    findings.overall_health_score = this.calculateHealthScore(findings);

    return findings;
  }

  private calculatePercentile(frequency: number): number {
    if (frequency < 5) return 25;
    if (frequency < 10) return 50;
    if (frequency < 20) return 75;
    return 95;
  }

  private calculateHealthScore(findings: ClinicianFindings): number {
    let score = 100;

    // Deduct for Four Horsemen
    score -= Math.min(findings.criticism.frequency_per_1000 * 2, 25);
    score -= Math.min(findings.contempt.frequency_per_1000 * 3, 30); // Contempt is worst predictor
    score -= Math.min(findings.defensiveness.frequency_per_1000 * 1.5, 20);
    score -= Math.min(findings.stonewalling.frequency_per_1000 * 2, 25);

    // Add back for repair attempts
    score += Math.min(findings.repair_attempts.success_rate * 0.2, 15);

    return Math.max(0, Math.min(100, Math.round(score)));
  }
}
