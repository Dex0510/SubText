export interface ParsedMessage {
  source: string;
  content: string;
  timestamp: string | null;
  sender: string | null;
  metadata: Record<string, unknown>;
}

export class IngestionService {
  async processFiles(files: Array<{ filename: string; mimetype: string; buffer: string }>): Promise<ParsedMessage[]> {
    const messages: ParsedMessage[] = [];

    for (const file of files) {
      const buffer = Buffer.from(file.buffer, 'base64');

      if (file.mimetype.startsWith('image/')) {
        const extracted = await this.extractFromImage(buffer, file.filename);
        messages.push(...extracted);
      } else if (file.mimetype === 'text/plain' || file.mimetype === 'text/csv') {
        const text = buffer.toString('utf-8');
        const extracted = this.parseTextExport(text, file.filename);
        messages.push(...extracted);
      } else if (file.mimetype === 'application/json') {
        const text = buffer.toString('utf-8');
        const extracted = this.parseJsonExport(text, file.filename);
        messages.push(...extracted);
      } else if (file.mimetype === 'application/zip' || file.filename.endsWith('.zip')) {
        const extracted = await this.extractFromZip(buffer, file.filename);
        messages.push(...extracted);
      }
    }

    return messages;
  }

  async extractFromZip(buffer: Buffer, filename: string): Promise<ParsedMessage[]> {
    try {
      // Use Node.js built-in zlib for basic zip extraction
      const AdmZip = (await import('adm-zip')).default;
      const zip = new AdmZip(buffer);
      const entries = zip.getEntries();
      const innerFiles: Array<{ filename: string; mimetype: string; buffer: string }> = [];

      for (const entry of entries) {
        if (entry.isDirectory) continue;
        const name = entry.entryName;
        const data = entry.getData();

        let mimetype = 'application/octet-stream';
        if (name.endsWith('.txt') || name.endsWith('.csv')) mimetype = 'text/plain';
        else if (name.endsWith('.json')) mimetype = 'application/json';
        else if (name.match(/\.(png|jpg|jpeg|heic)$/i)) mimetype = 'image/' + name.split('.').pop()?.toLowerCase();

        innerFiles.push({
          filename: name,
          mimetype,
          buffer: data.toString('base64'),
        });
      }

      // Recursively process extracted files
      return this.processFiles(innerFiles);
    } catch (err) {
      console.error(`ZIP extraction error for ${filename}:`, err);
      return [{
        source: filename,
        content: '[ZIP file could not be extracted]',
        timestamp: null,
        sender: null,
        metadata: { error: 'zip_extraction_failed' },
      }];
    }
  }

  async extractFromImage(buffer: Buffer, filename: string): Promise<ParsedMessage[]> {
    // Use Tesseract.js for server-side OCR
    try {
      const Tesseract = await import('tesseract.js');
      const worker = await Tesseract.createWorker('eng');
      const { data: { text } } = await worker.recognize(buffer);
      await worker.terminate();

      if (!text.trim()) {
        return [{
          source: filename,
          content: '[Image with no extractable text]',
          timestamp: null,
          sender: null,
          metadata: { type: 'image', ocr_failed: true },
        }];
      }

      // Try to parse chat messages from OCR text
      const chatMessages = this.parseOcrChatText(text, filename);
      if (chatMessages.length > 0) return chatMessages;

      return [{
        source: filename,
        content: text.trim(),
        timestamp: null,
        sender: null,
        metadata: { type: 'image_ocr' },
      }];
    } catch (err) {
      console.error('OCR error:', err);
      return [{
        source: filename,
        content: '[OCR extraction failed]',
        timestamp: null,
        sender: null,
        metadata: { type: 'image', ocr_error: true },
      }];
    }
  }

  parseOcrChatText(text: string, source: string): ParsedMessage[] {
    const messages: ParsedMessage[] = [];
    // Try common chat screenshot patterns
    const lines = text.split('\n').filter(l => l.trim());

    for (const line of lines) {
      // Pattern: "HH:MM" or "H:MM AM/PM" followed by text
      const timeMatch = line.match(/^(\d{1,2}:\d{2}(?:\s*[AP]M)?)\s+(.+)/i);
      if (timeMatch) {
        messages.push({
          source,
          content: timeMatch[2].trim(),
          timestamp: timeMatch[1],
          sender: null,
          metadata: { type: 'ocr_chat' },
        });
      }
    }

    return messages;
  }

