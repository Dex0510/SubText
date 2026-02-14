import { Timeline } from './timeline';
import { ScoutFindings } from '../agents/scout';
import { ClinicianFindings } from '../agents/clinician';
import { PatternFindings } from '../agents/patternMatcher';
import { HistorianFindings } from '../agents/historian';
import { AuditorFindings } from '../agents/auditor';

interface MRIFindings {
  scout: ScoutFindings;
  clinician: ClinicianFindings;
  pattern_matcher: PatternFindings;
  historian: HistorianFindings;
  auditor: AuditorFindings;
}

export interface ReportData {
  case_id: string;
  report_type: 'tactical_scan' | 'mri';
  generated_at: string;
  chapters: ReportChapter[];
  metadata: {
    total_messages: number;
    date_range: { start: string | null; end: string | null };
    senders: string[];
    overall_confidence: number;
    overall_health_score: number;
  };
}

interface ReportChapter {
  title: string;
  sections: ReportSection[];
}

interface ReportSection {
  heading: string;
  type: 'text' | 'score' | 'list' | 'chart_data' | 'table' | 'timeline_event';
  content: unknown;
}

export class ReportGenerator {
  generateTacticalScanReport(caseId: string, findings: ScoutFindings & Record<string, unknown>, timeline: Timeline): ReportData {
    const chapters: ReportChapter[] = [];

    // Chapter 1: Quick Assessment
    chapters.push({
      title: 'Quick Assessment',
      sections: [
        {
          heading: 'Tone Analysis',
          type: 'score',
          content: {
            label: 'Communication Tone',
            value: findings.tone || 'neutral',
            score: findings.tone_score || 50,
            scale: { min: 0, max: 100, labels: ['Hostile', 'Cold', 'Neutral', 'Warm', 'Loving'] },
          },
        },
        {
          heading: 'Hidden Aggression Score',
          type: 'score',
          content: {
            label: 'Hidden Aggression',
            score: findings.hidden_aggression_score || 0,
            scale: { min: 0, max: 100, labels: ['None', 'Low', 'Moderate', 'High', 'Severe'] },
            description: 'Measures passive-aggressive patterns, gaslighting indicators, and covert manipulation',
          },
        },
        {
          heading: 'Summary',
          type: 'text',
          content: findings.summary || 'Analysis complete. See red flags below for details.',
        },
      ],
    });

    // Chapter 2: Red Flags
    chapters.push({
      title: 'Red Flags Detected',
      sections: findings.red_flags.map(flag => ({
        heading: this.formatRedFlagType(flag.type),
        type: 'list' as const,
        content: {
          type: flag.type,
          description: flag.description,
          confidence: flag.confidence,
          severity: flag.confidence >= 80 ? 'high' : flag.confidence >= 60 ? 'medium' : 'low',
        },
      })),
    });

    // Chapter 3: What to Watch For
    chapters.push({
      title: 'What to Watch For',
      sections: [
        {
          heading: 'Recommendations',
          type: 'text',
          content: 'This is a single-message analysis. For a comprehensive understanding, consider uploading your full conversation history for a Relationship MRI. Patterns are best identified across multiple interactions over time.',
        },
        {
          heading: 'Resources',
          type: 'list',
          content: [
            'If you feel unsafe, contact the National DV Hotline: 1-800-799-7233',
            'Consider speaking with a licensed therapist for professional guidance',
            'For a full analysis, upgrade to Relationship MRI',
          ],
        },
      ],
    });

    return {
      case_id: caseId,
      report_type: 'tactical_scan',
      generated_at: new Date().toISOString(),
      chapters,
      metadata: {
        total_messages: timeline.total_count,
        date_range: timeline.date_range,
        senders: timeline.senders,
        overall_confidence: findings.red_flags.length > 0
          ? Math.round(findings.red_flags.reduce((sum, f) => sum + f.confidence, 0) / findings.red_flags.length)
          : 0,
        overall_health_score: 100 - (findings.hidden_aggression_score as number || 0),
      },
    };
  }

