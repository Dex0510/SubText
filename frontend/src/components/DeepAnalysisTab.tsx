'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

interface DeepAnalysisTabProps {
  conversationId: string;
  deepAnalysisReport: unknown;
  cases: Array<{
    case_id: string;
    case_type: string;
    status: string;
    created_at: string;
    completed_at: string | null;
  }>;
  onRefresh: () => void;
}

export function DeepAnalysisTab({ conversationId, deepAnalysisReport, cases, onRefresh }: DeepAnalysisTabProps) {
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');

  const deepAnalysisCase = cases.find(c => c.case_type === 'deep_analysis');
  const isProcessing = deepAnalysisCase && (deepAnalysisCase.status === 'queued' || deepAnalysisCase.status === 'processing');

  const handleRun = async () => {
    setRunning(true);
    setError('');
    try {
      await api.runDeepAnalysis(conversationId);
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start deep analysis');
    } finally {
      setRunning(false);
    }
  };

  if (isProcessing) {
    return (
      <div className="text-center py-16 space-y-4">
        <div className="animate-spin h-8 w-8 border-2 border-gray-300 border-t-purple-600 rounded-full mx-auto" />
        <p className="text-gray-600 font-medium">Deep analysis in progress...</p>
        <p className="text-xs text-gray-400">This typically takes 10-20 minutes. The 5-agent council is reviewing your data.</p>
        <button onClick={onRefresh} className="text-sm text-blue-600 hover:underline">Refresh</button>
      </div>
    );
  }

  if (deepAnalysisReport) {
    const report = deepAnalysisReport as Record<string, unknown>;
    const sections = [
      { key: 'gottman_scorecard', title: 'Gottman Scorecard', icon: '📊' },
      { key: 'attachment_map', title: 'Attachment Map', icon: '🗺️' },
      { key: 'communication_audit', title: 'Communication Audit', icon: '🔍' },
      { key: 'pattern_analysis', title: 'Pattern Analysis', icon: '🔄' },
      { key: 'red_flags', title: 'Red Flags Report', icon: '🚩' },
      { key: 'action_guide', title: 'Action Guide', icon: '📋' },
    ];

    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Deep Analysis Results</h2>
          <button
            onClick={handleRun}
            disabled={running}
            className="text-sm px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Re-run Analysis
          </button>
        </div>

        {report.sections ? (
          (report.sections as Array<{ title: string; content: string }>).map((section, i) => (
            <div key={i} className="bg-white border rounded-xl p-6 space-y-3">
              <h3 className="font-semibold text-gray-900 text-lg">{sections[i]?.icon || '📋'} {section.title}</h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{section.content}</p>
            </div>
          ))
        ) : (
          <div className="bg-gray-50 rounded-xl p-6">
            <pre className="text-sm text-gray-600 whitespace-pre-wrap">
              {typeof report === 'object' ? JSON.stringify(report, null, 2) : String(report)}
            </pre>
          </div>
        )}
      </div>
    );
  }

  // No deep analysis yet — show Run button
  return (
    <div className="text-center py-16 space-y-6 max-w-md mx-auto">
      <div className="space-y-2">
        <h3 className="text-lg font-bold text-gray-900">Deep Analysis</h3>
        <p className="text-sm text-gray-500">
          Run a comprehensive multi-agent forensic analysis including Gottman Scorecard, Attachment Map,
          Communication Audit, Pattern Analysis, Red Flags Report, and Action Guide.
        </p>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        onClick={handleRun}
        disabled={running}
        className="px-8 py-4 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors disabled:opacity-50"
      >
        {running ? 'Starting...' : 'Run Deep Analysis'}
      </button>
      <p className="text-xs text-gray-400">Estimated time: 10-20 minutes</p>
    </div>
  );
}