  parseTextExport(text: string, source: string): ParsedMessage[] {
    // Try WhatsApp format
    const whatsappMessages = this.parseWhatsApp(text, source);
    if (whatsappMessages.length > 0) return whatsappMessages;

    // Try iMessage format
    const imessageMessages = this.parseIMessage(text, source);
    if (imessageMessages.length > 0) return imessageMessages;

    // Try generic timestamp format
    const genericMessages = this.parseGenericTimestamped(text, source);
    if (genericMessages.length > 0) return genericMessages;

    // Fallback: split by newlines and treat each as a message
    return text
      .split('\n')
      .filter(line => line.trim().length > 0)
      .map(line => ({
        source,
        content: line.trim(),
        timestamp: null,
        sender: null,
        metadata: { type: 'text_line' },
      }));
  }

  parseWhatsApp(text: string, source: string): ParsedMessage[] {
    const messages: ParsedMessage[] = [];
    // WhatsApp format: [M/D/YY, H:MM:SS AM] Sender: Message
    // or: M/D/YY, H:MM - Sender: Message
    const patterns = [
      /\[(\d{1,2}\/\d{1,2}\/\d{2,4},?\s+\d{1,2}:\d{2}(?::\d{2})?\s*(?:[AP]M)?)\]\s+([^:]+):\s+([\s\S]*?)(?=\[\d{1,2}\/|$)/g,
      /(\d{1,2}\/\d{1,2}\/\d{2,4},?\s+\d{1,2}:\d{2}(?:\s*[AP]M)?)\s+-\s+([^:]+):\s+([\s\S]*?)(?=\d{1,2}\/\d{1,2}\/|$)/g,
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        messages.push({
          source,
          content: match[3].trim(),
          timestamp: match[1].trim(),
          sender: match[2].trim(),
          metadata: { type: 'whatsapp' },
        });
      }
      if (messages.length > 0) break;
    }

    return messages;
  }

  parseIMessage(text: string, source: string): ParsedMessage[] {
    const messages: ParsedMessage[] = [];
    // iMessage: "Mar 15, 2024 at 2:30 PM - John: Hey"
    const pattern = /([A-Za-z]{3}\s+\d{1,2},\s+\d{4}\s+at\s+\d{1,2}:\d{2}\s+[AP]M)\s+-\s+([^:]+):\s+(.+)/g;

    let match;
    while ((match = pattern.exec(text)) !== null) {
      messages.push({
        source,
        content: match[3].trim(),
        timestamp: match[1].trim(),
        sender: match[2].trim(),
        metadata: { type: 'imessage' },
      });
    }

    return messages;
  }

  parseGenericTimestamped(text: string, source: string): ParsedMessage[] {
    const messages: ParsedMessage[] = [];
    // Generic: "2024-03-15 14:30:00 - Sender: Message"
    const pattern = /(\d{4}-\d{2}-\d{2}[\sT]\d{2}:\d{2}(?::\d{2})?)\s*[-–]\s*([^:]+):\s+(.+)/g;

    let match;
    while ((match = pattern.exec(text)) !== null) {
      messages.push({
        source,
        content: match[3].trim(),
        timestamp: match[1].trim(),
        sender: match[2].trim(),
        metadata: { type: 'generic' },
      });
    }

    return messages;
  }

  parseJsonExport(text: string, source: string): ParsedMessage[] {
    try {
      const data = JSON.parse(text);
      if (Array.isArray(data)) {
        return data.map((item: Record<string, unknown>) => ({
          source,
          content: String(item.content || item.message || item.text || ''),
          timestamp: String(item.timestamp || item.date || item.time || ''),
          sender: String(item.sender || item.from || item.author || ''),
          metadata: { type: 'json' },
        }));
      }
    } catch {
      // Not valid JSON
    }
    return [];
  }
}
