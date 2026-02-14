'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const caseId = searchParams.get('case_id');
  const paymentId = searchParams.get('payment_id');

  return (
    <div className="min-h-screen">
      <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto border-b">
        <Link href="/" className="text-xl font-bold tracking-tight">Subtext</Link>
      </nav>

      <div className="max-w-lg mx-auto px-6 py-20 text-center space-y-6">
        <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">Payment Successful!</h1>
          <p className="text-gray-500">
            Your payment has been processed. {caseId ? 'Your analysis will begin shortly.' : 'You can now upload your conversation for analysis.'}
          </p>
        </div>

        {paymentId && (
          <p className="text-xs text-gray-400">
            Payment ID: {paymentId}
          </p>
        )}

        <div className="flex flex-col gap-3 max-w-xs mx-auto pt-4">
          {caseId ? (
            <Link
              href={`/analysis/${caseId}`}
              className="py-3 px-6 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
            >
              View Analysis Progress
            </Link>
          ) : (
            <Link
              href="/scan"
              className="py-3 px-6 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
            >
              Upload Your Conversation
            </Link>
          )}
          <Link
            href="/dashboard"
            className="py-3 px-6 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-gray-300 border-t-black rounded-full" />
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}
