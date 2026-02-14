'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useConversationViewStore, TabType } from '@/lib/store';
import { DeepAnalysisTab } from '@/components/DeepAnalysisTab';
import { MriTab } from '@/components/MriTab';
import { ChatRecommenderTab } from '@/components/ChatRecommenderTab';

interface ConversationData {
  conversation: {
    conversation_id: string;
    contact_name: string;
    pro_purchased: boolean;
    mri_queries_used: number;
    mri_unlimited: boolean;
    created_at: string;
    last_analyzed_at: string | null;
  };
  cases: Array<{
    case_id: string;
    case_type: string;
    status: string;
    created_at: string;
    completed_at: string | null;
  }>;
  analysis_report: unknown;
  deep_analysis_report: unknown;
  mri_queries: Array<{
    query_id: string;
    question: string;
    answer: string | null;
    status: string;
    created_at: string;
  }>;
  chat_recommendations: Array<{
    recommendation_id: string;
    recommendation: string | null;
    tokens_used: number;
    cost_cents: number;
    status: string;
    created_at: string;
  }>;
  encrypted_identity_map: unknown;
}

const TABS: { id: TabType; label: string; proOnly: boolean }[] = [
  { id: 'analysis', label: 'Analysis', proOnly: false },
  { id: 'deep-analysis', label: 'Deep Analysis', proOnly: true },
  { id: 'mri', label: 'MRI', proOnly: true },
  { id: 'chat-recommender', label: 'Chat Recommender', proOnly: true },
];

