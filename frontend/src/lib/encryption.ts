// Client-side encryption using Web Crypto API
// Zero-knowledge: encryption key never leaves the browser

export class EncryptionManager {
  private sessionKey: CryptoKey | null = null;

  async generateSessionKey(): Promise<CryptoKey> {
    this.sessionKey = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
    return this.sessionKey;
  }

  async encryptIdentityMap(identityMap: Record<string, string>): Promise<{ iv: number[]; ciphertext: number[] }> {
    if (!this.sessionKey) throw new Error('Session key not generated');

    const plaintext = JSON.stringify(identityMap);
    const data = new TextEncoder().encode(plaintext);
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      this.sessionKey,
      data
    );

    return {
      iv: Array.from(iv),
      ciphertext: Array.from(new Uint8Array(ciphertext)),
    };
  }

  async decryptIdentityMap(encryptedData: { iv: number[]; ciphertext: number[] }): Promise<Record<string, string>> {
    if (!this.sessionKey) {
      await this.retrieveKeyFromStorage();
    }
    if (!this.sessionKey) throw new Error('Encryption key not available');

    const iv = new Uint8Array(encryptedData.iv);
    const ciphertext = new Uint8Array(encryptedData.ciphertext);

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      this.sessionKey,
      ciphertext
    );

    const plaintext = new TextDecoder().decode(decrypted);
    return JSON.parse(plaintext);
  }

  async storeKeyLocally(caseId: string): Promise<void> {
    if (!this.sessionKey) throw new Error('No key to store');

    const exported = await crypto.subtle.exportKey('jwk', this.sessionKey);
    const db = await this.openDB();
    const tx = db.transaction('keys', 'readwrite');
    const store = tx.objectStore('keys');
    store.put({ id: `session-key-${caseId}`, key: exported });
  }

  async retrieveKeyFromStorage(caseId?: string): Promise<CryptoKey | null> {
    try {
      const db = await this.openDB();
      const tx = db.transaction('keys', 'readonly');
      const store = tx.objectStore('keys');
      const keyId = caseId ? `session-key-${caseId}` : 'session-key-latest';

      return new Promise((resolve) => {
        const request = store.get(keyId);
        request.onsuccess = async () => {
          if (!request.result) { resolve(null); return; }
          this.sessionKey = await crypto.subtle.importKey(
            'jwk',
            request.result.key,
            { name: 'AES-GCM', length: 256 },
            true,
            ['encrypt', 'decrypt']
          );
          resolve(this.sessionKey);
        };
        request.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  }

  private openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('SubtextDB', 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('keys')) {
          db.createObjectStore('keys', { keyPath: 'id' });
        }
      };
    });
  }
}

// Client-side PII detection with name extraction from chat headers
export class PIIDetector {
  private entityMap: Map<string, string> = new Map();
  private counters: Record<string, number> = { Person: 0, Phone: 0, Email: 0, SSN: 0, Address: 0 };
  private detectedNames: Set<string> = new Set();

  detectAndMask(text: string): { maskedText: string; identityMap: Record<string, string> } {
    let maskedText = text;

    // Step 1: Extract sender names from chat message headers (WhatsApp / iMessage / generic)
    // WhatsApp format: "1/15/24, 10:30 AM - John Smith: Hello"
    const whatsappNameRegex = /^\d{1,2}\/\d{1,2}\/\d{2,4},\s+\d{1,2}:\d{2}(?:\s*[AP]M)?\s*-\s*([^:]+):/gm;
    let nameMatch;
    while ((nameMatch = whatsappNameRegex.exec(text)) !== null) {
      const name = nameMatch[1].trim();
      if (name && name.length > 1 && name.length < 60) {
        this.detectedNames.add(name);
      }
    }

    // iMessage format: "From: Jane Doe" or "[2024-01-15] Jane Doe:"
    const imessageNameRegex = /\[[\d\-\/\s:APMapm]+\]\s+([A-Z][a-z]+(?:\s[A-Z][a-z]+)+):/gm;
    while ((nameMatch = imessageNameRegex.exec(text)) !== null) {
      const name = nameMatch[1].trim();
      if (name && name.length > 1 && name.length < 60) {
        this.detectedNames.add(name);
      }
    }

    // Generic chat format: "Name: message" at line start
    const genericNameRegex = /^([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+){0,2}):\s/gm;
    while ((nameMatch = genericNameRegex.exec(text)) !== null) {
      const name = nameMatch[1].trim();
      // Filter out common false positives
      const skipWords = new Set(['From', 'To', 'Subject', 'Date', 'Time', 'Note', 'Warning', 'Error', 'Info', 'Reply', 'Message', 'Chat', 'Group']);
      if (name && name.length > 1 && name.length < 40 && !skipWords.has(name)) {
        this.detectedNames.add(name);
      }
    }

    // Step 2: Replace detected names throughout the text (longest first to avoid partial matches)
    const sortedNames = Array.from(this.detectedNames).sort((a, b) => b.length - a.length);
    for (const name of sortedNames) {
      const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const nameRegex = new RegExp(`\\b${escapedName}\\b`, 'g');
      maskedText = maskedText.replace(nameRegex, (match) => this.getOrCreateToken(match, 'Person'));
    }

    // Step 3: Detect emails
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    maskedText = maskedText.replace(emailRegex, (match) => this.getOrCreateToken(match, 'Email'));

    // Step 4: Detect phone numbers (US and international formats)
    const phoneRegex = /\b(?:\+\d{1,3}[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}\b/g;
    maskedText = maskedText.replace(phoneRegex, (match) => this.getOrCreateToken(match, 'Phone'));

    // Step 5: Detect SSN patterns
    const ssnRegex = /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g;
    maskedText = maskedText.replace(ssnRegex, (match) => this.getOrCreateToken(match, 'SSN'));

    // Step 6: Detect street addresses (basic pattern)
    const addressRegex = /\b\d{1,5}\s+(?:[A-Z][a-z]+\s){1,3}(?:St|Street|Ave|Avenue|Rd|Road|Dr|Drive|Blvd|Boulevard|Ln|Lane|Ct|Court|Way|Pl|Place)\.?\b/gi;
    maskedText = maskedText.replace(addressRegex, (match) => this.getOrCreateToken(match, 'Address'));

    // Build reverse map (token -> original)
    const identityMap: Record<string, string> = {};
    for (const [original, token] of this.entityMap) {
      identityMap[token] = original;
    }

    return { maskedText, identityMap };
  }

  getDetectedNames(): string[] {
    return Array.from(this.detectedNames);
  }

  private getOrCreateToken(original: string, type: string): string {
    const existing = this.entityMap.get(original);
    if (existing) return existing;

    this.counters[type] = (this.counters[type] || 0) + 1;
    const token = `[${type} ${this.counters[type]}]`;
    this.entityMap.set(original, token);
    return token;
  }
}

// Singleton instances for use across components
export const encryptionManager = new EncryptionManager();
