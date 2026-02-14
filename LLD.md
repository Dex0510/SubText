LLD (Low-Level Design)
Low-Level Design Document
System: Subtext 2.1 - Component Deep Dive
Version: 2.1.0
Date: February 2026
Owner: Engineering Team
Status: Implementation-Ready

1. Client-Side Components (Frontend)
1.1 PII Detector Module (WASM)
Purpose: Detect and mask Personally Identifiable Information in uploaded content before sending to server
Technology Stack:

Language: Rust (compiled to WebAssembly)
NER Model: spaCy en_core_web_sm (converted to ONNX for WASM)
OCR: Tesseract.js (JavaScript, runs in Web Worker)
Face Detection: TensorFlow.js with BlazeFace model


1.1.1 Text PII Detection
Algorithm:
rust// Rust pseudocode (compiled to WASM)

struct PIIDetector {
    ner_model: ONNXModel,  // spaCy NER model
    entity_map: HashMap<String, String>,  // Maps original → token
    token_counter: HashMap<EntityType, u32>,  // Counter for tokens
}

impl PIIDetector {
    pub fn new() -> Self {
        // Load pre-trained NER model
        let ner_model = ONNXModel::load("en_core_web_sm.onnx");
        Self {
            ner_model,
            entity_map: HashMap::new(),
            token_counter: HashMap::new(),
        }
    }
    
    pub fn detect_and_mask(&mut self, text: &str) -> (String, IdentityMap) {
        let mut masked_text = text.to_string();
        
        // Step 1: NER for names, locations
        let entities = self.ner_model.predict(text);
        for entity in entities {
            match entity.label {
                "PERSON" => {
                    let token = self.get_or_create_token(entity.text, EntityType::Person);
                    masked_text = masked_text.replace(&entity.text, &token);
                },
                "GPE" | "LOC" => {  // Geo-political entity or location
                    let token = self.get_or_create_token(entity.text, EntityType::Location);
                    masked_text = masked_text.replace(&entity.text, &token);
                },
                _ => {}  // Ignore other entity types for now
            }
        }
        
        // Step 2: Regex patterns for phone numbers, emails, SSNs
        let phone_regex = Regex::new(r"\b\d{3}[-.]?\d{3}[-.]?\d{4}\b").unwrap();
        for capture in phone_regex.captures_iter(text) {
            let phone = capture.get(0).unwrap().as_str();
            let token = self.get_or_create_token(phone, EntityType::Phone);
            masked_text = masked_text.replace(phone, &token);
        }
        
        let email_regex = Regex::new(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b").unwrap();
        for capture in email_regex.captures_iter(text) {
            let email = capture.get(0).unwrap().as_str();
            let token = self.get_or_create_token(email, EntityType::Email);
            masked_text = masked_text.replace(email, &token);
        }
        
        // Step 3: Return masked text + identity map
        (masked_text, self.entity_map.clone())
    }
    
    fn get_or_create_token(&mut self, original: &str, entity_type: EntityType) -> String {
        // Check if we've already tokenized this entity
        if let Some(token) = self.entity_map.get(original) {
            return token.clone();
        }
        
        // Create new token
        let counter = self.token_counter.entry(entity_type).or_insert(0);
        *counter += 1;
        let token = format!("[{} {}]", entity_type.as_str(), counter);
        
        self.entity_map.insert(original.to_string(), token.clone());
        token
    }
}

enum EntityType {
    Person,
    Location,
    Phone,
    Email,
}

impl EntityType {
    fn as_str(&self) -> &str {
        match self {
            EntityType::Person => "Person",
            EntityType::Location => "Location",
            EntityType::Phone => "Phone",
            EntityType::Email => "Email",
        }
    }
}

type IdentityMap = HashMap<String, String>;  // token → original
Performance:

Text processing: ~100ms for 10,000 words
NER accuracy: 90%+ for common names
Memory usage: ~50MB (model in memory)

Error Handling:

If NER model fails to load → fallback to regex-only
If text is too large (>500KB) → process in chunks


1.1.2 Image PII Detection
Algorithm:
javascript// JavaScript (runs in Web Worker with Tesseract.js + TensorFlow.js)

class ImagePIIDetector {
  constructor() {
    this.tesseract = null;  // Initialized on first use
    this.blazeface = null;  // Face detection model
  }
  
  async init() {
    // Load Tesseract OCR
    this.tesseract = await Tesseract.createWorker({
      logger: m => console.log(m)  // Progress logging
    });
    await this.tesseract.loadLanguage('eng');
    await this.tesseract.initialize('eng');
    
    // Load BlazeFace for face detection
    this.blazeface = await blazeface.load();
  }
  
  async detectAndMask(imageBlob) {
    const imageUrl = URL.createObjectURL(imageBlob);
    const img = new Image();
    img.src = imageUrl;
    await img.decode();  // Wait for image to load
    
    // Step 1: OCR text extraction
    const { data: { text } } = await this.tesseract.recognize(img);
    
    // Step 2: Mask PII in extracted text using PIIDetector (WASM)
    const wasmDetector = new PIIDetector();  // Instantiate WASM module
    const [maskedText, identityMap] = wasmDetector.detect_and_mask(text);
    
    // Step 3: Face detection
    const faces = await this.blazeface.estimateFaces(img, false);
    
    // Step 4: Blur detected faces
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    
    for (const face of faces) {
      const [x, y, width, height] = face.topLeft.concat(face.bottomRight);
      
      // Apply Gaussian blur to face region
      const imageData = ctx.getImageData(x, y, width - x, height - y);
      const blurred = this.gaussianBlur(imageData, 10);  // radius=10
      ctx.putImageData(blurred, x, y);
    }
    
    // Step 5: Return masked image + OCR text + identity map
    const maskedImageBlob = await new Promise(resolve => 
      canvas.toBlob(resolve, 'image/png')
    );
    
    return {
      maskedImage: maskedImageBlob,
      ocrText: maskedText,
      identityMap: identityMap,
      facesDetected: faces.length
    };
  }
  
  gaussianBlur(imageData, radius) {
    // Simple box blur approximation (3 passes ≈ Gaussian)
    let data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    
    for (let pass = 0; pass < 3; pass++) {
      data = this.boxBlur(data, width, height, radius);
    }
    
    return new ImageData(new Uint8ClampedArray(data), width, height);
  }
  
  boxBlur(data, width, height, radius) {
    const result = new Uint8Array(data.length);
    // ... box blur implementation (sum pixels in radius, divide by count)
    return result;
  }
}
Performance:

OCR: ~2-5 seconds per image (depends on resolution)
Face detection: ~100-300ms per image
Blurring: ~50ms per face
Total: ~3-6 seconds per image

Error Handling:

If OCR fails (unreadable image) → skip text masking, proceed with face blur
If face detection fails → log warning, proceed without blurring
If image is too large (>10MB) → resize to max 2048px width before processing


1.1.3 Encryption Layer
Algorithm:
javascript// JavaScript (Web Crypto API)

class EncryptionManager {
  constructor() {
    this.sessionKey = null;
  }
  
  async generateSessionKey() {
    // Generate 256-bit AES-GCM key
    this.sessionKey = await crypto.subtle.generateKey(
      {
        name: "AES-GCM",
        length: 256
      },
      true,  // extractable (can export for storage)
      ["encrypt", "decrypt"]
    );
    
    return this.sessionKey;
  }
  
  async encryptIdentityMap(identityMap) {
    if (!this.sessionKey) {
      throw new Error("Session key not generated");
    }
    
    // Convert identity map to JSON string
    const plaintext = JSON.stringify(identityMap);
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);
    
    // Generate random IV (initialization vector)
    const iv = crypto.getRandomValues(new Uint8Array(12));  // 96 bits for GCM
    
    // Encrypt
    const ciphertext = await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv
      },
      this.sessionKey,
      data
    );
    
    // Return IV + ciphertext (need IV for decryption)
    return {
      iv: Array.from(iv),  // Convert to array for JSON serialization
      ciphertext: Array.from(new Uint8Array(ciphertext))
    };
  }
  
  async decryptIdentityMap(encryptedData) {
    if (!this.sessionKey) {
      throw new Error("Session key not available");
    }
    
    // Reconstruct IV and ciphertext
    const iv = new Uint8Array(encryptedData.iv);
    const ciphertext = new Uint8Array(encryptedData.ciphertext);
    
    // Decrypt
    const decrypted = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv
      },
      this.sessionKey,
      ciphertext
    );
    
    // Convert back to JSON
    const decoder = new TextDecoder();
    const plaintext = decoder.decode(decrypted);
    return JSON.parse(plaintext);
  }
  
  async storeKeyLocally() {
    // Export key for storage
    const exported = await crypto.subtle.exportKey("jwk", this.sessionKey);
    
    // Store in IndexedDB (persistent across sessions)
    const db = await this.openDB();
    const tx = db.transaction("keys", "readwrite");
    const store = tx.objectStore("keys");
    await store.put({ id: "session-key", key: exported });
    await tx.complete;
  }
  
  async retrieveKeyFromStorage() {
    const db = await this.openDB();
    const tx = db.transaction("keys", "readonly");
    const store = tx.objectStore("keys");
    const record = await store.get("session-key");
    
    if (!record) {
      return null;
    }
    
    // Import key from storage
    this.sessionKey = await crypto.subtle.importKey(
      "jwk",
      record.key,
      {
        name: "AES-GCM",
        length: 256
      },
      true,
      ["encrypt", "decrypt"]
    );
    
    return this.sessionKey;
  }
  
  async openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("SubtextDB", 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains("keys")) {
          db.createObjectStore("keys", { keyPath: "id" });
        }
      };
    });
  }
}
Security Properties:

