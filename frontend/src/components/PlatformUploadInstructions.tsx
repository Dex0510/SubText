'use client';

import { PLATFORMS, Platform, AnalysisFocus } from '@/lib/platformInstructions';
import { UploadZone } from './UploadZone';

interface PlatformUploadInstructionsProps {
  platform: Platform;
  analysisFocus: AnalysisFocus;
}

export function PlatformUploadInstructions({
  platform,
  analysisFocus
}: PlatformUploadInstructionsProps) {
  const platformInfo = PLATFORMS[platform];
  const instructions = platformInfo.exportInstructions;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">
          Export Your Chat
        </h2>
        <p className="text-gray-500">
          Follow the steps below to export your {platformInfo.name} conversation
        </p>
      </div>

      {/* Two-column layout: Instructions + Upload */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Left: Export Instructions */}
        <div className="space-y-6">
          {/* Platform Badge */}
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div className="text-3xl">{platformInfo.icon}</div>
            <div>
              <div className="font-semibold text-gray-900">{platformInfo.name}</div>
              <div className="text-sm text-gray-500">{platformInfo.description}</div>
            </div>
          </div>

          {/* Instructions Card */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900">{instructions.title}</h3>
              {instructions.timeEstimate && (
                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                  ⏱️ {instructions.timeEstimate}
                </span>
              )}
            </div>

            {/* Steps */}
            <ol className="space-y-3">
              {instructions.steps.map((step, idx) => {
                // Handle empty strings (for method separators)
                if (step.trim() === '') {
                  return <div key={idx} className="h-2" />;
                }

                return (
                  <li key={idx} className="flex gap-3 text-sm">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-xs font-medium">
                      {idx + 1}
                    </span>
                    <span className="text-gray-700 leading-relaxed pt-0.5">{step}</span>
                  </li>
                );
              })}
            </ol>

            {/* Notes */}
            {instructions.notes && instructions.notes.length > 0 && (
              <div className="pt-4 border-t space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Important Notes:
                </div>
                <ul className="space-y-1.5 pl-6">
                  {instructions.notes.map((note, idx) => (
                    <li key={idx} className="text-xs text-gray-600 list-disc">
                      {note}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Privacy Badge */}
          <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
            <svg className="w-5 h-5 text-green-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <div className="space-y-1">
              <div className="text-sm font-semibold text-green-900">
                Export "Without Media" for privacy
              </div>
              <div className="text-xs text-green-700 leading-relaxed">
                We only need the text. Excluding media protects your privacy and makes processing much faster.
              </div>
            </div>
          </div>
        </div>

        {/* Right: Upload Zone */}
        <div className="space-y-4">
          <div className="sticky top-4">
            <UploadZone
              type="analysis"
              platform={platform}
              analysisFocus={analysisFocus}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
