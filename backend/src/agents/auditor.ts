import Anthropic from '@anthropic-ai/sdk';
import { env } from '../config/env';
import { Timeline } from '../services/timeline';
import { formatMessagesForLLM } from './base';

const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

export interface VerifiedFinding {
  claim: string;
  agent: string;
  evidence: string;
  confidence: number;
  veto: boolean;
  veto_reason?: string;
}

export interface AuditorFindings {
  verified_findings: VerifiedFinding[];
  vetoed_findings: VerifiedFinding[];
  overall_confidence: number;
  methodology_notes: string[];
}

export class ForensicAuditor {
  async verify(agentFindings: Record<string, unknown>, timeline: Timeline): Promise<AuditorFindings> {
    const conversationText = formatMessagesForLLM(timeline.messages, 30000);

    const prompt = `You are a forensic auditor. Your job is to fact-check the analysis agents' findings against the raw transcript.

RULES:
- For each claim, locate supporting evidence in the raw transcript
- Calculate confidence score (0-100%)
- VETO any claim with confidence <70%
- Flag ambiguous findings
- Claims need at least 2 supporting instances to be considered reliable
- If a pattern is present in <3 instances → mark LOW CONFIDENCE
- If a pattern is consistent across 10+ instances → mark HIGH CONFIDENCE

Agent Findings to Verify:
${JSON.stringify(agentFindings, null, 2)}

Raw Conversation:
${conversationText}

Return ONLY valid JSON:
{
  "verified_findings": [
    {
      "claim": "Person A exhibited defensiveness",
      "agent": "clinician",
      "evidence": "Index 42: 'I was just trying to help!' - defensive response to criticism",
      "confidence": 85,
      "veto": false
    }
  ],
  "vetoed_findings": [
    {
      "claim": "Person B showed contempt consistently",
      "agent": "clinician",
      "evidence": "Only 1 ambiguous instance found",
      "confidence": 45,
      "veto": true,
      "veto_reason": "Insufficient evidence - only 1 instance found, pattern not established"
    }
  ],
  "overall_confidence": 78,
  "methodology_notes": [
    "Analysis based on 500 messages spanning 3 months",
    "Confidence is higher for frequently occurring patterns"
  ]
}`;

    try {
      const response = await anthropic.messages.create({
        model: 'claude-opus-4-0-20250514',
        max_tokens: 4000,
        system: 'You are a forensic auditor specializing in relationship communication analysis. Your role is to rigorously verify claims against raw evidence. Accuracy is paramount — you must VETO any claim lacking sufficient evidence. Always respond with valid JSON only.',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
      });

      const content = response.content[0].type === 'text' ? response.content[0].text : '{}';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : '{}');

      return {
        verified_findings: parsed.verified_findings || [],
        vetoed_findings: parsed.vetoed_findings || [],
        overall_confidence: parsed.overall_confidence || 0,
        methodology_notes: parsed.methodology_notes || [],
      };
    } catch (err) {
      console.error('Auditor error:', err);
      return {
        verified_findings: [],
        vetoed_findings: [],
        overall_confidence: 0,
        methodology_notes: ['Verification process encountered an error'],
      };
    }
  }
}
