import Anthropic from '@anthropic-ai/sdk';
import { env } from '../config/env';
import { Timeline } from '../services/timeline';
import { formatMessagesForLLM } from './base';

const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

export interface PatternFindings {
  patterns: Array<{
    name: string;
    detected: boolean;
    confidence: number;
    evidence: string;
    details: Record<string, unknown>;
  }>;
  attachment_style: {
    person_a: { style: string; confidence: number };
    person_b: { style: string; confidence: number };
  };
  pronoun_analysis: Record<string, { i_count: number; we_count: number; ratio: number }>;
  latency_analysis: Record<string, { avg_minutes: number; pattern: string }>;
  interaction_loops: Array<{
    type: string;
    description: string;
    frequency: number;
    typical_trigger: string;
    typical_resolution: string;
  }>;
}

export class PatternMatcherAgent {
  async analyze(timeline: Timeline): Promise<PatternFindings> {
    const conversationText = formatMessagesForLLM(timeline.messages);

    // Calculate quantitative metrics
    const senderStats = this.calculateSenderStats(timeline);
    const latencyPatterns = this.calculateLatencyPatterns(timeline);
    const pronounAnalysis = this.calculatePronounAnalysis(timeline);

    const prompt = `You are a systems analyst specializing in relationship dynamics and attachment theory.
Identify interaction loops and attachment patterns in this conversation.

Patterns to detect:
1. Demand/Withdraw: One person pursues (high message frequency), other withdraws (long latency, short responses)
2. Escalation: Conflict intensity increases over time within episodes
3. Repair Attempts: Efforts to de-escalate (apologize, humor, affection) - and their success rate
4. Emotional Bids: One person seeks connection, measure response rate
5. Pursue-Distance Cycle: Anxious pursuit triggers avoidant withdrawal, creating feedback loop
6. Tit-for-Tat: Retaliatory pattern where each person mirrors the other's negativity
7. Stonewalling Cycle: One person shuts down, other escalates to get response

Attachment styles to assess:
- Secure: Comfortable with intimacy and independence, direct communication
- Anxious: Fears abandonment, seeks reassurance, high message frequency, reads into silence
- Avoidant: Values independence, uncomfortable with closeness, delayed responses, brief messages
- Disorganized: Contradictory behavior, push-pull dynamics

Conversation:
${conversationText}

Quantitative data:
Sender stats: ${JSON.stringify(senderStats)}
Response latency: ${JSON.stringify(latencyPatterns)}
Pronoun usage: ${JSON.stringify(pronounAnalysis)}

Return ONLY valid JSON:
{
  "patterns": [
    {
      "name": "demand_withdraw",
      "detected": true,
      "confidence": 85,
      "evidence": "Person A sends 3x more messages...",
      "details": {"pursuer": "Person A", "withdrawer": "Person B"}
    }
  ],
  "attachment_style": {
    "person_a": {"style": "anxious", "confidence": 80},
    "person_b": {"style": "avoidant", "confidence": 75}
  },
  "interaction_loops": [
    {
      "type": "pursue_distance",
      "description": "When Person A sends multiple messages, Person B takes longer to respond",
      "frequency": 12,
      "typical_trigger": "Person A expressing need for connection",
      "typical_resolution": "Person A backs off, Person B re-engages after 24-48 hours"
    }
  ]
}`;

    try {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250514',
        max_tokens: 3000,
        system: 'You are a systems analyst specializing in relationship dynamics, attachment theory, and interaction pattern recognition. Always respond with valid JSON only.',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
      });

      const content = response.content[0].type === 'text' ? response.content[0].text : '{}';
      // Extract JSON from response (may contain markdown code blocks)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : '{}');

      return {
        patterns: parsed.patterns || [],
        attachment_style: parsed.attachment_style || {
          person_a: { style: 'unknown', confidence: 0 },
          person_b: { style: 'unknown', confidence: 0 },
        },
        pronoun_analysis: pronounAnalysis,
        latency_analysis: latencyPatterns,
        interaction_loops: parsed.interaction_loops || [],
      };
    } catch (err) {
      console.error('Pattern matcher error:', err);
      return {
        patterns: [],
        attachment_style: {
          person_a: { style: 'unknown', confidence: 0 },
          person_b: { style: 'unknown', confidence: 0 },
        },
        pronoun_analysis: pronounAnalysis,
        latency_analysis: latencyPatterns,
        interaction_loops: [],
      };
    }
  }

  private calculateSenderStats(timeline: Timeline): Record<string, unknown> {
    const stats: Record<string, { count: number; total_chars: number; avg_length: number }> = {};

    for (const msg of timeline.messages) {
      const sender = msg.sender || 'Unknown';
      if (!stats[sender]) stats[sender] = { count: 0, total_chars: 0, avg_length: 0 };
      stats[sender].count++;
      stats[sender].total_chars += msg.content.length;
    }

    for (const sender of Object.keys(stats)) {
      stats[sender].avg_length = Math.round(stats[sender].total_chars / stats[sender].count);
    }

    return stats;
  }

  private calculateLatencyPatterns(timeline: Timeline): Record<string, { avg_minutes: number; pattern: string }> {
    const latencies: Record<string, number[]> = {};

    for (let i = 0; i < timeline.messages.length - 1; i++) {
      const current = timeline.messages[i];
      const next = timeline.messages[i + 1];

      if (current.datetime && next.datetime && current.sender !== next.sender && next.sender) {
        const diffMin = (next.datetime.getTime() - current.datetime.getTime()) / (60 * 1000);
        if (diffMin > 0 && diffMin < 24 * 60) { // Ignore gaps > 24 hours
          if (!latencies[next.sender]) latencies[next.sender] = [];
          latencies[next.sender].push(diffMin);
        }
      }
    }

    const result: Record<string, { avg_minutes: number; pattern: string }> = {};
    for (const [sender, values] of Object.entries(latencies)) {
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      result[sender] = {
        avg_minutes: Math.round(avg * 10) / 10,
        pattern: avg < 5 ? 'instant' : avg < 30 ? 'responsive' : avg < 120 ? 'moderate' : 'slow',
      };
    }

    return result;
  }

  private calculatePronounAnalysis(timeline: Timeline): Record<string, { i_count: number; we_count: number; ratio: number }> {
    const analysis: Record<string, { i_count: number; we_count: number; ratio: number }> = {};

    for (const msg of timeline.messages) {
      const sender = msg.sender || 'Unknown';
      if (!analysis[sender]) analysis[sender] = { i_count: 0, we_count: 0, ratio: 0 };

      const words = msg.content.toLowerCase().split(/\s+/);
      for (const word of words) {
        if (['i', "i'm", "i've", "i'll", "i'd", 'me', 'my', 'mine', 'myself'].includes(word)) {
          analysis[sender].i_count++;
        }
        if (['we', "we're", "we've", "we'll", "we'd", 'us', 'our', 'ours', 'ourselves'].includes(word)) {
          analysis[sender].we_count++;
        }
      }
    }

    for (const sender of Object.keys(analysis)) {
      const { i_count, we_count } = analysis[sender];
      analysis[sender].ratio = we_count > 0 ? Math.round((i_count / we_count) * 10) / 10 : i_count;
    }

    return analysis;
  }
}
