'use client';

import { PLATFORMS, Platform } from '@/lib/platformInstructions';

interface PlatformSelectorProps {
  selectedPlatform: Platform | null;
  onSelect: (platform: Platform) => void;
}

export function PlatformSelector({ selectedPlatform, onSelect }: PlatformSelectorProps) {
  const platformList: Platform[] = [
    'whatsapp_mobile',
    'whatsapp_desktop',
    'telegram',
    'imessage',
    'instagram',
    'messenger',
    'snapchat',
    'android_sms'
  ];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">
          Select Your Chat Platform
        </h2>
        <p className="text-gray-500">
          Choose your messaging platform to get step-by-step upload instructions
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {platformList.map((platformId) => {
          const platform = PLATFORMS[platformId];
          const isSelected = selectedPlatform === platformId;

          return (
            <button
              key={platformId}
              onClick={() => onSelect(platformId)}
              className={`
                relative p-6 rounded-2xl border-2 transition-all duration-200
                hover:shadow-lg active:scale-[0.98]
                ${isSelected
                  ? 'border-black bg-gray-50 shadow-md'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
                }
              `}
            >
              {isSelected && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-black rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}

              <div className="flex flex-col items-center gap-3">
                <div className="text-4xl">{platform.icon}</div>
                <div className="text-center">
                  <div className="font-semibold text-gray-900 text-sm">
                    {platform.name}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {platform.description}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-center gap-2 text-sm text-gray-400 pt-4">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>We support all major messaging platforms. More coming soon!</span>
      </div>
    </div>
  );
}
