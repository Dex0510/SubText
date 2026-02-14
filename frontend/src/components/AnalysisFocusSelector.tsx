'use client';

import { ANALYSIS_FOCUSES, AnalysisFocus } from '@/lib/platformInstructions';

interface AnalysisFocusSelectorProps {
  selectedFocus: AnalysisFocus | null;
  onSelect: (focus: AnalysisFocus) => void;
}

export function AnalysisFocusSelector({ selectedFocus, onSelect }: AnalysisFocusSelectorProps) {
  const focusList: AnalysisFocus[] = [
    'romantic_relationship',
    'personality_communication',
    'just_for_fun'
  ];

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">
          What do you want to explore?
        </h2>
        <p className="text-gray-500">
          Choose your analysis focus
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {focusList.map((focusId) => {
          const focus = ANALYSIS_FOCUSES[focusId];
          const isSelected = selectedFocus === focusId;

          return (
            <button
              key={focusId}
              onClick={() => onSelect(focusId)}
              className={`
                relative p-8 rounded-2xl border-2 transition-all duration-200
                hover:shadow-lg active:scale-[0.98] text-left
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

              <div className="space-y-4">
                {/* Icon and Title */}
                <div className="flex items-center gap-3">
                  <div className="text-4xl">{focus.icon}</div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {focus.name}
                  </h3>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-600 leading-relaxed">
                  {focus.description}
                </p>

                {/* Includes List */}
                <div className="space-y-2 pt-2">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Includes:
                  </div>
                  <ul className="space-y-1.5">
                    {focus.includes.map((item, idx) => (
                      <li key={idx} className="flex gap-2 text-sm text-gray-600">
                        <span className="text-green-500 shrink-0">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-center gap-2 text-sm text-gray-400 pt-4">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        <span>All analyses are powered by clinical frameworks and research</span>
      </div>
    </div>
  );
}
