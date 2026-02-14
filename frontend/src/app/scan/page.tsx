'use client';

import Link from 'next/link';
import { AnalysisJourney } from '@/components/AnalysisJourney';

export default function ScanPage() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto border-b bg-white">
        <Link href="/" className="text-xl font-bold tracking-tight">Subtext</Link>
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">Dashboard</Link>
        </div>
      </nav>

      {/* Analysis Journey */}
      <AnalysisJourney />
    </div>
  );
}