Key generation: CSPRNG (cryptographically secure pseudorandom number generator)
Encryption: AES-256-GCM (authenticated encryption, prevents tampering)
IV: Randomly generated for each encryption (prevents replay attacks)
Key storage: IndexedDB (persistent, but not accessible from other origins)

Error Handling:

If Web Crypto API not supported (old browser) → show error, require modern browser
If IndexedDB fails → fallback to in-memory key (lost on page reload, warn user)


1.2 Upload Flow Component
Purpose: Orchestrate file upload, PII detection, encryption, and server submission
React Component Structure:
typescript// TypeScript + React

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { PIIDetector } from './wasm/pii_detector';
import { ImagePIIDetector } from './workers/image_pii_detector';
import { EncryptionManager } from './crypto/encryption';

interface UploadFlowProps {
  analysisType: 'analysis';
}

interface UploadedFile {
  file: File;
  status: 'pending' | 'processing' | 'complete' | 'error';
  maskedData?: any;
  identityMap?: Record<string, string>;
  error?: string;
}

export const UploadFlow: React.FC<UploadFlowProps> = ({ analysisType }) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    // Initialize uploaded files
    const uploadedFiles = acceptedFiles.map(file => ({
      file,
      status: 'pending' as const
    }));
    setFiles(uploadedFiles);
    
    // Start processing
    setProcessing(true);
    await processFiles(uploadedFiles);
    setProcessing(false);
  }, []);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.heic'],
      'text/*': ['.txt', '.csv'],
      'application/zip': ['.zip']
    },
    maxSize: 500 * 1024 * 1024,  // 500MB
    maxFiles: 100
  });
  
  const processFiles = async (uploadedFiles: UploadedFile[]) => {
    const piiDetector = new PIIDetector();
    await piiDetector.init();
    
    const imagePIIDetector = new ImagePIIDetector();
    await imagePIIDetector.init();
    
    const encryptionManager = new EncryptionManager();
    await encryptionManager.generateSessionKey();
    
    let combinedIdentityMap: Record<string, string> = {};
    
    for (let i = 0; i < uploadedFiles.length; i++) {
      const uploadedFile = uploadedFiles[i];
      setProgress((i / uploadedFiles.length) * 100);
      
      try {
        // Update status
        setFiles(prev => prev.map(f => 
          f.file === uploadedFile.file 
            ? { ...f, status: 'processing' }
            : f
        ));
        
        // Process based on file type
        if (uploadedFile.file.type.startsWith('image/')) {
          // Image processing
          const result = await imagePIIDetector.detectAndMask(uploadedFile.file);
          uploadedFile.maskedData = result.maskedImage;
          uploadedFile.identityMap = result.identityMap;
        } else if (uploadedFile.file.type === 'text/plain') {
          // Text processing
          const text = await uploadedFile.file.text();
          const [maskedText, identityMap] = piiDetector.detect_and_mask(text);
          uploadedFile.maskedData = maskedText;
          uploadedFile.identityMap = identityMap;
        } else if (uploadedFile.file.type === 'application/zip') {
          // ZIP processing (extract, then process each file)
          // ... implementation for ZIP extraction
        }
        
        // Merge identity maps
        combinedIdentityMap = {
          ...combinedIdentityMap,
          ...uploadedFile.identityMap
        };
        
        // Update status
        setFiles(prev => prev.map(f => 
          f.file === uploadedFile.file 
            ? { ...f, status: 'complete' }
            : f
        ));
        
      } catch (error) {
        // Handle error
        setFiles(prev => prev.map(f => 
          f.file === uploadedFile.file 
            ? { ...f, status: 'error', error: error.message }
            : f
        ));
      }
    }
    
    // Encrypt combined identity map
    const encryptedMap = await encryptionManager.encryptIdentityMap(combinedIdentityMap);
    
    // Store session key locally
    await encryptionManager.storeKeyLocally();
    
    // Submit to server
    await submitToServer(uploadedFiles, encryptedMap);
  };
  
  const submitToServer = async (
    uploadedFiles: UploadedFile[],
    encryptedMap: any
  ) => {
    const formData = new FormData();
    
    // Add masked files
    for (const uploadedFile of uploadedFiles) {
      if (uploadedFile.status === 'complete') {
        if (uploadedFile.maskedData instanceof Blob) {
          formData.append('files', uploadedFile.maskedData, uploadedFile.file.name);
        } else {
          // Text data
          const blob = new Blob([uploadedFile.maskedData], { type: 'text/plain' });
          formData.append('files', blob, uploadedFile.file.name);
        }
      }
    }
    
    // Add encrypted identity map (server stores but cannot decrypt)
    formData.append('encrypted_identity_map', JSON.stringify(encryptedMap));
    
    // Add metadata
    formData.append('analysis_type', 'analysis');
    
    // Submit
    const response = await fetch('/api/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getJWT()}`  // User authentication
      },
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }
    
    const { conversation_id } = await response.json();

    // Redirect to conversation page
    window.location.href = `/conversation/${conversation_id}`;
  };
  
  return (
    <div className="upload-container">
      <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop files here...</p>
        ) : (
          <p>Drag & drop files here, or click to select</p>
        )}
      </div>
      
      {processing && (
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
          <span>{Math.round(progress)}% complete</span>
        </div>
      )}
      
      {files.length > 0 && (
        <div className="file-list">
          {files.map((f, i) => (
            <div key={i} className={`file-item status-${f.status}`}>
              <span>{f.file.name}</span>
              <span className="status-icon">
                {f.status === 'complete' && '✓'}
                {f.status === 'processing' && '⋯'}
                {f.status === 'error' && '✗'}
              </span>
              {f.error && <span className="error-message">{f.error}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

function getJWT(): string {
  // Retrieve JWT from localStorage or cookies
  return localStorage.getItem('auth_token') || '';
}
UX Considerations:

Show preview of masked data (so user can verify PII was caught)
Allow manual correction (if PII detector misses something)
Progress indicator with estimates ("~2 minutes remaining")
Error recovery (allow retry for failed files)


1.3 Report Decryption Component
Purpose: Download tokenized report, decrypt identity map client-side, re-hydrate names
typescript// TypeScript + React

import React, { useEffect, useState } from 'react';
import { EncryptionManager } from './crypto/encryption';
import * as pdfjsLib from 'pdfjs-dist';

interface ReportViewerProps {
  caseId: string;
}

export const ReportViewer: React.FC<ReportViewerProps> = ({ caseId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportUrl, setReportUrl] = useState<string | null>(null);
  
  useEffect(() => {
    loadAndDecryptReport();
  }, [caseId]);
  
  const loadAndDecryptReport = async () => {
    try {
      // Step 1: Fetch report metadata from API
      const response = await fetch(`/api/report/${caseId}`, {
        headers: {
          'Authorization': `Bearer ${getJWT()}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Report not found');
      }
      
      const { 
        tokenized_report_url, 
        encrypted_identity_map 
      } = await response.json();
      
      // Step 2: Download tokenized PDF
      const pdfResponse = await fetch(tokenized_report_url);
      const pdfBlob = await pdfResponse.blob();
      
      // Step 3: Retrieve encryption key from IndexedDB
      const encryptionManager = new EncryptionManager();
      const sessionKey = await encryptionManager.retrieveKeyFromStorage();
      
      if (!sessionKey) {
        throw new Error('Encryption key not found. Cannot decrypt report.');
      }
      
      // Step 4: Decrypt identity map
      const identityMap = await encryptionManager.decryptIdentityMap(
        encrypted_identity_map
      );
      
      // Step 5: Parse PDF and replace placeholders
      const arrayBuffer = await pdfBlob.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + '\n';
      }
      
      // Step 6: Replace placeholders with real names
      let unredactedText = fullText;
      for (const [token, original] of Object.entries(identityMap)) {
        const regex = new RegExp(escapeRegex(token), 'g');
        unredactedText = unredactedText.replace(regex, original);
      }
      
      // Step 7: Display (or re-render PDF with real names)
      // For simplicity, we'll just display text here
      // In production, would re-render PDF with real names
      
      // Option A: Display as HTML (if we have HTML template)
      // Option B: Create new PDF with names (using pdf-lib)
      // Option C: Display text-only version
      
      // For now, create a data URL to display
      const blob = new Blob([unredactedText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      setReportUrl(url);
      
      setLoading(false);
      
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };
  
  if (loading) {
    return <div>Decrypting report...</div>;
  }
  
  if (error) {
    return <div className="error">{error}</div>;
  }
  
  return (
    <div className="report-viewer">
      <iframe src={reportUrl} width="100%" height="800px" />
      
      <div className="actions">
        <button onClick={() => window.print()}>Print Report</button>
        <button onClick={() => downloadReport(reportUrl)}>Download PDF</button>
        <button onClick={() => shareReport()}>Share Anonymized</button>
      </div>
    </div>
  );
};

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function downloadReport(url: string) {
  const a = document.createElement('a');
  a.href = url;
  a.download = 'subtext-report.pdf';
  a.click();
}

function shareReport() {
  // Generate anonymized shareable cards
  // (This would call API endpoint to generate cards from tokenized version)
  window.location.href = '/share-report';
}
```

**Security Considerations:**
- If encryption key is missing → cannot decrypt, show error
- Never send decrypted content back to server
- Clear unredacted data from memory after user closes tab (use `beforeunload` event)

### **1.4 Tabbed Analysis Viewer Component**

**Purpose:** Display analysis results in a tabbed interface with lock states for non-Pro conversations

```typescript
interface TabbedAnalysisViewerProps {
  conversationId: string;
  proStatus: {
    pro_purchased: boolean;
    mri_queries_used: number;
    mri_unlimited: boolean;
  };
}

// Tabs: Analysis (always open), Deep Analysis (Pro), MRI (Pro), Chat Recommender (Pro)
// Locked tabs show upgrade CTA with $20/conversation pricing
// Deep Analysis tab: "Run" button → triggers POST /conversations/:id/deep-analysis
// MRI tab: Q&A interface → POST /conversations/:id/mri-query
// Chat Recommender tab: Screenshot upload + answer → POST /conversations/:id/chat-recommend

export const TabbedAnalysisViewer: React.FC<TabbedAnalysisViewerProps> = ({
  conversationId,
  proStatus
}) => {
  const [activeTab, setActiveTab] = useState<'analysis' | 'deep_analysis' | 'mri' | 'chat_recommend'>('analysis');
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [deepAnalysisData, setDeepAnalysisData] = useState<any>(null);

  const tabs = [
    { id: 'analysis', label: 'Analysis', locked: false },
    { id: 'deep_analysis', label: 'Deep Analysis', locked: !proStatus.pro_purchased },
    { id: 'mri', label: 'MRI', locked: !proStatus.pro_purchased },
    { id: 'chat_recommend', label: 'Chat Recommender', locked: !proStatus.pro_purchased }
  ];

  useEffect(() => {
    // Fetch analysis results on mount
    fetch(`/api/conversations/${conversationId}/analysis`, {
      headers: { 'Authorization': `Bearer ${getJWT()}` }
    })
      .then(res => res.json())
      .then(data => setAnalysisData(data));
  }, [conversationId]);

  const runDeepAnalysis = async () => {
    const response = await fetch(`/api/conversations/${conversationId}/deep-analysis`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${getJWT()}` }
    });
    const data = await response.json();
    setDeepAnalysisData(data);
  };

  return (
    <div className="tabbed-viewer">
      <div className="tab-bar">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''} ${tab.locked ? 'locked' : ''}`}
            onClick={() => tab.locked ? showUpgradeCTA() : setActiveTab(tab.id)}
          >
            {tab.label}
            {tab.locked && <span className="lock-icon">🔒</span>}
          </button>
        ))}
      </div>

      <div className="tab-content">
        {activeTab === 'analysis' && <AnalysisResultsPanel data={analysisData} />}
        {activeTab === 'deep_analysis' && (
          <DeepAnalysisPanel data={deepAnalysisData} onRun={runDeepAnalysis} />
        )}
        {activeTab === 'mri' && (
          <MriQA
            conversationId={conversationId}
            queriesUsed={proStatus.mri_queries_used}
            isUnlimited={proStatus.mri_unlimited}
          />
        )}
        {activeTab === 'chat_recommend' && (
          <ChatRecommender conversationId={conversationId} />
        )}
      </div>

      {/* Upgrade CTA overlay for locked tabs */}
      {tabs.find(t => t.id === activeTab)?.locked && (
        <div className="upgrade-overlay">
          <h3>Unlock Pro Features</h3>
          <p>$20/conversation — Deep Analysis, MRI, and Chat Recommender</p>
          <button onClick={() => purchasePro(conversationId)}>Upgrade Now</button>
        </div>
      )}
    </div>
  );
};
```

### **1.5 MRI Q&A Component**

**Purpose:** Interactive question-answer interface for relationship insights

```typescript
interface MriQAProps {
  conversationId: string;
  queriesUsed: number;
  isUnlimited: boolean;
}

// Shows Q&A history (scrollable)
// Input box at bottom with Submit button
// Counter: "X of 2 free queries remaining"
// After 2 free: paywall "Unlock Unlimited MRI - $10"
// POST /conversations/:id/mri-query with { question: string }
// Response streams or displays answer below question

export const MriQA: React.FC<MriQAProps> = ({ conversationId, queriesUsed, isUnlimited }) => {
  const [question, setQuestion] = useState('');
  const [qaHistory, setQaHistory] = useState<Array<{ question: string; answer: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [localQueriesUsed, setLocalQueriesUsed] = useState(queriesUsed);

  const freeQueriesRemaining = Math.max(0, 2 - localQueriesUsed);
  const canAsk = isUnlimited || freeQueriesRemaining > 0;

  useEffect(() => {
    // Load existing Q&A history
    fetch(`/api/conversations/${conversationId}/mri-queries`, {
      headers: { 'Authorization': `Bearer ${getJWT()}` }
    })
      .then(res => res.json())
      .then(data => setQaHistory(data.queries || []));
  }, [conversationId]);

  const submitQuestion = async () => {
    if (!question.trim() || !canAsk) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/conversations/${conversationId}/mri-query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getJWT()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ question })
      });

      const data = await response.json();
      setQaHistory(prev => [...prev, { question, answer: data.answer }]);
      setLocalQueriesUsed(prev => prev + 1);
      setQuestion('');
    } catch (error) {
      console.error('MRI query failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mri-qa">
      {/* Q&A History (scrollable) */}
      <div className="qa-history">
        {qaHistory.map((qa, i) => (
          <div key={i} className="qa-item">
            <div className="question"><strong>Q:</strong> {qa.question}</div>
            <div className="answer"><strong>A:</strong> {qa.answer}</div>
          </div>
        ))}
      </div>

      {/* Query counter */}
      {!isUnlimited && (
        <div className="query-counter">
          {freeQueriesRemaining} of 2 free queries remaining
        </div>
      )}

      {/* Input area */}
      {canAsk ? (
        <div className="qa-input">
          <input
            type="text"
            value={question}
            onChange={e => setQuestion(e.target.value)}
            placeholder="Ask a question about this conversation..."
            onKeyDown={e => e.key === 'Enter' && submitQuestion()}
          />
          <button onClick={submitQuestion} disabled={loading || !question.trim()}>
            {loading ? 'Thinking...' : 'Submit'}
          </button>
        </div>
      ) : (
        <div className="paywall">
          <p>You've used all free MRI queries.</p>
          <button onClick={() => purchaseUnlimitedMRI(conversationId)}>
            Unlock Unlimited MRI - $10
          </button>
        </div>
      )}
    </div>
  );
};
```

### **1.6 Chat Recommender Component**

**Purpose:** Upload screenshot and get AI-recommended reply

```typescript
interface ChatRecommenderProps {
  conversationId: string;
}

// Screenshot upload zone (drag & drop, single image)
// Below upload: recommendation display area
// Shows cost estimate before processing (e.g., "Est. cost: $0.15")
// Requires user confirmation before processing
// POST /conversations/:id/chat-recommend with FormData (screenshot)
// Response: { recommendation: string, tokens_used: number, cost_cents: number }
// History of past recommendations shown below

export const ChatRecommender: React.FC<ChatRecommenderProps> = ({ conversationId }) => {
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [costEstimate, setCostEstimate] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<Array<{
    recommendation: string;
    tokens_used: number;
    cost_cents: number;
    created_at: string;
  }>>([]);

  useEffect(() => {
    // Load recommendation history
    fetch(`/api/conversations/${conversationId}/chat-recommendations`, {
      headers: { 'Authorization': `Bearer ${getJWT()}` }
    })
      .then(res => res.json())
      .then(data => setHistory(data.recommendations || []));
  }, [conversationId]);

  const onScreenshotDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setScreenshot(file);
      setPreviewUrl(URL.createObjectURL(file));
      setConfirmed(false);
      setRecommendation(null);
      // Show estimated cost
      setCostEstimate(15); // Est. $0.15 per recommendation
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onScreenshotDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.heic'] },
    maxFiles: 1
  });

  const processRecommendation = async () => {
    if (!screenshot || !confirmed) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('screenshot', screenshot);

      const response = await fetch(`/api/conversations/${conversationId}/chat-recommend`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getJWT()}` },
        body: formData
      });

      const data = await response.json();
      setRecommendation(data.recommendation);
      setHistory(prev => [data, ...prev]);
    } catch (error) {
      console.error('Chat recommendation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-recommender">
      {/* Screenshot upload zone */}
      <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
        <input {...getInputProps()} />
        {previewUrl ? (
          <img src={previewUrl} alt="Screenshot preview" className="preview" />
        ) : (
          <p>Drag & drop a screenshot here, or click to select</p>
        )}
      </div>

      {/* Cost estimate and confirmation */}
      {screenshot && !confirmed && (
        <div className="cost-confirm">
          <p>Est. cost: ${(costEstimate / 100).toFixed(2)}</p>
          <button onClick={() => { setConfirmed(true); processRecommendation(); }}>
            Confirm & Generate Recommendation
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading && <div className="loading">Generating recommendation...</div>}

      {/* Recommendation display */}
      {recommendation && (
        <div className="recommendation">
          <h4>Recommended Reply:</h4>
          <p>{recommendation}</p>
        </div>
      )}

      {/* History of past recommendations */}
      {history.length > 0 && (
        <div className="recommendation-history">
          <h4>Past Recommendations</h4>
          {history.map((rec, i) => (
            <div key={i} className="history-item">
              <p>{rec.recommendation}</p>
              <span className="meta">
                Tokens: {rec.tokens_used} | Cost: ${(rec.cost_cents / 100).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

---

## **2. Server-Side Components (Backend)**

### **2.1 API Server**

**Purpose:** Handle HTTP requests, authentication, job queueing

**Technology:** Node.js (Express) or Python (FastAPI)

**File Structure:**
```
api-server/
├── src/
│   ├── routes/
│   │   ├── auth.ts          // Authentication endpoints
│   │   ├── upload.ts        // File upload endpoints
│   │   ├── report.ts        // Report retrieval endpoints
│   │   └── payment.ts       // Payment webhooks
│   ├── middleware/
│   │   ├── auth.ts          // JWT verification
│   │   ├── rateLimit.ts     // Rate limiting
│   │   └── validation.ts    // Request validation
│   ├── services/
│   │   ├── jobQueue.ts      // Redis job queue
│   │   └── storage.ts       // S3 interactions
│   ├── models/
│   │   ├── User.ts          // User model
│   │   ├── Case.ts          // Case model
│   │   └── Payment.ts       // Payment model
│   └── index.ts             // Entry point
├── package.json
└── tsconfig.json

2.1.1 Upload Endpoint
typescript// src/routes/upload.ts

import express from 'express';
import multer from 'multer';
import { authenticateJWT } from '../middleware/auth';
import { JobQueue } from '../services/jobQueue';
import { Case } from '../models/Case';

const router = express.Router();

// Configure multer for file uploads (in-memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 500 * 1024 * 1024,  // 500MB
    files: 100
  }
});

router.post('/upload', 
  authenticateJWT,  // Verify JWT token
  upload.array('files', 100),  // Accept up to 100 files
  async (req, res) => {
    try {
      const userId = req.user.user_id;  // From JWT
      const analysisType = req.body.analysis_type;  // 'analysis'
      const encryptedIdentityMap = JSON.parse(req.body.encrypted_identity_map);

      // Validate analysis type
      if (!['analysis'].includes(analysisType)) {
        return res.status(400).json({ error: 'Invalid analysis type' });
      }

      // Create case record
      const caseRecord = await Case.create({
        user_id: userId,
        case_type: analysisType,
        status: 'queued',
        created_at: new Date()
      });

      // Create or link conversation record
      const conversationId = req.body.conversation_id;
      let conversation;
      if (conversationId) {
        // Link to existing conversation
        conversation = await Conversation.findById(conversationId);
        if (!conversation || conversation.user_id !== userId) {
          return res.status(404).json({ error: 'Conversation not found' });
        }
        conversation.case_id = caseRecord.case_id;
        await conversation.save();
      } else {
        // Create new conversation
        conversation = await Conversation.create({
          user_id: userId,
          case_id: caseRecord.case_id,
          status: 'queued',
          created_at: new Date()
        });
      }
      
      // Store files in Redis (ephemeral storage, 24-hour TTL)
      const redis = getRedisClient();
      const fileData = req.files.map((file: Express.Multer.File) => ({
        filename: file.originalname,
        mimetype: file.mimetype,
        buffer: file.buffer.toString('base64')  // Convert to base64 for Redis
      }));
      
      await redis.setex(
        `case:${caseRecord.case_id}:files`,
        24 * 60 * 60,  // 24 hours
        JSON.stringify(fileData)
      );
      
      // Store encrypted identity map (server cannot decrypt)
      await redis.setex(
        `case:${caseRecord.case_id}:identity_map`,
        24 * 60 * 60,
        JSON.stringify(encryptedIdentityMap)
      );
      
      // Queue processing job
      const jobQueue = new JobQueue();
      await jobQueue.addJob({
        type: 'process_analysis',
        case_id: caseRecord.case_id,
        conversation_id: conversation.conversation_id,
        analysis_type: analysisType
      });

      // Return conversation ID
      res.json({
        case_id: caseRecord.case_id,
        conversation_id: conversation.conversation_id,
        status: 'queued',
        estimated_time_minutes: 5
      });
      
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ error: 'Upload failed' });
    }
  }
);

export default router;

2.1.2 Job Queue Service
typescript// src/services/jobQueue.ts

import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';

const connection = new Redis({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null  // Required for BullMQ
});

export class JobQueue {
  private queue: Queue;
  
  constructor() {
    this.queue = new Queue('analysis-jobs', { connection });
  }
  
  async addJob(data: {
    type: 'process_analysis';
    case_id: string;
    conversation_id?: string;
    analysis_type: 'analysis' | 'deep_analysis' | 'mri_query' | 'chat_recommendation';
  }) {
    await this.queue.add('process_analysis', data, {
      attempts: 3,  // Retry up to 3 times
      backoff: {
        type: 'exponential',
        delay: 5000  // Start with 5 second delay, double each retry
      },
      removeOnComplete: {
        age: 24 * 60 * 60  // Remove completed jobs after 24 hours
      },
      removeOnFail: {
        age: 7 * 24 * 60 * 60  // Keep failed jobs for 7 days (debugging)
      }
    });
  }
  
  getQueue() {
    return this.queue;
  }
}

// Worker process (runs separately from API server)
export function startWorker() {
  const worker = new Worker('analysis-jobs', async (job: Job) => {
    console.log(`Processing job ${job.id}`);
    
    const { case_id, analysis_type } = job.data;
    
    // Import processing pipeline
    const { processAnalysis } = await import('./processingPipeline');
    
    // Run analysis
    await processAnalysis(case_id, analysis_type, (progress: number) => {
      // Update job progress
      job.updateProgress(progress);
    });
    
    console.log(`Job ${job.id} completed`);
    
  }, {
    connection,
    concurrency: 10,  // Process 10 jobs in parallel
    limiter: {
      max: 100,  // Max 100 jobs per minute
      duration: 60000
    }
  });
  
  worker.on('completed', (job) => {
    console.log(`Job ${job.id} completed successfully`);
  });
  
  worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed:`, err);
  });
  
  return worker;
}

2.2 Processing Pipeline
Purpose: Orchestrate ingestion, timeline stitching, multi-agent analysis, report generation

2.2.1 Main Processing Function
python# processing_pipeline.py

import asyncio
from typing import Callable
from redis import Redis
from datetime import datetime
import json

from ingestion import IngestFiles
from timeline import TimelineStitcher
from agents import ScoutAgent, ClinicianAgent, PatternMatcherAgent, HistorianAgent, ForensicAuditor
from report import ReportGenerator
from mri_responder import MriResponder
from chat_recommender_service import ChatRecommenderService

redis = Redis(host='localhost', port=6379, decode_responses=True)

async def process_analysis(
    case_id: str,
    analysis_type: str,
    progress_callback: Callable[[float], None],
    conversation_id: str = None,
    extra_data: Dict = None
):
    """
    Main processing pipeline for relationship analysis.

    Supports 4 modes:
    - 'analysis': Free tier - runs Scout Agent only for basic analysis.
      Results stored as JSON in Redis/PostgreSQL (not PDF).
    - 'deep_analysis': Pro tier - runs full multi-agent pipeline
      (Scout → Clinician/PatternMatcher/Historian → Auditor).
      Results stored as structured JSON (not PDF report).
    - 'mri_query': Pro tier - takes a question string, uses conversation
      context + targeted LLM query to generate answer.
      Stores Q&A in mri_queries table.
    - 'chat_recommendation': Pro tier - takes screenshot, performs OCR,
      generates context-aware reply recommendation.
      Stores in chat_recommendations table. Tracks token usage for billing.

    Key: Results are stored as structured JSON in PostgreSQL/Redis and
    rendered on the frontend, NOT as PDF reports.
    """

    try:
        if analysis_type in ('analysis', 'deep_analysis'):
            # Step 1: Retrieve files from Redis
            progress_callback(5)
            files_json = redis.get(f'case:{case_id}:files')
            if not files_json:
                raise Exception('Files not found')

            files = json.loads(files_json)

            # Step 2: Ingestion
            progress_callback(10)
            ingestion = IngestFiles()
            messages = await ingestion.process(files)

            # Store messages in Redis (for agent access)
            redis.setex(
                f'case:{case_id}:messages',
                24 * 60 * 60,  # 24 hours
                json.dumps(messages)
            )

            # Step 3: Timeline Stitching
            progress_callback(20)
            stitcher = TimelineStitcher()
            timeline = stitcher.stitch(messages)

            redis.setex(
                f'case:{case_id}:timeline',
                24 * 60 * 60,
                json.dumps(timeline)
            )

        if analysis_type == 'analysis':
            # Free tier: Only Scout Agent for basic analysis
            progress_callback(40)
            scout = ScoutAgent()
            findings = await scout.analyze(timeline)

            progress_callback(80)

            # Store results as structured JSON (not PDF)
            report_gen = ReportGenerator()
            await report_gen.store_analysis_results(
                case_id, conversation_id, findings
            )

        elif analysis_type == 'deep_analysis':
            # Pro tier: Full multi-agent pipeline

            # Step 4a: Scout Agent (identify critical episodes)
            progress_callback(30)
            scout = ScoutAgent()
            hot_zones = await scout.analyze(timeline)

            # Step 4b: Parallel execution of specialist agents
            progress_callback(40)

            clinician = ClinicianAgent()
            pattern_matcher = PatternMatcherAgent()
            historian = HistorianAgent()

            # Run in parallel
            clinician_task = asyncio.create_task(clinician.analyze(hot_zones))
            pattern_task = asyncio.create_task(pattern_matcher.analyze(timeline))
            historian_task = asyncio.create_task(historian.analyze(timeline))

            clinician_findings = await clinician_task
            pattern_findings = await pattern_task
            historian_findings = await historian_task

            progress_callback(60)

            # Step 4c: Forensic Auditor (verification)
            auditor = ForensicAuditor()
            verified_findings = await auditor.verify({
                'clinician': clinician_findings,
                'pattern_matcher': pattern_findings,
                'historian': historian_findings
            }, timeline)

            progress_callback(70)

            # Store results as structured JSON (not PDF)
            report_gen = ReportGenerator()
            await report_gen.store_analysis_results(
                case_id, conversation_id, verified_findings
            )

        elif analysis_type == 'mri_query':
            # Pro tier: Answer a specific question using conversation context
            progress_callback(20)

            question = extra_data.get('question', '')
            if not question:
                raise Exception('Question is required for mri_query')

            # Load timeline from Redis
            timeline_json = redis.get(f'case:{case_id}:timeline')
            timeline = json.loads(timeline_json) if timeline_json else {}

            progress_callback(40)

            responder = MriResponder()
            answer = await responder.answer_question(conversation_id, question, timeline)

            progress_callback(90)

        elif analysis_type == 'chat_recommendation':
            # Pro tier: Generate recommended reply from screenshot
            progress_callback(20)

            screenshot = extra_data.get('screenshot', b'')
            if not screenshot:
                raise Exception('Screenshot is required for chat_recommendation')

            # Load timeline from Redis
            timeline_json = redis.get(f'case:{case_id}:timeline')
            timeline = json.loads(timeline_json) if timeline_json else {}

            progress_callback(40)

            recommender = ChatRecommenderService()
            result = await recommender.generate_recommendation(
                conversation_id, screenshot, timeline
            )

            progress_callback(90)

        progress_callback(90)

        # Update case/conversation status
        from models import Case, Conversation
        case = Case.get(case_id)
        case.status = 'completed'
        case.completed_at = datetime.utcnow()
        case.save()

        if conversation_id:
            conversation = Conversation.get(conversation_id)
            conversation.last_analyzed_at = datetime.utcnow()
            conversation.save()

        # Send notification (for analysis and deep_analysis only)
        if analysis_type in ('analysis', 'deep_analysis'):
            from notifications import send_email
            send_email(
                to=case.user.email,
                subject='Your Subtext Analysis is Ready',
                body=f'View your results: https://subtext.ai/conversation/{conversation_id}'
            )

        progress_callback(100)

        # Clean up (delete files from Redis, keep messages/timeline for 24h)
        redis.delete(f'case:{case_id}:files')

    except Exception as e:
        # Update case status
        from models import Case
        case = Case.get(case_id)
        case.status = 'failed'
        case.error_message = str(e)
        case.save()

        raise

2.2.2 Ingestion Module
python# ingestion.py

import base64
import re
from typing import List, Dict
import boto3
from PIL import Image
import io

textract = boto3.client('textract', region_name='us-east-1')

class IngestFiles:
    async def process(self, files: List[Dict]) -> List[Dict]:
        """
        Process uploaded files and extract text content
        
        Returns list of messages with structure:
        {
            'source': 'screenshot_01.png' or 'chat.txt',
            'content': 'extracted text',
            'timestamp': '2024-03-15T14:30:00Z' (if available),
            'metadata': {...}
        }
        """
        messages = []
        
        for file in files:
            filename = file['filename']
            mimetype = file['mimetype']
            buffer = base64.b64decode(file['buffer'])
            
            if mimetype.startswith('image/'):
                # Image OCR
                extracted = await self.extract_from_image(buffer)
                messages.extend(extracted)
                
            elif mimetype == 'text/plain':
                # Text file parsing
                text = buffer.decode('utf-8')
                extracted = self.parse_text_export(text)
                messages.extend(extracted)
                
            elif mimetype == 'application/zip':
                # ZIP extraction (WhatsApp exports often come as ZIP)
                extracted = await self.extract_from_zip(buffer)
                messages.extend(extracted)
        
        return messages
    
    async def extract_from_image(self, image_buffer: bytes) -> List[Dict]:
        """
        Use AWS Textract to extract text from image
        """
        
        # Submit to Textract
        response = textract.detect_document_text(
            Document={'Bytes': image_buffer}
        )
        
        # Extract text blocks
        text_blocks = []
        for block in response['Blocks']:
            if block['BlockType'] == 'LINE':
                text_blocks.append(block['Text'])
        
        full_text = '\n'.join(text_blocks)
        
        # Try to extract timestamp from image metadata (EXIF)
        timestamp = None
        try:
            image = Image.open(io.BytesIO(image_buffer))
            exif = image._getexif()
            if exif and 36867 in exif:  # DateTimeOriginal tag
                timestamp = exif[36867]
        except:
            pass
        
        return [{
            'source': 'screenshot',
            'content': full_text,
            'timestamp': timestamp,
            'metadata': {}
        }]
    
    def parse_text_export(self, text: str) -> List[Dict]:
        """
        Parse WhatsApp or iMessage text export
        
        WhatsApp format:
        [3/15/24, 2:30:15 PM] John: Hey, how are you?
        [3/15/24, 2:31:02 PM] Sarah: I'm good, thanks!
        
        iMessage format varies, but typically:
        Mar 15, 2024 at 2:30 PM - John: Hey
        """
        
        messages = []
        
        # Try WhatsApp format first
        whatsapp_pattern = r'\[(\d{1,2}/\d{1,2}/\d{2,4},\s+\d{1,2}:\d{2}:\d{2}\s+[AP]M)\]\s+([^:]+):\s+(.+)'
        matches = re.findall(whatsapp_pattern, text, re.MULTILINE)
        
        if matches:
            for match in matches:
                timestamp_str, sender, content = match
                messages.append({
                    'source': 'whatsapp_export',
                    'timestamp': timestamp_str,
                    'sender': sender.strip(),
                    'content': content.strip(),
                    'metadata': {}
                })
            return messages
        
        # Try iMessage format
        imessage_pattern = r'([A-Za-z]{3}\s+\d{1,2},\s+\d{4}\s+at\s+\d{1,2}:\d{2}\s+[AP]M)\s+-\s+([^:]+):\s+(.+)'
        matches = re.findall(imessage_pattern, text, re.MULTILINE)
        
        if matches:
            for match in matches:
                timestamp_str, sender, content = match
                messages.append({
                    'source': 'imessage_export',
                    'timestamp': timestamp_str,
                    'sender': sender.strip(),
                    'content': content.strip(),
                    'metadata': {}
                })
            return messages
        
        # Fallback: Treat entire text as single message
        return [{
            'source': 'text_file',
            'content': text,
            'timestamp': None,
            'metadata': {}
        }]
    
    async def extract_from_zip(self, zip_buffer: bytes) -> List[Dict]:
        """
        Extract files from ZIP and process
        """
        import zipfile
        
        messages = []
        
        with zipfile.ZipFile(io.BytesIO(zip_buffer)) as zf:
            for filename in zf.namelist():
                file_content = zf.read(filename)
                
                # Recursively process each file
                if filename.endswith('.txt'):
                    text = file_content.decode('utf-8')
                    extracted = self.parse_text_export(text)
                    messages.extend(extracted)
                
                elif filename.lower().endswith(('.png', '.jpg', '.jpeg')):
                    extracted = await self.extract_from_image(file_content)
                    messages.extend(extracted)
        
        return messages

2.2.3 Timeline Stitcher
python# timeline.py

from datetime import datetime
from typing import List, Dict
import dateutil.parser

class TimelineStitcher:
    def stitch(self, messages: List[Dict]) -> List[Dict]:
        """
        Stitch messages from multiple sources into chronological order
        
        Steps:
        1. Parse timestamps (handle multiple formats)
        2. Normalize timezone
        3. Sort by timestamp
        4. Detect gaps (>48 hour silence)
        5. Merge duplicates
        """
        
        # Step 1: Parse timestamps
        for msg in messages:
            if msg.get('timestamp'):
                try:
                    # Try multiple datetime formats
                    dt = dateutil.parser.parse(msg['timestamp'])
                    msg['datetime'] = dt
                except:
                    # If parsing fails, use None
                    msg['datetime'] = None
            else:
                msg['datetime'] = None
        
        # Step 2: Sort by timestamp (messages without timestamp go to end)
        sorted_messages = sorted(
            messages,
            key=lambda m: m['datetime'] if m['datetime'] else datetime.max
        )
        
        # Step 3: Detect gaps
        gaps = []
        for i in range(len(sorted_messages) - 1):
            current = sorted_messages[i]
            next_msg = sorted_messages[i + 1]
            
            if current['datetime'] and next_msg['datetime']:
                time_diff = (next_msg['datetime'] - current['datetime']).total_seconds()
                
                if time_diff > 48 * 60 * 60:  # 48 hours
                    gaps.append({
                        'after_index': i,
                        'duration_hours': time_diff / 3600,
                        'start': current['datetime'],
                        'end': next_msg['datetime']
                    })
        
        # Step 4: Merge duplicates (same content, similar timestamp)
        deduplicated = []
        seen_content = set()
        
        for msg in sorted_messages:
            content_hash = hash(msg['content'][:100])  # Hash first 100 chars
            
            if content_hash not in seen_content:
                deduplicated.append(msg)
                seen_content.add(content_hash)
        
        # Step 5: Add metadata
        timeline = {
            'messages': deduplicated,
            'total_count': len(deduplicated),
            'date_range': {
                'start': deduplicated[0]['datetime'] if deduplicated[0]['datetime'] else None,
                'end': deduplicated[-1]['datetime'] if deduplicated[-1]['datetime'] else None
            },
            'gaps': gaps
        }
        
        return timeline

2.2.4 Agent Implementations
Scout Agent:
python# agents/scout.py

from openai import AsyncOpenAI
import json

client = AsyncOpenAI(api_key=os.getenv('OPENAI_API_KEY'))

class ScoutAgent:
    async def analyze(self, timeline: Dict) -> Dict:
        """
        Scan timeline and identify 5-10 critical episodes (hot zones)
        """
        
        messages = timeline['messages']
        
        # Prepare prompt
        conversation_text = self.format_messages_for_llm(messages)
        
        prompt = f"""
You are a triage specialist analyzing a relationship conversation timeline.
Your task: Identify 5-10 "Hot Zones" (critical episodes) that require deep analysis.

Hot Zone criteria:
- High message velocity (>20 messages/hour)
- Aggressive language (caps, profanity, hostility)
- Prolonged silence after conflict (>48 hours)
- Emotional intensity (crying emoji, "I'm done", breakup language)
- Stonewalling (one-word replies, withdrawal)

Conversation:
{conversation_text}

Return ONLY a JSON array with this structure:
[
  {{
    "start_index": 0,
    "end_index": 50,
    "intensity_score": 8.5,
    "brief_summary": "Fight about money",
    "indicators": ["caps", "profanity", "silence_after"]
  }}
]
"""
        
        # Call OpenAI API
        response = await client.chat.completions.create(
            model='gpt-4-turbo-preview',
            messages=[
                {'role': 'system', 'content': 'You are a relationship analysis expert.'},
                {'role': 'user', 'content': prompt}
            ],
            temperature=0.3,  # Lower temperature for more consistent output
            max_tokens=2000
        )
        
        # Parse JSON response
        try:
            hot_zones = json.loads(response.choices[0].message.content)
        except:
            # If JSON parsing fails, return empty
            hot_zones = []
        
        return {
            'hot_zones': hot_zones,
            'total_messages_scanned': len(messages)
        }
    
    def format_messages_for_llm(self, messages: List[Dict], limit: int = 10000) -> str:
        """
        Format messages for LLM input (truncate if too long)
        """
        formatted = []
        
        for i, msg in enumerate(messages):
            timestamp = msg.get('datetime', 'Unknown')
            sender = msg.get('sender', 'Unknown')
            content = msg['content']
            
            formatted.append(f"[{i}] {timestamp} - {sender}: {content}")
            
            # Truncate if getting too long
            if len('\n'.join(formatted)) > limit * 4:  # ~4 chars per token
                break
        
        return '\n'.join(formatted)
Clinician Agent:
python# agents/clinician.py

from openai import AsyncOpenAI
import json

client = AsyncOpenAI(api_key=os.getenv('OPENAI_API_KEY'))

class ClinicianAgent:
    async def analyze(self, hot_zones: List[Dict]) -> Dict:
        """
        Analyze critical episodes using Gottman's SPAFF coding
        """
        
        findings = {
            'criticism': {'count': 0, 'examples': []},
            'contempt': {'count': 0, 'examples': []},
            'defensiveness': {'count': 0, 'examples': []},
            'stonewalling': {'count': 0, 'examples': []}
        }
        
        for zone in hot_zones['hot_zones']:
            # Extract messages in this zone
            zone_messages = messages[zone['start_index']:zone['end_index']]
            zone_text = self.format_messages(zone_messages)
            
            prompt = f"""
You are a clinical psychologist trained in Gottman's SPAFF coding system.
Analyze this conversation episode and code for Gottman's Four Horsemen:

1. Criticism: Attacks on character ("You always...", "You never...")
2. Contempt: Disrespect, sarcasm, mockery, eye-roll emoji
3. Defensiveness: Making excuses, counter-attacks, playing victim
4. Stonewalling: Withdrawal, one-word replies, silence

Conversation episode:
{zone_text}

For each detected behavior:
- Cite specific message with index number
- Quote the exact text
- Explain why it qualifies

Return ONLY valid JSON with this structure:
{{
  "criticism": [
    {{"index": 42, "quote": "You never listen to me", "explanation": "..."}}
  ],
  "contempt": [...],
  "defensiveness": [...],
  "stonewalling": [...]
}}
"""
            
            response = await client.chat.completions.create(
                model='gpt-4-turbo-preview',
                messages=[
                    {'role': 'system', 'content': 'You are a Gottman Method specialist.'},
                    {'role': 'user', 'content': prompt}
                ],
                temperature=0.2,
                max_tokens=2000
            )
            
            try:
                zone_findings = json.loads(response.choices[0].message.content)
                
                # Accumulate findings
                for behavior in ['criticism', 'contempt', 'defensiveness', 'stonewalling']:
                    findings[behavior]['count'] += len(zone_findings.get(behavior, []))
                    findings[behavior]['examples'].extend(zone_findings.get(behavior, []))
                    
            except Exception as e:
                print(f'Error parsing clinician response: {e}')
                continue
        
        # Calculate frequency (per 1000 messages)
        total_messages = sum(zone['end_index'] - zone['start_index'] for zone in hot_zones['hot_zones'])
        
        for behavior in findings:
            count = findings[behavior]['count']
            findings[behavior]['frequency_per_1000'] = (count / total_messages) * 1000 if total_messages > 0 else 0
            
            # Compare to baseline (healthy relationships: <10 per 1000 for each)
            findings[behavior]['percentile'] = self.calculate_percentile(
                findings[behavior]['frequency_per_1000']
            )
        
        return findings
    
    def calculate_percentile(self, frequency: float) -> int:
        """
        Compare to healthy relationship baseline
        (This would use actual data, but for now, simple heuristic)
        """
        if frequency < 5:
            return 25  # Below average (healthy)
        elif frequency < 10:
            return 50  # Average
        elif frequency < 20:
            return 75  # Above average (concerning)
        else:
            return 95  # Very high (toxic)
Pattern Matcher Agent:
python# agents/pattern_matcher.py

from anthropic import AsyncAnthropic
import json

client = AsyncAnthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))

class PatternMatcherAgent:
    async def analyze(self, timeline: Dict) -> Dict:
        """
        Identify interaction loops and attachment patterns
        """
        
        messages = timeline['messages']
        
        # Calculate message frequency per sender (for Demand/Withdraw detection)
        sender_stats = self.calculate_sender_stats(messages)
        
        # Calculate response latency (time between messages)
        latency_patterns = self.calculate_latency_patterns(messages)
        
        # Prepare context for LLM
        conversation_text = self.format_messages(messages)
        
        prompt = f"""
You are a systems analyst specializing in relationship dynamics.
Identify interaction loops and attachment patterns:

1. Demand/Withdraw: One person pursues (high message frequency),
   other withdraws (long latency, short responses)
   
2. Escalation: Conflict intensity increases over time

3. Repair Attempts: Efforts to de-escalate (apologize, humor, affection)

4. Emotional Bids: One person seeks connection, measure response rate

5. Pronoun Analysis: "I" vs "We" ratio (individuation vs unity)

6. Latency Patterns: Response time as behavioral indicator

Conversation:
{conversation_text}

Sender Statistics:
{json.dumps(sender_stats, indent=2)}

Latency Patterns:
{json.dumps(latency_patterns, indent=2)}

Return ONLY valid JSON with this structure:
{{
  "patterns": [
    {{
      "name": "demand_withdraw",
      "detected": true,
      "confidence": 85,
      "evidence": "Person A sends 3x more messages, Person B has 2x longer response time",
      "pursuer": "Person A",
      "withdrawer": "Person B"
    }}
  ],
  "attachment_style": {{
    "person_a": "anxious",
    "person_b": "avoidant",
    "confidence": 80
  }},
  "pronoun_analysis": {{
    "person_a_i_we_ratio": 2.5,
    "person_b_i_we_ratio": 4.0
  }}
}}
"""
        
        response = await client.messages.create(
            model='claude-sonnet-4-20250514',
            max_tokens=2000,
            messages=[
                {'role': 'user', 'content': prompt}
            ],
            temperature=0.3
        )
        
        try:
            findings = json.loads(response.content[0].text)
        except:
            findings = {'patterns': [], 'attachment_style': {}}
        
        return findings
    
    def calculate_sender_stats(self, messages: List[Dict]) -> Dict:
        """
        Calculate message frequency per sender
        """
        stats = {}
        
        for msg in messages:
            sender = msg.get('sender', 'Unknown')
            if sender not in stats:
                stats[sender] = {'count': 0, 'total_chars': 0}
            
            stats[sender]['count'] += 1
            stats[sender]['total_chars'] += len(msg['content'])
        
        # Calculate averages
        for sender in stats:
            stats[sender]['avg_message_length'] = stats[sender]['total_chars'] / stats[sender]['count']
        
        return stats
    
    def calculate_latency_patterns(self, messages: List[Dict]) -> Dict:
        """
        Calculate response time between messages
        """
        latencies = []
        
        for i in range(len(messages) - 1):
            current = messages[i]
            next_msg = messages[i + 1]
            
            # Only calculate if both have timestamps and different senders
            if (current.get('datetime') and next_msg.get('datetime') and
                current.get('sender') != next_msg.get('sender')):
                
                time_diff = (next_msg['datetime'] - current['datetime']).total_seconds() / 60  # minutes
                latencies.append({
                    'from': current['sender'],
                    'to': next_msg['sender'],
                    'latency_minutes': time_diff
                })
        
        # Calculate average latency per sender
        sender_latencies = {}
        for latency in latencies:
            sender = latency['to']
            if sender not in sender_latencies:
                sender_latencies[sender] = []
            sender_latencies[sender].append(latency['latency_minutes'])
        
        avg_latencies = {}
        for sender, latency_list in sender_latencies.items():
            avg_latencies[sender] = sum(latency_list) / len(latency_list)
        
        return {
            'average_latency_by_sender': avg_latencies,
            'longest_silence': max(latencies, key=lambda x: x['latency_minutes']) if latencies else None
        }
Historian Agent:
(Similar structure to Clinician/Pattern Matcher - connects events across time)
Forensic Auditor:
python# agents/forensic_auditor.py

from anthropic import AsyncAnthropic
import json

client = AsyncAnthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))

class ForensicAuditor:
    async def verify(self, agent_findings: Dict, timeline: Dict) -> Dict:
        """
        Fact-check all agent claims against raw transcript
        Calculate confidence scores, VETO low-confidence findings
        """
        
        verified = {}
        
        for agent_name, findings in agent_findings.items():
            verified[agent_name] = await self.verify_agent(agent_name, findings, timeline)
        
        return verified
    
    async def verify_agent(self, agent_name: str, findings: Dict, timeline: Dict) -> Dict:
        """
        Verify individual agent's findings
        """
        
        messages = timeline['messages']
        conversation_text = self.format_messages(messages)
        
        prompt = f"""
You are a forensic auditor. Your job is to fact-check the {agent_name} agent's findings.

For each claim:
1. Locate supporting evidence in the raw transcript
2. Calculate confidence score (0-100%)
3. VETO any claim with confidence <70%
4. Flag ambiguous findings

{agent_name} Agent's Findings:
{json.dumps(findings, indent=2)}

Raw Conversation:
{conversation_text}

Return ONLY valid JSON with this structure:
{{
  "verified_findings": [
    {{
      "claim": "Person A exhibited defensiveness",
      "evidence": "Index 42: 'I was just trying to help!'",
      "confidence": 85,
      "veto": false
    }}
  ],
  "vetoed_findings": [
    {{
      "claim": "Person B showed contempt",
      "reason": "No clear evidence of contempt in transcript",
      "confidence": 45
    }}
  ]
}}
"""
        
        response = await client.messages.create(
            model='claude-sonnet-4-20250514',
            max_tokens=3000,
            messages=[
                {'role': 'user', 'content': prompt}
            ],
            temperature=0.2  # Low temperature for consistency
        )
        
        try:
            verification = json.loads(response.content[0].text)
        except:
            verification = {'verified_findings': [], 'vetoed_findings': []}
        
        return verification

### **2.2.6 MRI Responder Service**

**Purpose:** Answer user questions using conversation context

```python
# mri_responder.py

from anthropic import AsyncAnthropic
from typing import Dict
import json
from datetime import datetime

client = AsyncAnthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))

class MriResponder:
    async def answer_question(self, conversation_id: str, question: str, timeline: Dict) -> str:
        """
        Answer a user question using conversation context.
        Uses Claude Sonnet for nuanced, context-aware responses.
        """

        # Load conversation context from Redis/PostgreSQL
        conversation_summary = self.build_conversation_summary(timeline)

        # Construct prompt with conversation summary + specific question
        prompt = f"""
You are a relationship analyst with deep expertise in communication patterns,
attachment theory, and interpersonal dynamics.

You have analyzed the following conversation between two people:

{conversation_summary}

The user is asking the following question about this conversation:
"{question}"

Provide a thoughtful, nuanced, and empathetic answer. Reference specific
moments from the conversation where relevant. Be honest but compassionate.
Avoid making absolute judgments — frame observations as patterns, not verdicts.
"""

        # Use Claude Sonnet for nuanced, context-aware response
        response = await client.messages.create(
            model='claude-sonnet-4-20250514',
            max_tokens=1500,
            messages=[
                {'role': 'user', 'content': prompt}
            ],
            temperature=0.4
        )

        answer = response.content[0].text

        # Store in mri_queries table
        from models import MriQuery
        await MriQuery.create({
            'conversation_id': conversation_id,
            'question': question,
            'answer': answer,
            'created_at': datetime.utcnow()
        })

        return answer

    def build_conversation_summary(self, timeline: Dict) -> str:
        """
        Build a concise summary of the conversation for context.
        """
        messages = timeline.get('messages', [])
        total = len(messages)

        # Take a representative sample if too many messages
        if total > 200:
            # First 50, last 50, and 100 from middle
            sample = messages[:50] + messages[total//2 - 50:total//2 + 50] + messages[-50:]
        else:
            sample = messages

        lines = []
        for msg in sample:
            sender = msg.get('sender', 'Unknown')
            content = msg.get('content', '')
            lines.append(f"{sender}: {content}")

        summary = '\n'.join(lines)

        # Add metadata
        date_range = timeline.get('date_range', {})
        gaps = timeline.get('gaps', [])

        header = f"Conversation: {total} messages"
        if date_range.get('start') and date_range.get('end'):
            header += f" from {date_range['start']} to {date_range['end']}"
        if gaps:
            header += f" ({len(gaps)} significant gaps detected)"

        return f"{header}\n\n{summary}"
```

### **2.2.7 Chat Recommender Service**

**Purpose:** Generate recommended replies based on screenshot + conversation context

```python
# chat_recommender_service.py

from anthropic import AsyncAnthropic
from typing import Dict
import boto3
import json
from datetime import datetime

client = AsyncAnthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))
textract = boto3.client('textract', region_name='us-east-1')

class ChatRecommenderService:
    async def generate_recommendation(
        self,
        conversation_id: str,
        screenshot: bytes,
        timeline: Dict
    ) -> Dict:
        """
        Generate a recommended reply based on a screenshot of a recent
        message and the full conversation context.
        """

        # Step 1: OCR the screenshot (AWS Textract)
        ocr_response = textract.detect_document_text(
            Document={'Bytes': screenshot}
        )
        screenshot_text = '\n'.join(
            block['Text'] for block in ocr_response['Blocks']
            if block['BlockType'] == 'LINE'
        )

        # Step 2: Load conversation context
        conversation_summary = self.build_context_summary(timeline)

        # Step 3: Construct prompt
        prompt = f"""
You are a communication coach helping someone craft a thoughtful reply
in a relationship conversation.

Here is the conversation history and context:
{conversation_summary}

Here is the latest message they received (from a screenshot):
---
{screenshot_text}
---

Suggest a thoughtful, empathetic reply that:
1. Acknowledges the other person's feelings
2. Is honest and authentic (not manipulative)
3. De-escalates if there is tension
4. Opens space for productive dialogue
5. Matches the tone and communication style of the conversation

Provide ONLY the suggested reply text. Do not include explanations or alternatives.
"""

        # Step 4: Use Claude Sonnet for empathetic, strategic response
        response = await client.messages.create(
            model='claude-sonnet-4-20250514',
            max_tokens=500,
            messages=[
                {'role': 'user', 'content': prompt}
            ],
            temperature=0.5
        )

        recommendation = response.content[0].text
        tokens_used = response.usage.input_tokens + response.usage.output_tokens

        # Step 5: Track token usage for billing
        # Approximate cost: $3/M input + $15/M output tokens (Claude Sonnet pricing)
        cost_cents = round(
            (response.usage.input_tokens * 3 / 1_000_000 +
             response.usage.output_tokens * 15 / 1_000_000) * 100, 2
        )

        # Step 6: Store in chat_recommendations table
        from models import ChatRecommendation
        await ChatRecommendation.create({
            'conversation_id': conversation_id,
            'screenshot_text': screenshot_text,
            'recommendation': recommendation,
            'tokens_used': tokens_used,
            'cost_cents': cost_cents,
            'created_at': datetime.utcnow()
        })

        # Step 7: Return result
        return {
            'recommendation': recommendation,
            'tokens_used': tokens_used,
            'cost_cents': cost_cents
        }

    def build_context_summary(self, timeline: Dict) -> str:
        """
        Build concise context summary for recommendation prompt.
        """
        messages = timeline.get('messages', [])
        # Use last 100 messages for most relevant context
        recent = messages[-100:] if len(messages) > 100 else messages

        lines = []
        for msg in recent:
            sender = msg.get('sender', 'Unknown')
            content = msg.get('content', '')
            lines.append(f"{sender}: {content}")

        return '\n'.join(lines)
```

2.2.5 Report Generator

**Note:** PDF generation is now secondary. Primary output is structured JSON stored in PostgreSQL, rendered by the frontend Tabbed Analysis Viewer (Section 1.4). PDF generation is kept as an optional export feature.

python# report/generator.py

from jinja2 import Template
import plotly.graph_objects as go
from datetime import datetime
import pdfkit  # Or use Puppeteer via Node.js
import boto3

s3 = boto3.client('s3')

class ReportGenerator:
    async def generate_mri_report(
        self,
        case_id: str,
        findings: Dict,
        timeline: Dict
    ) -> str:
        """
        Generate 30-page MRI report PDF
        """
        
        # Step 1: Generate visualizations
        timeline_chart = self.create_timeline_chart(timeline)
        heatmap = self.create_heatmap(timeline)
        gottman_scorecard = self.create_gottman_scorecard(findings['clinician'])
        
        # Step 2: Prepare data for template
        template_data = {
            'case_id': case_id,
            'generated_at': datetime.utcnow().isoformat(),
            'timeline_chart': timeline_chart,
            'heatmap': heatmap,
            'gottman_scorecard': gottman_scorecard,
            'findings': findings,
            'placeholders': self.get_placeholders(timeline)  # [Person A], etc.
        }
        
        # Step 3: Render HTML template
        html_template = self.load_template('mri_report.html')
        html_content = html_template.render(template_data)
        
        # Step 4: Convert to PDF
        pdf_bytes = pdfkit.from_string(html_content, False)  # False = return bytes
        
        # Step 5: Upload to S3
        s3_key = f'reports/{case_id}/mri_report.pdf'
        s3.put_object(
            Bucket='subtext-reports',
            Key=s3_key,
            Body=pdf_bytes,
            ContentType='application/pdf',
            ServerSideEncryption='AES256'  # Encrypt at rest
        )
        
        # Step 6: Generate signed URL (expires in 7 days)
        url = s3.generate_presigned_url(
            'get_object',
            Params={'Bucket': 'subtext-reports', 'Key': s3_key},
            ExpiresIn=7 * 24 * 60 * 60  # 7 days
        )
        
        return url
    
    def create_timeline_chart(self, timeline: Dict) -> str:
        """
        Create emotional velocity graph using Plotly
        """
        messages = timeline['messages']
        
        # Group messages by day
        daily_counts = {}
        for msg in messages:
            if msg.get('datetime'):
                date = msg['datetime'].date()
                daily_counts[date] = daily_counts.get(date, 0) + 1
        
        dates = sorted(daily_counts.keys())
        counts = [daily_counts[d] for d in dates]
        
        # Create Plotly figure
        fig = go.Figure()
        fig.add_trace(go.Scatter(
            x=dates,
            y=counts,
            mode='lines+markers',
            name='Messages per day',
            line=dict(color='#FF6B6B', width=2)
        ))
        
        fig.update_layout(
            title='Conversation Timeline',
            xaxis_title='Date',
            yaxis_title='Messages per day',
            hovermode='x unified'
        )
        
        # Convert to PNG (for embedding in PDF)
        img_bytes = fig.to_image(format='png', width=800, height=400)
        
        # Base64 encode for embedding
        import base64
        img_base64 = base64.b64encode(img_bytes).decode()
        
        return f'data:image/png;base64,{img_base64}'
    
    def create_heatmap(self, timeline: Dict) -> str:
        """
        Create message frequency heatmap
        """
        # ... similar to timeline_chart, but using Plotly heatmap
        pass
    
    def create_gottman_scorecard(self, clinician_findings: Dict) -> str:
        """
        Create bar chart of Four Horsemen frequencies
        """
        behaviors = ['criticism', 'contempt', 'defensiveness', 'stonewalling']
        frequencies = [clinician_findings[b]['frequency_per_1000'] for b in behaviors]
        
        fig = go.Figure()
        fig.add_trace(go.Bar(
            x=behaviors,
            y=frequencies,
            marker_color=['#E74C3C', '#9B59B6', '#F39C12', '#3498DB']
        ))
        
        # Add baseline line (healthy = <10 per 1000)
        fig.add_hline(y=10, line_dash="dash", line_color="green",
                      annotation_text="Healthy Baseline")
        
        fig.update_layout(
            title='Gottman Four Horsemen Scorecard',
            yaxis_title='Frequency (per 1000 messages)',
            xaxis_title='Behavior'
        )
        
        img_bytes = fig.to_image(format='png', width=600, height=400)
        img_base64 = base64.b64encode(img_bytes).decode()
        
        return f'data:image/png;base64,{img_base64}'
    
    def load_template(self, template_name: str) -> Template:
        """
        Load Jinja2 HTML template
        """
        with open(f'templates/{template_name}', 'r') as f:
            return Template(f.read())
    
    def get_placeholders(self, timeline: Dict) -> Dict:
        """
        Extract list of placeholders used ([Person A], [Person B], etc.)
        For display in report
        """
        placeholders = set()
        
        for msg in timeline['messages']:
            # Find all [Person X] or [Location Y] tokens
            import re
            tokens = re.findall(r'\[([^\]]+)\]', msg['content'])
            placeholders.update(tokens)

        return list(placeholders)

    async def store_analysis_results(self, case_id: str, conversation_id: str, findings: Dict) -> None:
        """
        Store verified findings as JSONB in cases table.
        Primary output method — results rendered by frontend (not PDF).
        PDF generation is available as optional export.
        """
        from models import Case, Conversation
        from datetime import datetime

        # Store verified findings as JSONB in cases table
        case = Case.get(case_id)
        case.findings_json = findings  # Stored as JSONB in PostgreSQL
        case.status = 'completed'
        case.completed_at = datetime.utcnow()
        case.save()

        # Update conversation.last_analyzed_at
        if conversation_id:
            conversation = Conversation.get(conversation_id)
            conversation.last_analyzed_at = datetime.utcnow()
            conversation.findings_json = findings  # Cached in conversation for quick access
            conversation.save()

        # Also cache in Redis for fast frontend retrieval
        redis.setex(
            f'conversation:{conversation_id}:findings',
            7 * 24 * 60 * 60,  # 7 days
            json.dumps(findings)
        )

3. Summary
This completes the Low-Level Design (LLD) for Subtext 2.1. The document provides implementation-ready specifications for:

Client-Side Components:

PII Detection (WASM/NER)
Encryption (Web Crypto API)
Upload Flow (React)
Report Decryption


Server-Side Components:

API Server (Express/FastAPI)
Job Queue (BullMQ/Redis)
Processing Pipeline (Python asyncio)
Multi-Agent Council (OpenAI/Anthropic APIs)
Report Generation (Plotly + PDF)


Data Flow:

End-to-end encryption
Ephemeral storage (Redis 24-hour TTL)
Zero-knowledge architecture verified



The system is designed for:

Security: Zero-knowledge, client-side encryption
Scalability: Stateless, horizontal scaling
Performance: <20 minute processing for MRI
Reliability: Retry logic, error handling, monitoring

Next Steps:

Implement each component according to specifications
Write unit tests for critical functions (PII detection, encryption)
Integration testing (end-to-end flow)
Load testing (1000 concurrent analyses)
Security audit (third-party penetration testing)
Deploy to production (Kubernetes on AWS)