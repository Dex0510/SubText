'use client';

import Link from 'next/link';

export default function OfferingsPage() {
  return (
    <div className="min-h-screen">
      <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto border-b">
        <Link href="/" className="text-xl font-bold tracking-tight">Subtext</Link>
        <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">Dashboard</Link>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Choose Your Analysis</h1>
          <p className="text-gray-500">Upload a chat conversation to get started. You can always upgrade later.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Free Analysis */}
          <div className="border rounded-2xl p-8 space-y-5 hover:shadow-lg transition-shadow">
            <div className="text-sm font-medium text-blue-600">Start Free</div>
            <h3 className="text-2xl font-bold">Free Analysis</h3>
            <div className="text-3xl font-bold">$0</div>
            <p className="text-gray-500 text-sm">
              Get basic communication pattern analysis with our AI-powered Scout agent.
              Results in ~5 minutes.
            </p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex gap-2"><span className="text-green-500">&#10003;</span> Communication pattern detection</li>
              <li className="flex gap-2"><span className="text-green-500">&#10003;</span> Red flag identification</li>
              <li className="flex gap-2"><span className="text-green-500">&#10003;</span> Basic Gottman analysis</li>
              <li className="flex gap-2"><span className="text-green-500">&#10003;</span> Timeline insights</li>
              <li className="flex gap-2"><span className="text-green-500">&#10003;</span> Platform-specific export guide</li>
            </ul>
            <Link
              href="/scan"
              className="block text-center py-3 border-2 border-black text-black rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              Start Free Analysis
            </Link>
          </div>

          {/* Pro Features */}
          <div className="border-2 border-black rounded-2xl p-8 space-y-5 relative hover:shadow-lg transition-shadow">
            <div className="absolute -top-3 right-6 px-3 py-1 bg-black text-white text-xs font-medium rounded-full">
              Most Popular
            </div>
            <div className="text-sm font-medium text-purple-600">Full Suite</div>
            <h3 className="text-2xl font-bold">Pro Features</h3>
            <div className="text-3xl font-bold">$20 <span className="text-sm font-normal text-gray-400">per conversation</span></div>
            <p className="text-gray-500 text-sm">
              Unlock Deep Analysis, MRI Q&A, and Chat Recommender for comprehensive forensic insights.
            </p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex gap-2"><span className="text-green-500">&#10003;</span> Everything in Free Analysis</li>
              <li className="flex gap-2"><span className="text-green-500">&#10003;</span> Deep Analysis (5-agent forensic council)</li>
              <li className="flex gap-2"><span className="text-green-500">&#10003;</span> MRI Q&A (2 free queries included)</li>
              <li className="flex gap-2"><span className="text-green-500">&#10003;</span> Chat Recommender (pay-per-use)</li>
              <li className="flex gap-2"><span className="text-green-500">&#10003;</span> Gottman Scorecard + Attachment Map</li>
              <li className="flex gap-2"><span className="text-green-500">&#10003;</span> Pattern Analysis + Action Guide</li>
            </ul>
            <Link
              href="/scan"
              className="block text-center py-3 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
            >
              Start Analysis &rarr; Upgrade Later
            </Link>
            <p className="text-xs text-gray-400 text-center">Upload your chat first — upgrade to Pro from results page</p>
          </div>
        </div>

        {/* MRI Unlimited Add-on */}
        <div className="mt-8 bg-gray-50 rounded-2xl p-6 flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-gray-900">MRI Unlimited Add-on</h4>
            <p className="text-sm text-gray-500">After 2 free MRI queries, unlock unlimited Q&A for $10/conversation</p>
          </div>
          <div className="text-lg font-bold text-gray-700">+$10</div>
        </div>
      </div>
    </div>
  );
}
