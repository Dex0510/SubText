'use client';

import { use } from 'react';
import Link from 'next/link';
import { AnalysisProgress } from '@/components/AnalysisProgress';

export default function AnalysisPage({ params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = use(params);

  return (
    <div className="min-h-screen">
      <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto border-b">
        <Link href="/" className="text-xl font-bold tracking-tight">Subtext</Link>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-20 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">Analyzing your conversation</h1>
          <p className="text-gray-500">Our AI council is examining your communication patterns</p>
        </div>

        <AnalysisProgress caseId={caseId} />
      </div>
    </div>
  );
}
