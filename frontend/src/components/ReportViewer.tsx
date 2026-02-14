'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { encryptionManager } from '@/lib/encryption';

interface ReportViewerProps {
  caseId: string;
}

interface ReportData {
  case_id: string;
  report_type: string;
  generated_at: string;
  chapters: Array<{
    title: string;
    sections: Array<{
      heading: string;
      type: string;
      content: unknown;
    }>;
  }>;
  metadata: {
    total_messages: number;
    date_range: { start: string | null; end: string | null };
    senders: string[];
    overall_confidence: number;
    overall_health_score: number;
  };
}

export function ReportViewer({ caseId }: ReportViewerProps) {
  const [report, setReport] = useState<ReportData | null>(null);
  const [identityMap, setIdentityMap] = useState<Record<string, string> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadReport();
  }, [caseId]);

  // Unmask tokenized names in text using the decrypted identity map
  const unmask = (text: string): string => {
    if (!identityMap) return text;
    let result = text;
    for (const [token, original] of Object.entries(identityMap)) {
      result = result.replaceAll(token, original);
    }
    return result;
  };

  const loadReport = async () => {
    try {
      const data = await api.getReport(caseId);

      // Attempt to decrypt the identity map using the locally stored key
      if (data.encrypted_identity_map) {
        try {
          await encryptionManager.retrieveKeyFromStorage(caseId);
          const decryptedMap = await encryptionManager.decryptIdentityMap(
            typeof data.encrypted_identity_map === 'string'
              ? JSON.parse(data.encrypted_identity_map)
              : data.encrypted_identity_map as { iv: number[]; ciphertext: number[] }
          );
          setIdentityMap(decryptedMap);
        } catch {
          // Key not available — show report with tokenized names
          console.warn('Could not decrypt identity map. Showing tokenized report.');
        }
      }

      setReport(data.report_data as ReportData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin h-8 w-8 border-2 border-gray-300 border-t-black rounded-full" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="text-center py-16">
        <p className="text-red-600">{error || 'Report not found'}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Report Header */}
      <div className="text-center space-y-4 pb-8 border-b">
        <h1 className="text-3xl font-bold text-gray-900">
          {report.report_type === 'mri' ? 'Relationship MRI Report' : 'Tactical Scan Report'}
        </h1>
        <p className="text-gray-500 text-sm">
          Generated {new Date(report.generated_at).toLocaleDateString()} | Case #{report.case_id.slice(0, 8)}
        </p>

        {/* Health Score */}
        <div className="inline-flex items-center gap-4 bg-gray-50 rounded-2xl px-8 py-4">
          <div className="text-center">
            <div className={`text-4xl font-bold ${
              report.metadata.overall_health_score >= 70 ? 'text-green-600' :
              report.metadata.overall_health_score >= 40 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {report.metadata.overall_health_score}
            </div>
            <div className="text-xs text-gray-500 mt-1">Health Score</div>
          </div>
          <div className="h-12 w-px bg-gray-200" />
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-700">{report.metadata.total_messages}</div>
            <div className="text-xs text-gray-500 mt-1">Messages Analyzed</div>
          </div>
          <div className="h-12 w-px bg-gray-200" />
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-700">{report.metadata.overall_confidence}%</div>
            <div className="text-xs text-gray-500 mt-1">Confidence</div>
          </div>
        </div>
      </div>

      {/* Chapters */}
      {report.chapters.map((chapter, ci) => (
        <div key={ci} className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-900 border-b pb-2">
            {chapter.title}
          </h2>
          {chapter.sections.map((section, si) => (
            <div key={si} className="space-y-3">
              <h3 className="text-lg font-medium text-gray-800">{section.heading}</h3>
              <SectionContent type={section.type} content={section.content} />
            </div>
          ))}
        </div>
      ))}

      {/* Footer */}
      <div className="text-center py-8 border-t space-y-2">
        <p className="text-xs text-gray-400">
          This analysis identifies patterns consistent with established relationship research frameworks.
          It is not a clinical diagnosis. Consult a qualified professional for personalized guidance.
        </p>
        <p className="text-xs text-gray-400">
          Powered by Subtext | Zero-Knowledge Architecture | Your data is never stored
        </p>
      </div>
    </div>
  );
}

function SectionContent({ type, content }: { type: string; content: unknown }) {
  if (type === 'text') {
    if (typeof content === 'string') {
      return <p className="text-gray-600 leading-relaxed">{content}</p>;
    }
    if (typeof content === 'object' && content !== null) {
      return (
        <div className="bg-gray-50 rounded-xl p-4 space-y-2">
          {Object.entries(content as Record<string, unknown>).map(([key, value]) => (
            <div key={key}>
              <span className="font-medium text-gray-700 capitalize">{key.replace(/_/g, ' ')}: </span>
              <span className="text-gray-600">{typeof value === 'string' ? value : JSON.stringify(value)}</span>
            </div>
          ))}
        </div>
      );
    }
  }

  if (type === 'score') {
    const scoreData = content as Record<string, unknown>;
    const score = Number(scoreData.score || 0);
    const color = score >= 70 ? 'bg-green-500' : score >= 40 ? 'bg-yellow-500' : 'bg-red-500';
    return (
      <div className="bg-gray-50 rounded-xl p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div className={`h-3 rounded-full ${color} transition-all duration-500`} style={{ width: `${score}%` }} />
            </div>
          </div>
          <span className="font-bold text-lg text-gray-700">{score}/100</span>
        </div>
        {scoreData.description ? (
          <p className="text-sm text-gray-500 mt-2">{String(scoreData.description)}</p>
        ) : null}
      </div>
    );
  }

  if (type === 'list') {
    if (Array.isArray(content)) {
      return (
        <ul className="space-y-2">
          {content.map((item, i) => (
            <li key={i} className="flex gap-2 text-gray-600">
              <span className="text-gray-400 shrink-0">•</span>
              <span>{typeof item === 'string' ? item : JSON.stringify(item)}</span>
            </li>
          ))}
        </ul>
      );
    }
    if (typeof content === 'object' && content !== null) {
      const obj = content as Record<string, unknown>;
      return (
        <div className="bg-gray-50 rounded-xl p-4 space-y-2">
          {Object.entries(obj).map(([key, value]) => (
            <div key={key} className="flex gap-2">
              <span className="font-medium text-gray-700 capitalize shrink-0">{key.replace(/_/g, ' ')}:</span>
              <span className="text-gray-600">
                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
              </span>
            </div>
          ))}
        </div>
      );
    }
  }

  if (type === 'table') {
    if (typeof content === 'object' && content !== null) {
      return (
        <div className="overflow-x-auto">
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            {Object.entries(content as Record<string, unknown>).map(([key, value]) => (
              <div key={key} className="flex justify-between py-1 border-b border-gray-100 last:border-0">
                <span className="text-gray-600 capitalize">{key.replace(/_/g, ' ')}</span>
                <span className="font-medium text-gray-800">
                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
  }

  if (type === 'chart_data') {
    const chartData = content as Record<string, unknown>;
    return (
      <div className="bg-gray-50 rounded-xl p-4 text-center text-gray-500 text-sm">
        Chart: {String(chartData.chart_type || 'visualization')} — {String(chartData.description || 'Data visualization')}
        {chartData.data ? (
          <div className="mt-3 space-y-1">
            {Object.entries(chartData.data as Record<string, number>).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2">
                <span className="w-32 text-right text-xs capitalize">{key}</span>
                <div className="flex-1 bg-gray-200 rounded-full h-4">
                  <div
                    className="h-4 rounded-full bg-blue-500"
                    style={{ width: `${Math.min(value * 5, 100)}%` }}
                  />
                </div>
                <span className="w-12 text-xs">{value}</span>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  // Fallback
  return (
    <pre className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600 overflow-x-auto">
      {JSON.stringify(content, null, 2)}
    </pre>
  );
}