  generateMRIReport(caseId: string, findings: MRIFindings, timeline: Timeline): ReportData {
    const chapters: ReportChapter[] = [];

    // Chapter 1: Executive Summary
    chapters.push(this.generateExecutiveSummary(findings, timeline));

    // Chapter 2: Timeline
    chapters.push(this.generateTimelineChapter(findings.historian, timeline));

    // Chapter 3: Gottman Scorecard
    chapters.push(this.generateGottmanChapter(findings.clinician));

    // Chapter 4: Attachment Map
    chapters.push(this.generateAttachmentChapter(findings.pattern_matcher));

    // Chapter 5: Communication Audit
    chapters.push(this.generateCommunicationChapter(findings, timeline));

    // Chapter 6: Event Log
    chapters.push(this.generateEventLogChapter(findings.scout, findings.historian));

    // Chapter 7: Red Flags
    chapters.push(this.generateRedFlagsChapter(findings.scout, findings.auditor));

    // Chapter 8: Longitudinal Analysis
    chapters.push(this.generateLongitudinalChapter(findings.historian));

    // Chapter 9: Action Guide
    chapters.push(this.generateActionGuide(findings));

    return {
      case_id: caseId,
      report_type: 'mri',
      generated_at: new Date().toISOString(),
      chapters,
      metadata: {
        total_messages: timeline.total_count,
        date_range: timeline.date_range,
        senders: timeline.senders,
        overall_confidence: findings.auditor.overall_confidence,
        overall_health_score: findings.clinician.overall_health_score,
      },
    };
  }

  private generateExecutiveSummary(findings: MRIFindings, timeline: Timeline): ReportChapter {
    const topPatterns = findings.pattern_matcher.patterns
      .filter(p => p.detected && p.confidence >= 70)
      .slice(0, 3);

    const riskLevel = findings.clinician.overall_health_score >= 70 ? 'Secure'
      : findings.clinician.overall_health_score >= 40 ? 'Moderate'
      : 'High Risk';

    return {
      title: 'Executive Summary',
      sections: [
        {
          heading: 'Overall Health Score',
          type: 'score',
          content: {
            score: findings.clinician.overall_health_score,
            scale: { min: 0, max: 100 },
            risk_level: riskLevel,
          },
        },
        {
          heading: 'Top Patterns Detected',
          type: 'list',
          content: topPatterns.map(p => ({
            name: p.name,
            confidence: p.confidence,
            evidence: p.evidence,
          })),
        },
        {
          heading: 'Relationship Trajectory',
          type: 'text',
          content: findings.historian.trajectory.description,
        },
        {
          heading: 'Verification Confidence',
          type: 'score',
          content: {
            score: findings.auditor.overall_confidence,
            description: `Based on ${findings.auditor.verified_findings.length} verified findings and ${findings.auditor.vetoed_findings.length} vetoed claims`,
          },
        },
      ],
    };
  }

  private generateTimelineChapter(historian: HistorianFindings, timeline: Timeline): ReportChapter {
    return {
      title: 'The Timeline',
      sections: [
        {
          heading: 'Message Volume Over Time',
          type: 'chart_data',
          content: {
            chart_type: 'line',
            description: 'Messages per day over the relationship duration',
            data_source: 'timeline_messages',
          },
        },
        {
          heading: 'Communication Gaps',
          type: 'table',
          content: timeline.gaps.map(g => ({
            start: g.start,
            end: g.end,
            duration: `${Math.round(g.duration_hours)} hours`,
          })),
        },
        {
          heading: 'Key Events',
          type: 'timeline_event',
          content: historian.event_timeline,
        },
      ],
    };
  }

