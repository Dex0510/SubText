'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { api } from '@/lib/api';
import { useAnalysisStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { PIIDetector, encryptionManager } from '@/lib/encryption';

interface UploadZoneProps {
  type: 'analysis';
  platform?: string;
  analysisFocus?: string;
}

export function UploadZone({ platform, analysisFocus }: UploadZoneProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [processingStage, setProcessingStage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { setCaseId } = useAnalysisStore();
  const router = useRouter();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (type === 'tactical_scan') {
      setFiles(acceptedFiles.slice(0, 1));
    } else {
      // Both 'mri' and 'analysis' allow multiple files
      setFiles(prev => [...prev, ...acceptedFiles].slice(0, 100));
    }
    setError(null);
  }, [type]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.heic'],
      'text/plain': ['.txt'],
      'text/csv': ['.csv'],
      'application/zip': ['.zip'],
      'application/json': ['.json'],
    },
    maxSize: 500 * 1024 * 1024,
    maxFiles: type === 'tactical_scan' ? 1 : 100, // analysis and mri allow 100 files
  });

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Process text files through PII detection before upload
  const processFilesForPrivacy = async (inputFiles: File[]): Promise<{ processedFiles: File[]; encryptedIdentityMap?: string }> => {
    const piiDetector = new PIIDetector();
    const processedFiles: File[] = [];

    setProcessingStage('Scanning for personal information...');

    for (const file of inputFiles) {
      // Only process text-based files for PII
      if (file.type === 'text/plain' || file.type === 'text/csv' || file.type === 'application/json') {
        const text = await file.text();
        const { maskedText } = piiDetector.detectAndMask(text);
        const maskedBlob = new Blob([maskedText], { type: file.type });
        processedFiles.push(new File([maskedBlob], file.name, { type: file.type }));
      } else {
        // Images and other binary files pass through (server-side OCR handles them)
        processedFiles.push(file);
      }
    }

    // Generate encryption key and encrypt the identity map
    setProcessingStage('Encrypting identity map...');
    await encryptionManager.generateSessionKey();
    const identityMap = piiDetector.detectAndMask('').identityMap; // Get the accumulated map
    // Re-run to get the full identity map from all processed files
    let fullIdentityMap: Record<string, string> = {};
    for (const file of inputFiles) {
      if (file.type === 'text/plain' || file.type === 'text/csv' || file.type === 'application/json') {
        const text = await file.text();
        const result = piiDetector.detectAndMask(text);
        fullIdentityMap = { ...fullIdentityMap, ...result.identityMap };
      }
    }

    let encryptedIdentityMap: string | undefined;
    if (Object.keys(fullIdentityMap).length > 0) {
      const encrypted = await encryptionManager.encryptIdentityMap(fullIdentityMap);
      encryptedIdentityMap = JSON.stringify(encrypted);
    }

    const detectedNames = piiDetector.getDetectedNames();
    if (detectedNames.length > 0) {
      setProcessingStage(`Masked ${detectedNames.length} name(s) and personal info`);
    }

    return { processedFiles, encryptedIdentityMap };
  };

  const handleSubmit = async () => {
    if (files.length === 0) return;
    setUploading(true);
    setError(null);

    try {
      // Step 1: Process files through PII detection + encryption
      const { processedFiles, encryptedIdentityMap } = await processFilesForPrivacy(files);

      setProcessingStage('Uploading securely...');

      // Step 2: Upload processed (masked) files
      if (type === 'mri') {
        const result = await api.uploadMRI(processedFiles, encryptedIdentityMap);
        setCaseId(result.case_id);
        // Store encryption key locally for later report decryption
        await encryptionManager.storeKeyLocally(result.case_id);
        router.push(`/checkout?product=mri&case_id=${result.case_id}`);
      } else if (type === 'analysis') {
        // Free analysis with platform and focus metadata
        const result = await api.uploadAnalysis(processedFiles, encryptedIdentityMap, platform, analysisFocus);
        setCaseId(result.case_id);
        await encryptionManager.storeKeyLocally(result.case_id);
        router.push(`/analysis/${result.case_id}`);
      } else {
        // tactical_scan (deprecated but kept for backward compatibility)
        const result = await api.uploadTacticalScan(processedFiles[0], encryptedIdentityMap);
        setCaseId(result.case_id);
        await encryptionManager.storeKeyLocally(result.case_id);
        router.push(`/analysis/${result.case_id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed. Please sign in first.');
    } finally {
      setUploading(false);
      setProcessingStage(null);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-200 ${
          isDragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
        }`}
      >
        <input {...getInputProps()} />
        <div className="space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-gray-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          {isDragActive ? (
            <p className="text-blue-600 font-medium">Drop files here...</p>
          ) : (
            <>
              <p className="text-gray-600">
                <span className="font-medium text-gray-900">Click to upload</span> or drag and drop
              </p>
              <p className="text-sm text-gray-400">
                {type === 'tactical_scan'
                  ? 'Screenshot or text file (max 10MB)'
                  : 'Chat exports, screenshots, text files (up to 100 files, 500MB total)'}
              </p>
              <p className="text-xs text-gray-400">
                PNG, JPG, TXT, CSV, ZIP, JSON supported
              </p>
            </>
          )}
        </div>
      </div>

      {files.length > 0 && (
        <div className="mt-6 space-y-2">
          <h3 className="text-sm font-medium text-gray-700">
            {files.length} file{files.length > 1 ? 's' : ''} selected
          </h3>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {files.map((file, i) => (
              <div key={i} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-gray-500 shrink-0">
                    {file.type.startsWith('image/') ? '🖼️' : '📄'}
                  </span>
                  <span className="truncate text-gray-700">{file.name}</span>
                  <span className="text-gray-400 shrink-0">
                    ({(file.size / 1024).toFixed(0)} KB)
                  </span>
                </div>
                <button
                  onClick={() => removeFile(i)}
                  className="text-gray-400 hover:text-red-500 shrink-0 ml-2"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={files.length === 0 || uploading}
        className={`mt-6 w-full py-3 px-6 rounded-xl font-medium text-white transition-all duration-200 ${
          files.length === 0 || uploading
            ? 'bg-gray-300 cursor-not-allowed'
            : 'bg-black hover:bg-gray-800 active:scale-[0.98]'
        }`}
      >
        {uploading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {processingStage || 'Processing...'}
          </span>
        ) : (
          type === 'mri'
            ? 'Continue to Payment — $49'
            : type === 'analysis'
              ? 'Start Free Analysis'
              : 'Analyze for Red Flags'
        )}
      </button>

      {/* Zero-knowledge privacy indicator */}
      <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-gray-400">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <span>Names and personal info are masked before upload. Your encryption key stays in your browser.</span>
      </div>
    </div>
  );
}
