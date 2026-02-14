import { ParsedMessage } from './ingestion';

export interface TimelineMessage extends ParsedMessage {
  index: number;
  datetime: Date | null;
}

export interface Timeline {
  messages: TimelineMessage[];
  total_count: number;
  date_range: {
    start: string | null;
    end: string | null;
  };
  gaps: Array<{
    after_index: number;
    duration_hours: number;
    start: string;
    end: string;
  }>;
  senders: string[];
  stats: {
    messages_per_sender: Record<string, number>;
    avg_message_length: Record<string, number>;
    total_duration_days: number;
  };
}

export class TimelineStitcher {
  stitch(messages: ParsedMessage[]): Timeline {
    // Step 1: Parse timestamps and assign indices
    const timelineMessages: TimelineMessage[] = messages.map((msg, index) => ({
      ...msg,
      index,
      datetime: this.parseTimestamp(msg.timestamp),
    }));

    // Step 2: Sort by timestamp (messages without timestamp go to end)
    const sorted = timelineMessages.sort((a, b) => {
      if (a.datetime && b.datetime) return a.datetime.getTime() - b.datetime.getTime();
      if (a.datetime) return -1;
      if (b.datetime) return 1;
      return a.index - b.index; // preserve original order
    });

    // Re-index after sorting
    sorted.forEach((msg, i) => { msg.index = i; });

    // Step 3: Deduplicate (same content within 5 min window)
    const deduplicated = this.deduplicateMessages(sorted);

    // Step 4: Detect gaps (>48 hour silence)
    const gaps = this.detectGaps(deduplicated);

    // Step 5: Calculate stats
    const senders = [...new Set(deduplicated.filter(m => m.sender).map(m => m.sender!))];
    const stats = this.calculateStats(deduplicated, senders);

    // Step 6: Calculate date range
    const datedMessages = deduplicated.filter(m => m.datetime);
    const dateRange = {
      start: datedMessages.length > 0 ? datedMessages[0].datetime!.toISOString() : null,
      end: datedMessages.length > 0 ? datedMessages[datedMessages.length - 1].datetime!.toISOString() : null,
    };

    return {
      messages: deduplicated,
      total_count: deduplicated.length,
      date_range: dateRange,
      gaps,
      senders,
      stats,
    };
  }

  private parseTimestamp(timestamp: string | null): Date | null {
    if (!timestamp) return null;

    // Try ISO format
    const isoDate = new Date(timestamp);
    if (!isNaN(isoDate.getTime())) return isoDate;

    // Try common formats
    const formats = [
      // WhatsApp: 3/15/24, 2:30:15 PM
      /^(\d{1,2})\/(\d{1,2})\/(\d{2,4}),?\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([AP]M)?$/i,
      // US date: Mar 15, 2024 at 2:30 PM
      /^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})\s+(?:at\s+)?(\d{1,2}):(\d{2})\s*([AP]M)?$/i,
    ];

    for (const fmt of formats) {
      const match = timestamp.match(fmt);
      if (match) {
        try {
          const d = new Date(timestamp.replace(' at ', ' '));
          if (!isNaN(d.getTime())) return d;
        } catch {
          // continue
        }
      }
    }

    // Last resort: try Date constructor
    try {
      const d = new Date(timestamp);
      if (!isNaN(d.getTime()) && d.getFullYear() > 2000) return d;
    } catch {
      // ignore
    }

    return null;
  }

  private deduplicateMessages(messages: TimelineMessage[]): TimelineMessage[] {
    const result: TimelineMessage[] = [];
    const seen = new Map<string, number>(); // content hash -> index

    for (const msg of messages) {
      const key = msg.content.trim().substring(0, 100);
      const lastSeen = seen.get(key);

      if (lastSeen !== undefined) {
        // Check if within 5-minute window
        const prev = result[lastSeen];
        if (prev.datetime && msg.datetime) {
          const diff = Math.abs(msg.datetime.getTime() - prev.datetime.getTime());
          if (diff < 5 * 60 * 1000) continue; // Skip duplicate
        }
      }

      seen.set(key, result.length);
      result.push(msg);
    }

    // Re-index
    result.forEach((msg, i) => { msg.index = i; });
    return result;
  }

  private detectGaps(messages: TimelineMessage[]): Timeline['gaps'] {
    const gaps: Timeline['gaps'] = [];
    const SILENCE_THRESHOLD = 48 * 60 * 60 * 1000; // 48 hours in ms

    for (let i = 0; i < messages.length - 1; i++) {
      const current = messages[i];
      const next = messages[i + 1];

      if (current.datetime && next.datetime) {
        const diff = next.datetime.getTime() - current.datetime.getTime();
        if (diff > SILENCE_THRESHOLD) {
          gaps.push({
            after_index: i,
            duration_hours: diff / (60 * 60 * 1000),
            start: current.datetime.toISOString(),
            end: next.datetime.toISOString(),
          });
        }
      }
    }

    return gaps;
  }

  private calculateStats(messages: TimelineMessage[], senders: string[]) {
    const messagesPerSender: Record<string, number> = {};
    const totalCharsPerSender: Record<string, number> = {};

    for (const msg of messages) {
      const sender = msg.sender || 'Unknown';
      messagesPerSender[sender] = (messagesPerSender[sender] || 0) + 1;
      totalCharsPerSender[sender] = (totalCharsPerSender[sender] || 0) + msg.content.length;
    }

    const avgMessageLength: Record<string, number> = {};
    for (const sender of Object.keys(messagesPerSender)) {
      avgMessageLength[sender] = Math.round(totalCharsPerSender[sender] / messagesPerSender[sender]);
    }

    // Total duration
    const dated = messages.filter(m => m.datetime);
    let totalDurationDays = 0;
    if (dated.length >= 2) {
      const first = dated[0].datetime!.getTime();
      const last = dated[dated.length - 1].datetime!.getTime();
      totalDurationDays = (last - first) / (24 * 60 * 60 * 1000);
    }

    return {
      messages_per_sender: messagesPerSender,
      avg_message_length: avgMessageLength,
      total_duration_days: Math.round(totalDurationDays * 10) / 10,
    };
  }
}
