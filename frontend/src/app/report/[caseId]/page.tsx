'use client';

import { use } from 'react';
import Link from 'next/link';
import { ReportViewer } from '@/components/ReportViewer';

export default function ReportPage({ params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = use(params);

  return (
    <div className="min-h-screen bg-white">
      <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto border-b sticky top-0 bg-white/80 backdrop-blur-sm z-10">
        <Link href="/" className="text-xl font-bold tracking-tight">Subtext</Link>
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">Dashboard</Link>
          <Link href="/scan" className="text-sm bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800">
            New Analysis
          </Link>
        </div>
      </nav>

      <div className="px-6 py-8">
        <ReportViewer caseId={caseId} />
      </div>
    </div>
  );
}
