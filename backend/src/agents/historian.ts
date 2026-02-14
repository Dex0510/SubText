import OpenAI from 'openai';
import { env } from '../config/env';
import { Timeline } from '../services/timeline';
import { formatMessagesForLLM } from './base';

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

export interface HistorianFindings {
  event_timeline: Array<{
    date: string;
    event_type: string;
    description: string;
    significance: 'low' | 'medium' | 'high' | 'critical';
    message_indices: number[];
  }>;
  recurring_themes: Array<{
    theme: string;
    description: string;
    first_occurrence: string;
    frequency: number;
    resolution_status: 'resolved' | 'unresolved' | 'recurring';
  }>;
  turning_points: Array<{
    date: string;
    description: string;
    impact: string;
    before_dynamic: string;
    after_dynamic: string;
  }>;
  trajectory: {
    overall: 'improving' | 'declining' | 'cyclical' | 'stable';
    confidence: number;
    description: string;
    phases: Array<{
      period: string;
      characterization: string;
      sentiment: string;
    }>;
  };
  reference_web: Array<{
    current_reference: string;
    original_event: string;
    pattern: string;
  }>;
}

export class HistorianAgent {
  async analyze(timeline: Timeline): Promise<HistorianFindings> {
    const conversationText = formatMessagesForLLM(timeline.messages);

    const prompt = `You are a narrative therapist analyzing relationship history over time.
Connect events across time and identify patterns, themes, and trajectory.

Tasks:
1. Event Timeline: Identify key events (fights, reconciliations, breakups, milestones)
2. Recurring Themes: Topics that repeatedly cause conflict
3. Turning Points: Events that shifted the relationship trajectory
4. Reference Web: How past events are invoked in current conflicts
5. Trajectory: Is the relationship improving, declining, cyclical, or stable?

Timeline info:
- Date range: ${timeline.date_range.start} to ${timeline.date_range.end}
- Total messages: ${timeline.total_count}
- Duration: ${timeline.stats.total_duration_days} days
- Communication gaps: ${timeline.gaps.length} periods of >48h silence

Conversation:
${conversationText}

Return ONLY valid JSON:
{
  "event_timeline": [
    {
      "date": "2024-03-15",
      "event_type": "conflict",
      "description": "Major fight about trust issues after finding messages",
      "significance": "critical",
      "message_indices": [100, 101, 102]
    }
  ],
  "recurring_themes": [
    {
      "theme": "trust_issues",
      "description": "Repeated conflicts about transparency and honesty",
      "first_occurrence": "2024-01-20",
      "frequency": 8,
      "resolution_status": "unresolved"
    }
  ],
  "turning_points": [
    {
      "date": "2024-03-15",
      "description": "Discovery of hidden messages changed power dynamic",
      "impact": "Relationship shifted from secure to anxious",
      "before_dynamic": "Balanced communication, mutual trust",
      "after_dynamic": "Person A became hypervigilant, Person B became defensive"
    }
  ],
  "trajectory": {
    "overall": "declining",
    "confidence": 80,
    "description": "Relationship shows declining pattern...",
    "phases": [
      {"period": "Jan-Feb 2024", "characterization": "Honeymoon phase", "sentiment": "positive"}
    ]
  },
  "reference_web": [
    {
      "current_reference": "You're doing the same thing you did in March",
      "original_event": "Trust violation in March",
      "pattern": "Past events used as ammunition in current conflicts"
    }
  ]
}`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4.1',
        messages: [
          { role: 'system', content: 'You are a narrative therapy specialist with expertise in relationship timeline analysis. Respond with valid JSON only.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 4000,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(content);

      return {
        event_timeline: parsed.event_timeline || [],
        recurring_themes: parsed.recurring_themes || [],
        turning_points: parsed.turning_points || [],
        trajectory: parsed.trajectory || {
          overall: 'stable',
          confidence: 50,
          description: 'Insufficient data for trajectory analysis',
          phases: [],
        },
        reference_web: parsed.reference_web || [],
      };
    } catch (err) {
      console.error('Historian agent error:', err);
      return {
        event_timeline: [],
        recurring_themes: [],
        turning_points: [],
        trajectory: {
          overall: 'stable',
          confidence: 0,
          description: 'Analysis failed',
          phases: [],
        },
        reference_web: [],
      };
    }
  }
}
