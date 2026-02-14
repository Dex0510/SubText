'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

interface ConversationRecord {
  conversation_id: string;
  contact_name: string;
  pro_purchased: boolean;
  mri_queries_used: number;
  mri_unlimited: boolean;
  created_at: string;
  last_analyzed_at: string | null;
  deep_analysis_completed: boolean;
  recommendation_count: number;
}

export default function DashboardPage() {
  const [conversations, setConversations] = useState<ConversationRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const data = await api.getConversations();
      setConversations(data.conversations);
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  const getProBadge = (conv: ConversationRecord) => {
    if (conv.mri_unlimited) return { label: 'Pro + MRI \u221E', style: 'bg-purple-100 text-purple-700' };
    if (conv.pro_purchased) return { label: 'Pro \u2713', style: 'bg-purple-100 text-purple-700' };
    return { label: 'Free', style: 'bg-gray-100 text-gray-600' };
  };

  return (
    <div className="min-h-screen">
      <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto border-b">
        <Link href="/" className="text-xl font-bold tracking-tight">Subtext</Link>
        <Link href="/scan" className="text-sm bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800">
          + New Analysis
        </Link>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">My Conversations</h1>

        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin h-8 w-8 border-2 border-gray-300 border-t-black rounded-full mx-auto" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-16 space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-gray-500">No conversations yet</p>
            <Link
              href="/scan"
              className="inline-block px-6 py-3 bg-black text-white rounded-xl font-medium hover:bg-gray-800"
            >
              Start Your First Analysis
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {conversations.map((conv) => {
              const badge = getProBadge(conv);
              return (
                <Link
                  key={conv.conversation_id}
                  href={`/conversation/${conv.conversation_id}`}
                  className="flex items-center justify-between p-5 border rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-gray-900">{conv.contact_name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.style}`}>
                        {badge.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span>
                        {conv.last_analyzed_at
                          ? `Last analyzed: ${new Date(conv.last_analyzed_at).toLocaleDateString('en-US', {
                              month: 'short', day: 'numeric', year: 'numeric',
                            })}`
                          : `Created: ${new Date(conv.created_at).toLocaleDateString('en-US', {
                              month: 'short', day: 'numeric', year: 'numeric',
                            })}`
                        }
                      </span>
                      {conv.mri_queries_used > 0 && (
                        <span>{conv.mri_queries_used} MRI {conv.mri_queries_used === 1 ? 'query' : 'queries'}</span>
                      )}
                      {conv.deep_analysis_completed && (
                        <span>Deep Analysis \u2713</span>
                      )}
                      {conv.recommendation_count > 0 && (
                        <span>Chat Rec \u00D7{conv.recommendation_count}</span>
                      )}
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