  private generateGottmanChapter(clinician: ClinicianFindings): ReportChapter {
    return {
      title: 'Gottman Four Horsemen Scorecard',
      sections: [
        {
          heading: 'Frequency Analysis',
          type: 'chart_data',
          content: {
            chart_type: 'bar',
            data: {
              criticism: clinician.criticism.frequency_per_1000,
              contempt: clinician.contempt.frequency_per_1000,
              defensiveness: clinician.defensiveness.frequency_per_1000,
              stonewalling: clinician.stonewalling.frequency_per_1000,
            },
            baseline: 10, // healthy baseline
          },
        },
        ...(['criticism', 'contempt', 'defensiveness', 'stonewalling'] as const).map(behavior => ({
          heading: behavior.charAt(0).toUpperCase() + behavior.slice(1),
          type: 'list' as const,
          content: {
            count: clinician[behavior].count,
            frequency: clinician[behavior].frequency_per_1000,
            percentile: clinician[behavior].percentile,
            examples: clinician[behavior].examples.slice(0, 3),
          },
        })),
        {
          heading: 'Repair Attempts',
          type: 'list',
          content: {
            count: clinician.repair_attempts.count,
            success_rate: clinician.repair_attempts.success_rate,
            examples: clinician.repair_attempts.examples.slice(0, 5),
          },
        },
      ],
    };
  }

  private generateAttachmentChapter(patterns: PatternFindings): ReportChapter {
    return {
      title: 'Attachment Map',
      sections: [
        {
          heading: 'Attachment Style Assessment',
          type: 'table',
          content: patterns.attachment_style,
        },
        {
          heading: 'Pronoun Usage Analysis',
          type: 'table',
          content: patterns.pronoun_analysis,
        },
        {
          heading: 'Response Latency Patterns',
          type: 'table',
          content: patterns.latency_analysis,
        },
        {
          heading: 'Interaction Loops',
          type: 'list',
          content: patterns.interaction_loops,
        },
      ],
    };
  }

  private generateCommunicationChapter(findings: MRIFindings, timeline: Timeline): ReportChapter {
    return {
      title: 'Communication Audit',
      sections: [
        {
          heading: 'Message Balance',
          type: 'chart_data',
          content: {
            chart_type: 'pie',
            data: timeline.stats.messages_per_sender,
          },
        },
        {
          heading: 'Average Message Length',
          type: 'table',
          content: timeline.stats.avg_message_length,
        },
        {
          heading: 'Detected Patterns',
          type: 'list',
          content: findings.pattern_matcher.patterns.filter(p => p.detected),
        },
      ],
    };
  }

  private generateEventLogChapter(scout: ScoutFindings, historian: HistorianFindings): ReportChapter {
    return {
      title: 'Critical Episodes',
      sections: scout.hot_zones.map((zone, i) => ({
        heading: `Episode ${i + 1}: ${zone.brief_summary}`,
        type: 'list' as const,
        content: {
          intensity: zone.intensity_score,
          message_range: `Messages ${zone.start_index}-${zone.end_index}`,
          indicators: zone.indicators,
        },
      })),
    };
  }

  private generateRedFlagsChapter(scout: ScoutFindings, auditor: AuditorFindings): ReportChapter {
    return {
      title: 'Red Flags Report',
      sections: [
        {
          heading: 'Detected Patterns',
          type: 'list',
          content: scout.red_flags.map(flag => ({
            ...flag,
            verified: auditor.verified_findings.some(v =>
              v.claim.toLowerCase().includes(flag.type.toLowerCase())
            ),
          })),
        },
        {
          heading: 'Verification Summary',
          type: 'text',
          content: `${auditor.verified_findings.length} findings verified, ${auditor.vetoed_findings.length} findings could not be confirmed.`,
        },
      ],
    };
  }

