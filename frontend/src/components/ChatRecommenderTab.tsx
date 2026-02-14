'use client';

import { useState, useRef } from 'react';
import { api } from '@/lib/api';

interface ChatRecommenderTabProps {
  conversationId: string;
  recommendations: Array<{
    recommendation_id: string;
    recommendation: string | null;
    tokens_used: number;
    cost_cents: number;
    status: string;
    created_at: string;
  }>;
  onRefresh: () => void;
}

export function ChatRecommenderTab({ conversationId, recommendations, onRefresh }: ChatRecommenderTabProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [estimatedCost, setEstimatedCost] = useState<number | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPreviewUrl(ev.target?.result as string);
    };
    reader.readAsDataURL(file);

    setUploading(true);
    setError('');
    try {
      // Upload screenshot
      const uploadResult = await api.uploadChatRecommendScreenshot(file, conversationId);

      // Submit for recommendation
      const result = await api.submitChatRecommendation(conversationId, uploadResult.screenshot_key);
      setEstimatedCost(result.estimated_cost_cents);
      setProcessing(true);

      // Poll for result
      const pollInterval = setInterval(async () => {
        try {
          const rec = await api.getChatRecommendationResult(conversationId, result.recommendation_id);
          if (rec.status === 'completed' || rec.status === 'failed') {
            clearInterval(pollInterval);
            setProcessing(false);
            setPreviewUrl(null);
            setEstimatedCost(null);
            onRefresh();
          }
        } catch {
          clearInterval(pollInterval);
          setProcessing(false);
        }
      }, 3000);

      // Cleanup after 2 minutes max
      setTimeout(() => clearInterval(pollInterval), 120000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setPreviewUrl(null);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900">Chat Recommender</h2>

      {/* Upload Area */}
      <div className="border-2 border-dashed rounded-xl p-8 text-center space-y-3">
        {previewUrl ? (
          <div className="space-y-3">
            <img src={previewUrl} alt="Screenshot preview" className="max-h-64 mx-auto rounded-lg shadow" />
            {processing && (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin h-4 w-4 border border-gray-300 border-t-purple-600 rounded-full" />
                <span className="text-sm text-gray-500">
                  Analyzing screenshot and generating recommendation...
                  {estimatedCost !== null && ` (~$${(estimatedCost / 100).toFixed(2)})`}
                </span>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="w-12 h-12 mx-auto rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-sm text-gray-600 font-medium">Upload a screenshot of the conversation</p>
            <p className="text-xs text-gray-400">PNG, JPG, or HEIC • Pay-per-use (~$0.15 per recommendation)</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="px-6 py-2 bg-black text-white text-sm rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {uploading ? 'Uploading...' : 'Choose Screenshot'}
            </button>
          </>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/heic"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* History */}
      {recommendations.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-700 text-sm">Previous Recommendations</h3>
          {recommendations.map(rec => (
            <div key={rec.recommendation_id} className="border rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  {new Date(rec.created_at).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                  })}
                </span>
                <span className="text-xs text-gray-400">
                  {rec.cost_cents > 0 ? `$${(rec.cost_cents / 100).toFixed(2)}` : ''}
                </span>
              </div>
              {rec.status === 'completed' && rec.recommendation ? (
                <div className="bg-green-50 rounded-lg p-3">
                  <p className="text-sm font-medium text-gray-700 mb-1">Recommended Reply:</p>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{rec.recommendation}</p>
                </div>
              ) : rec.status === 'failed' ? (
                <p className="text-sm text-red-500">Failed to generate recommendation.</p>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="animate-spin h-4 w-4 border border-gray-300 border-t-purple-600 rounded-full" />
                  <span className="text-sm text-gray-400">Processing...</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
