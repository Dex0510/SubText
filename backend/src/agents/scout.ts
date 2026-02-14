import OpenAI from 'openai';
import { env } from '../config/env';
import { Timeline } from '../services/timeline';
import { formatMessagesForLLM } from './base';

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

export interface HotZone {
  start_index: number;
  end_index: number;
  intensity_score: number;
  brief_summary: string;
  indicators: string[];
}

export interface ScoutFindings {
  hot_zones: HotZone[];
  total_messages_scanned: number;
  red_flags: Array<{
    type: string;
    description: string;
    confidence: number;
    message_indices: number[];
  }>;
}

export class ScoutAgent {
  async analyze(timeline: Timeline): Promise<ScoutFindings> {
    const conversationText = formatMessagesForLLM(timeline.messages);

    const prompt = `You are a triage specialist analyzing a relationship conversation timeline.
Your task: Identify 5-10 "Hot Zones" (critical episodes) that require deep analysis.

Hot Zone criteria:
- High message velocity (>20 messages/hour)
- Aggressive language (caps, profanity, hostility)
- Prolonged silence after conflict (>48 hours)
- Emotional intensity (crying emoji, "I'm done", breakup language)
- Stonewalling (one-word replies, withdrawal)
- Manipulation patterns (gaslighting, DARVO, guilt-tripping)

Also identify any immediate red flags:
- Gaslighting phrases ("That never happened", "You're imagining things")
- DARVO (Deny, Attack, Reverse Victim/Offender)
- Love bombing followed by withdrawal
- Breadcrumbing (minimal engagement to keep someone interested)
- Stonewalling indicators
- Passive-aggressive language
- Guilt-tripping
- Future faking ("I'll change", with no follow-through)

Conversation:
${conversationText}

Return ONLY valid JSON with this structure:
{
  "hot_zones": [
    {
      "start_index": 0,
      "end_index": 50,
      "intensity_score": 8.5,
      "brief_summary": "Fight about trust issues",
      "indicators": ["caps", "profanity", "silence_after"]
    }
  ],
  "red_flags": [
    {
      "type": "gaslighting",
      "description": "Person B denies event Person A remembers",
      "confidence": 85,
      "message_indices": [42, 43, 44]
    }
  ]
}`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4.1-mini',
        messages: [
          { role: 'system', content: 'You are a relationship analysis expert specialized in identifying communication red flags and conflict patterns. Always respond with valid JSON only.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 3000,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(content);

      return {
        hot_zones: parsed.hot_zones || [],
        total_messages_scanned: timeline.total_count,
        red_flags: parsed.red_flags || [],
      };
    } catch (err) {
      console.error('Scout agent error:', err);
      return {
        hot_zones: [],
        total_messages_scanned: timeline.total_count,
        red_flags: [],
      };
    }
  }

  // Simplified analysis for tactical scan (single message/screenshot)
  async analyzeTactical(text: string): Promise<ScoutFindings> {
    const prompt = `You are a relationship communication analyst. Analyze this single message/conversation excerpt for red flags.

Detect these patterns:
1. Tone: hostile, cold, neutral, warm, loving
2. Hidden aggression: passive-aggressive, gaslighting, DARVO
3. Manipulation patterns: guilt-tripping, minimization, deflection, projection
4. Communication health: stonewalling, contempt, criticism, defensiveness

Text to analyze:
"${text}"

Return ONLY valid JSON:
{
  "hot_zones": [],
  "red_flags": [
    {
      "type": "pattern_name",
      "description": "Explanation of what was detected and why",
      "confidence": 85,
      "message_indices": []
    }
  ],
  "tone": "hostile|cold|neutral|warm|loving",
  "tone_score": 35,
  "hidden_aggression_score": 72,
  "summary": "Brief 2-sentence assessment"
}`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4.1-nano',
        messages: [
          { role: 'system', content: 'You are a clinical communication analyst. Respond with valid JSON only.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(content);

      return {
        hot_zones: [],
        total_messages_scanned: 1,
        red_flags: parsed.red_flags || [],
        ...parsed,
      };
    } catch (err) {
      console.error('Tactical scout error:', err);
      return { hot_zones: [], total_messages_scanned: 1, red_flags: [] };
    }
  }
}