  private generateLongitudinalChapter(historian: HistorianFindings): ReportChapter {
    return {
      title: 'Longitudinal Analysis',
      sections: [
        {
          heading: 'Relationship Trajectory',
          type: 'text',
          content: {
            trajectory: historian.trajectory.overall,
            confidence: historian.trajectory.confidence,
            description: historian.trajectory.description,
            phases: historian.trajectory.phases,
          },
        },
        {
          heading: 'Recurring Themes',
          type: 'list',
          content: historian.recurring_themes,
        },
        {
          heading: 'Turning Points',
          type: 'list',
          content: historian.turning_points,
        },
      ],
    };
  }

  private generateActionGuide(findings: MRIFindings): ReportChapter {
    return {
      title: 'Action Guide',
      sections: [
        {
          heading: 'Key Takeaways',
          type: 'list',
          content: this.generateKeyTakeaways(findings),
        },
        {
          heading: 'Communication Strategies',
          type: 'list',
          content: this.generateStrategies(findings),
        },
        {
          heading: 'When to Seek Professional Help',
          type: 'text',
          content: 'If this report identifies patterns consistent with emotional abuse, manipulation, or if you feel unsafe, please seek professional help. This analysis is not a substitute for therapy or counseling.',
        },
        {
          heading: 'Resources',
          type: 'list',
          content: [
            'National DV Hotline: 1-800-799-7233',
            'Crisis Text Line: Text HOME to 741741',
            'Psychology Today Therapist Finder: psychologytoday.com/us/therapists',
            'BetterHelp Online Therapy: betterhelp.com',
          ],
        },
        {
          heading: 'Disclaimer',
          type: 'text',
          content: 'This analysis identifies patterns consistent with established relationship research frameworks. It is not a clinical diagnosis. The findings reflect communication patterns observed in the data provided and should be discussed with a qualified professional for personalized guidance.',
        },
      ],
    };
  }

  private generateKeyTakeaways(findings: MRIFindings): string[] {
    const takeaways: string[] = [];

    if (findings.clinician.overall_health_score < 40) {
      takeaways.push('The communication patterns show significant signs of distress. Professional support is strongly recommended.');
    }
    if (findings.clinician.contempt.count > 0) {
      takeaways.push('Contempt was detected in the communication. Research shows contempt is the strongest predictor of relationship dissolution.');
    }
    if (findings.clinician.repair_attempts.success_rate < 30) {
      takeaways.push('Repair attempts are largely unsuccessful, which indicates difficulty recovering from conflict.');
    }

    const dominantPatterns = findings.pattern_matcher.patterns.filter(p => p.detected && p.confidence >= 75);
    for (const pattern of dominantPatterns.slice(0, 3)) {
      takeaways.push(`Pattern detected: ${pattern.name} (${pattern.confidence}% confidence) - ${pattern.evidence}`);
    }

    if (findings.historian.trajectory.overall === 'declining') {
      takeaways.push('The relationship trajectory appears to be declining over time based on communication analysis.');
    }

    if (takeaways.length === 0) {
      takeaways.push('No critical patterns were detected with high confidence. Continue monitoring communication health.');
    }

    return takeaways;
  }

  private generateStrategies(findings: MRIFindings): string[] {
    const strategies: string[] = [];

    if (findings.clinician.criticism.count > 0) {
      strategies.push('Replace criticism with "I" statements: Instead of "You always...", try "I feel... when..."');
    }
    if (findings.clinician.defensiveness.count > 0) {
      strategies.push('Practice taking responsibility: Instead of defending, acknowledge your part even if small');
    }
    if (findings.clinician.stonewalling.count > 0) {
      strategies.push('Request timeouts instead of shutting down: "I need 20 minutes to calm down, then let\'s talk"');
    }

    const demandWithdraw = findings.pattern_matcher.patterns.find(p => p.name === 'demand_withdraw' && p.detected);
    if (demandWithdraw) {
      strategies.push('The pursue-withdraw cycle can be broken by the pursuer giving space and the withdrawer committing to re-engage at a specific time');
    }

    strategies.push('Consider couples therapy or individual therapy to address these patterns with professional guidance');

    return strategies;
  }

  private formatRedFlagType(type: string): string {
    return type
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  }
}
