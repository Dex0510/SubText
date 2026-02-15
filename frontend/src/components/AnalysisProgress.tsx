'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface AnalysisProgressProps {
  caseId: string;
}

const STAGE_LABELS: Record<string, string> = {
  queued: 'In queue...',
  'Retrieving files': 'Preparing your data...',
  'Parsing files': 'Reading your messages...',
  'Building timeline': 'Building conversation timeline...',
  'Analyzing for red flags': 'Scanning for red flags...',
  'Identifying critical episodes': 'Identifying critical moments...',
  'Running deep analysis (Clinician)': 'Analyzing communication patterns...',
  'Storing analysis results': 'Processing results...',
  'Verifying findings': 'Cross-checking with evidence...',
  'Generating report': 'Creating your report...',
  'Finalizing': 'Putting finishing touches...',
  Complete: 'Analysis complete!',
};

export function AnalysisProgress({ caseId }: AnalysisProgressProps) {
  const [status, setStatus] = useState('queued');
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState('queued');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const data = await api.getStatus(caseId);
        setStatus(data.status);
        setProgress(data.progress);
        setStage(data.stage);

        if (data.status === 'completed') {
          clearInterval(interval);
          // Redirect to conversation page if we have a conversation_id, otherwise report
          const target = data.conversation_id
            ? `/conversation/${data.conversation_id}`
            : `/report/${caseId}`;
          setTimeout(() => router.push(target), 1500);
        } else if (data.status === 'failed') {
          clearInterval(interval);
          setError('Analysis failed. Please try again.');
        }
      } catch {
        // Silently retry
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [caseId, router]);

  const stageLabel = STAGE_LABELS[stage] || stage;

  return (
    <div className="w-full max-w-lg mx-auto text-center space-y-8">
      {/* Animated orb */}
      <div className="relative w-32 h-32 mx-auto">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 animate-pulse opacity-20" />
        <div className="absolute inset-2 rounded-full bg-gradient-to-br from-blue-500 to-purple-700 animate-pulse opacity-40" style={{ animationDelay: '0.5s' }} />
        <div className="absolute inset-4 rounded-full bg-gradient-to-br from-blue-600 to-purple-800 flex items-center justify-center">
          <span className="text-white text-2xl font-bold">{Math.round(progress)}%</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-gray-600 text-sm">{stageLabel}</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-red-700">{error}</p>
          <button
            onClick={() => router.push('/scan')}
            className="mt-3 text-sm text-red-600 underline"
          >
            Try again
          </button>
        </div>
      )}

      {status === 'completed' && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
          <p className="text-green-700 font-medium">Your report is ready!</p>
          <p className="text-green-600 text-sm mt-1">Redirecting...</p>
        </div>
      )}

      <p className="text-xs text-gray-400">
        Your data is encrypted end-to-end. We cannot see your conversations.
      </p>
    </div>
  );
}