export default function ConversationPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.id as string;
  const { activeTab, setActiveTab } = useConversationViewStore();
  const [data, setData] = useState<ConversationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [upgrading, setUpgrading] = useState(false);

  const loadConversation = useCallback(async () => {
    try {
      const result = await api.getConversation(conversationId);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load conversation');
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    loadConversation();
  }, [loadConversation]);

  const handleUpgradeToPro = async () => {
    setUpgrading(true);
    try {
      const payment = await api.createPaymentIntent('pro_features', conversationId);
      // Redirect to payment page with the client secret
      router.push(`/payment?client_secret=${payment.client_secret}&conversation_id=${conversationId}&product=pro_features`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setUpgrading(false);
    }
  };

  const handleTabClick = (tab: TabType) => {
    if (!data) return;

    const tabConfig = TABS.find(t => t.id === tab);
    if (tabConfig?.proOnly && !data.conversation.pro_purchased) {
      // Show upgrade prompt instead of switching
      return;
    }

    setActiveTab(tab);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-gray-300 border-t-black rounded-full" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-red-500">{error || 'Conversation not found'}</p>
          <Link href="/dashboard" className="text-sm text-blue-600 hover:underline">Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  const { conversation } = data;
  const analysisCase = data.cases.find(c => c.case_type === 'analysis');
  const isAnalysisProcessing = analysisCase && (analysisCase.status === 'queued' || analysisCase.status === 'processing');

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto border-b">
        <Link href="/dashboard" className="text-xl font-bold tracking-tight">Subtext</Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{conversation.contact_name}</span>
          {conversation.pro_purchased ? (
            <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full font-medium">Pro</span>
          ) : (
            <button
              onClick={handleUpgradeToPro}
              disabled={upgrading}
              className="text-xs px-3 py-1 bg-black text-white rounded-full font-medium hover:bg-gray-800 disabled:opacity-50"
            >
              {upgrading ? 'Processing...' : 'Upgrade to Pro — $20'}
            </button>
          )}
        </div>
      </nav>

      {/* Tabs */}
      <div className="max-w-5xl mx-auto px-6 pt-6">
        <div className="flex border-b">
          {TABS.map(tab => {
            const isLocked = tab.proOnly && !conversation.pro_purchased;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`
                  px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5
                  ${isActive ? 'border-black text-black' : 'border-transparent text-gray-400 hover:text-gray-600'}
                  ${isLocked ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                {tab.label}
                {isLocked && (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        {activeTab === 'analysis' && (
          <AnalysisTabContent
            analysisReport={data.analysis_report}
            isProcessing={!!isAnalysisProcessing}
            caseId={analysisCase?.case_id}
          />
        )}

        {activeTab === 'deep-analysis' && (
          conversation.pro_purchased ? (
            <DeepAnalysisTab
              conversationId={conversationId}
              deepAnalysisReport={data.deep_analysis_report}
              cases={data.cases}
              onRefresh={loadConversation}
            />
          ) : (
            <LockedTabContent
              feature="Deep Analysis"
              description="Get comprehensive multi-agent forensic insights including Gottman Scorecard, Attachment Map, Communication Audit, Pattern Analysis, Red Flags Report, and Action Guide."
              onUpgrade={handleUpgradeToPro}
              upgrading={upgrading}
            />
          )
        )}

        {activeTab === 'mri' && (
          conversation.pro_purchased ? (
            <MriTab
              conversationId={conversationId}
              queries={data.mri_queries}
              queriesUsed={conversation.mri_queries_used}
              isUnlimited={conversation.mri_unlimited}
              onRefresh={loadConversation}
            />
          ) : (
            <LockedTabContent
              feature="MRI Q&A"
              description="Ask questions about your relationship and get AI-powered answers based on your conversation data. Includes 2 free queries with Pro, with unlimited available for +$10."
              onUpgrade={handleUpgradeToPro}
              upgrading={upgrading}
            />
          )
        )}

        {activeTab === 'chat-recommender' && (
          conversation.pro_purchased ? (
            <ChatRecommenderTab
              conversationId={conversationId}
              recommendations={data.chat_recommendations}
              onRefresh={loadConversation}
            />
          ) : (
            <LockedTabContent
              feature="Chat Recommender"
              description="Upload a screenshot of a conversation and get a recommended reply based on your relationship patterns and communication history."
              onUpgrade={handleUpgradeToPro}
              upgrading={upgrading}
            />
          )
        )}
      </div>
    </div>
  );
}

function AnalysisTabContent({
  analysisReport,
  isProcessing,
  caseId,
}: {
  analysisReport: unknown;
  isProcessing: boolean;
  caseId?: string;
}) {
  if (isProcessing && caseId) {
    return (
      <div className="text-center py-16 space-y-4">
        <div className="animate-spin h-8 w-8 border-2 border-gray-300 border-t-black rounded-full mx-auto" />
        <p className="text-gray-500">Analysis in progress...</p>
        <p className="text-xs text-gray-400">This usually takes about 5 minutes</p>
      </div>
    );
  }

  if (!analysisReport) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="text-gray-500">No analysis results yet.</p>
      </div>
    );
  }

  // Render analysis report data
  const report = analysisReport as Record<string, unknown>;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Analysis Results</h2>
        <div className="bg-gray-50 rounded-xl p-6 space-y-4">
          {report.sections ? (
            (report.sections as Array<{ title: string; content: string }>).map((section, i) => (
              <div key={i} className="space-y-2">
                <h3 className="font-semibold text-gray-800">{section.title}</h3>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{section.content}</p>
              </div>
            ))
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-gray-600 whitespace-pre-wrap">
                {typeof report === 'object' ? JSON.stringify(report, null, 2) : String(report)}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LockedTabContent({
  feature,
  description,
  onUpgrade,
  upgrading,
}: {
  feature: string;
  description: string;
  onUpgrade: () => void;
  upgrading: boolean;
}) {
  return (
    <div className="text-center py-16 space-y-6 max-w-md mx-auto">
      <div className="w-16 h-16 mx-auto rounded-full bg-gray-100 flex items-center justify-center">
        <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-bold text-gray-900">{feature}</h3>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <button
        onClick={onUpgrade}
        disabled={upgrading}
        className="px-6 py-3 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
      >
        {upgrading ? 'Processing...' : 'Unlock Pro Features — $20'}
      </button>
    </div>
  );
}
