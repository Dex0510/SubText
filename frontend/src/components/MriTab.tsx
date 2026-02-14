'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface MriTabProps {
  conversationId: string;
  queries: Array<{
    query_id: string;
    question: string;
    answer: string | null;
    status: string;
    created_at: string;
  }>;
  queriesUsed: number;
  isUnlimited: boolean;
  onRefresh: () => void;
}

const FREE_QUERIES = 2;

export function MriTab({ conversationId, queries, queriesUsed, isUnlimited, onRefresh }: MriTabProps) {
  const router = useRouter();
  const [question, setQuestion] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [upgradingMri, setUpgradingMri] = useState(false);

  const freeRemaining = isUnlimited ? null : Math.max(0, FREE_QUERIES - queriesUsed);
  const needsUpgrade = !isUnlimited && queriesUsed >= FREE_QUERIES;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || submitting) return;

    setSubmitting(true);
    setError('');
    try {
      await api.submitMriQuery(conversationId, question.trim());
      setQuestion('');
      // Poll for result or refresh
      setTimeout(onRefresh, 2000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to submit question';
      if (msg.includes('exhausted')) {
        setError('Free MRI queries exhausted. Upgrade to Unlimited for $10.');
      } else {
        setError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpgradeMri = async () => {
    setUpgradingMri(true);
    try {
      const payment = await api.createPaymentIntent('mri_unlimited', conversationId);
      router.push(`/payment?client_secret=${payment.client_secret}&conversation_id=${conversationId}&product=mri_unlimited`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setUpgradingMri(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">MRI Q&A</h2>
        <div className="flex items-center gap-3">
          {freeRemaining !== null ? (
            <span className="text-xs text-gray-500">
              {freeRemaining} of {FREE_QUERIES} free queries remaining
            </span>
          ) : (
            <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">Unlimited</span>
          )}
        </div>
      </div>

      {/* Q&A History */}
      <div className="space-y-4">
        {queries.length === 0 && (
          <div className="text-center py-8 text-gray-400 text-sm">
            No questions yet. Ask something about your relationship below.
          </div>
        )}

        {queries.map(q => (
          <div key={q.query_id} className="space-y-2">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-blue-600">Q</span>
              </div>
              <p className="text-sm text-gray-900 font-medium">{q.question}</p>
            </div>
            <div className="flex items-start gap-3 pl-0.5">
              <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-purple-600">A</span>
              </div>
              {q.status === 'completed' && q.answer ? (
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{q.answer}</p>
              ) : q.status === 'failed' ? (
                <p className="text-sm text-red-500">Failed to generate answer. Please try again.</p>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="animate-spin h-4 w-4 border border-gray-300 border-t-purple-600 rounded-full" />
                  <span className="text-sm text-gray-400">Generating answer...</span>
                </div>
              )}
            </div>
            <div className="border-b ml-9" />
          </div>
        ))}
      </div>

      {/* MRI Unlimited Paywall */}
      {needsUpgrade && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 text-center space-y-3">
          <h3 className="font-semibold text-gray-900">Unlock Unlimited MRI</h3>
          <p className="text-sm text-gray-500">Your 2 free queries are used. Get unlimited Q&A for this conversation.</p>
          <button
            onClick={handleUpgradeMri}
            disabled={upgradingMri}
            className="px-6 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            {upgradingMri ? 'Processing...' : 'Unlock Unlimited MRI — $10'}
          </button>
        </div>
      )}

      {/* Question Input */}
      {!needsUpgrade && (
        <form onSubmit={handleSubmit} className="flex gap-3">
          <input
            type="text"
            value={question}
            onChange={e => setQuestion(e.target.value)}
            placeholder="Ask a question about your relationship..."
            className="flex-1 px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            disabled={submitting}
          />
          <button
            type="submit"
            disabled={!question.trim() || submitting}
            className="px-6 py-3 bg-black text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {submitting ? '...' : 'Submit'}
          </button>
        </form>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
