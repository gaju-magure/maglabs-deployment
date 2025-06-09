import React from 'react';

interface ProgressBarsProps {
  clarity: number;
  value: number;
  conciseness: number;
}

export const ProgressBars: React.FC<ProgressBarsProps> = ({ clarity, value, conciseness }) => (
  <div className="flex flex-row gap-4 mb-6 w-full max-w-md justify-center bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md border border-gray-200 dark:border-gray-700">
    <div className="flex flex-col items-center flex-1">
      <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2" style={{ fontFamily: 'Satoshi, sans-serif' }}>Clarity</span>
      <div className="relative w-20 h-20">
        <svg className="w-20 h-20 transform -rotate-90">
          <circle
            cx="40"
            cy="40"
            r="30"
            stroke="currentColor"
            strokeWidth="6"
            fill="none"
            className="text-gray-200 dark:text-gray-700"
          />
          <circle
            cx="40"
            cy="40"
            r="30"
            stroke="url(#clarity-gradient)"
            strokeWidth="6"
            fill="none"
            strokeDasharray={`${2 * Math.PI * 30}`}
            strokeDashoffset={`${2 * Math.PI * 30 * (1 - clarity / 100)}`}
            className="transition-all duration-700 ease-out"
            strokeLinecap="round"
          />
          <defs>
            <linearGradient id="clarity-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FDA052" />
              <stop offset="100%" stopColor="#B96AF7" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'Satoshi, sans-serif' }}>
            {clarity}%
          </span>
        </div>
      </div>
    </div>
    
    <div className="flex flex-col items-center flex-1">
      <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2" style={{ fontFamily: 'Satoshi, sans-serif' }}>Value</span>
      <div className="relative w-20 h-20">
        <svg className="w-20 h-20 transform -rotate-90">
          <circle
            cx="40"
            cy="40"
            r="30"
            stroke="currentColor"
            strokeWidth="6"
            fill="none"
            className="text-gray-200 dark:text-gray-700"
          />
          <circle
            cx="40"
            cy="40"
            r="30"
            stroke="url(#value-gradient)"
            strokeWidth="6"
            fill="none"
            strokeDasharray={`${2 * Math.PI * 30}`}
            strokeDashoffset={`${2 * Math.PI * 30 * (1 - value / 100)}`}
            className="transition-all duration-700 ease-out"
            strokeLinecap="round"
          />
          <defs>
            <linearGradient id="value-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#B96AF7" />
              <stop offset="100%" stopColor="#3077F3" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'Satoshi, sans-serif' }}>
            {value}%
          </span>
        </div>
      </div>
    </div>
    
    <div className="flex flex-col items-center flex-1">
      <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2" style={{ fontFamily: 'Satoshi, sans-serif' }}>Conciseness</span>
      <div className="relative w-20 h-20">
        <svg className="w-20 h-20 transform -rotate-90">
          <circle
            cx="40"
            cy="40"
            r="30"
            stroke="currentColor"
            strokeWidth="6"
            fill="none"
            className="text-gray-200 dark:text-gray-700"
          />
          <circle
            cx="40"
            cy="40"
            r="30"
            stroke="url(#conciseness-gradient)"
            strokeWidth="6"
            fill="none"
            strokeDasharray={`${2 * Math.PI * 30}`}
            strokeDashoffset={`${2 * Math.PI * 30 * (1 - conciseness / 100)}`}
            className="transition-all duration-700 ease-out"
            strokeLinecap="round"
          />
          <defs>
            <linearGradient id="conciseness-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3077F3" />
              <stop offset="100%" stopColor="#41E6F8" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'Satoshi, sans-serif' }}>
            {conciseness}%
          </span>
        </div>
      </div>
    </div>
  </div>
);
