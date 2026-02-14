'use client';

import { useState } from 'react';
import { Platform, AnalysisFocus } from '@/lib/platformInstructions';
import { PlatformSelector } from './PlatformSelector';
import { AnalysisFocusSelector } from './AnalysisFocusSelector';
import { PlatformUploadInstructions } from './PlatformUploadInstructions';

type Step = 1 | 2 | 3;

export function AnalysisJourney() {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
  const [selectedFocus, setSelectedFocus] = useState<AnalysisFocus | null>(null);

  const handlePlatformSelect = (platform: Platform) => {
    setSelectedPlatform(platform);
  };

  const handleFocusSelect = (focus: AnalysisFocus) => {
    setSelectedFocus(focus);
  };

  const handleNextStep = () => {
    if (currentStep < 3) {
      setCurrentStep((prev) => (prev + 1) as Step);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as Step);
    }
  };

  const canProceed = () => {
    if (currentStep === 1) return selectedPlatform !== null;
    if (currentStep === 2) return selectedFocus !== null;
    return true;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Progress indicator */}
      <div className="sticky top-0 z-10 bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Steps */}
            <div className="flex items-center gap-2">
              {[1, 2, 3].map((step) => {
                const isActive = currentStep === step;
                const isCompleted = currentStep > step;
                const labels = ['Platform', 'Analysis Focus', 'Upload'];

                return (
                  <div key={step} className="flex items-center">
                    <div className="flex items-center gap-2">
                      <div
                        className={`
                          w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all
                          ${isActive
                            ? 'bg-black text-white'
                            : isCompleted
                              ? 'bg-green-500 text-white'
                              : 'bg-gray-200 text-gray-500'
                          }
                        `}
                      >
                        {isCompleted ? (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          step
                        )}
                      </div>
                      <span
                        className={`text-sm font-medium hidden sm:inline ${
                          isActive ? 'text-gray-900' : 'text-gray-500'
                        }`}
                      >
                        {labels[step - 1]}
                      </span>
                    </div>
                    {step < 3 && (
                      <div className="w-12 sm:w-16 h-0.5 mx-2 bg-gray-200">
                        <div
                          className={`h-full transition-all ${
                            isCompleted ? 'bg-green-500 w-full' : 'bg-gray-200 w-0'
                          }`}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Back button */}
            {currentStep > 1 && currentStep < 3 && (
              <button
                onClick={handlePrevStep}
                className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Step 1: Platform Selection */}
        {currentStep === 1 && (
          <div className="space-y-8">
            <PlatformSelector
              selectedPlatform={selectedPlatform}
              onSelect={handlePlatformSelect}
            />

            {selectedPlatform && (
              <div className="flex justify-center pt-4">
                <button
                  onClick={handleNextStep}
                  className="px-8 py-3 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
                >
                  Continue
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Analysis Focus Selection */}
        {currentStep === 2 && (
          <div className="space-y-8">
            <AnalysisFocusSelector
              selectedFocus={selectedFocus}
              onSelect={handleFocusSelect}
            />

            {selectedFocus && (
              <div className="flex justify-center pt-4">
                <button
                  onClick={handleNextStep}
                  className="px-8 py-3 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
                >
                  Continue
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Upload with Instructions */}
        {currentStep === 3 && selectedPlatform && selectedFocus && (
          <div>
            <PlatformUploadInstructions
              platform={selectedPlatform}
              analysisFocus={selectedFocus}
            />
          </div>
        )}
      </div>
    </div>
  );
}
