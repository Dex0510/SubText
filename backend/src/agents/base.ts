import { TimelineMessage } from '../services/timeline';

export interface AgentFindings {
  agent_name: string;
  findings: unknown;
  confidence: number;
  processing_time_ms: number;
}

export function formatMessagesForLLM(messages: TimelineMessage[], limit: number = 40000): string {
  const formatted: string[] = [];
  let totalChars = 0;

  for (const msg of messages) {
    const timestamp = msg.datetime
      ? msg.datetime.toISOString().replace('T', ' ').substring(0, 19)
      : 'Unknown time';
    const sender = msg.sender || 'Unknown';
    const line = `[${msg.index}] ${timestamp} - ${sender}: ${msg.content}`;

    totalChars += line.length;
    if (totalChars > limit) break;

    formatted.push(line);
  }

  return formatted.join('\n');
}

export function extractMessagesInRange(messages: TimelineMessage[], start: number, end: number): TimelineMessage[] {
  return messages.filter(m => m.index >= start && m.index <= end);
}
