import React from 'react';

interface ProgressBarsProps {
  clarity: number;
  value: number;
  conciseness: number;
}

export const ProgressBars: React.FC<ProgressBarsProps> = ({ clarity, value, conciseness }) => (
  <div className="flex flex-row gap-4 mb-8 w-full max-w-md justify-center">
    <div className="flex flex-col items-center w-1/3">
      <span className="text-xs font-semibold text-gray-700 mb-1">Clarity</span>
      <div className="w-full bg-gray-200 rounded h-2">
        <div
          className="h-2 rounded transition-all"
          style={{
            width: `${clarity}%`,
            background: 'linear-gradient(90deg, #22c55e 0%, #16a34a 100%)'
          }}
        />
      </div>
    </div>
    <div className="flex flex-col items-center w-1/3">
      <span className="text-xs font-semibold text-gray-700 mb-1">Value</span>
      <div className="w-full bg-gray-200 rounded h-2">
        <div
          className="h-2 rounded transition-all"
          style={{
            width: `${value}%`,
            background: 'linear-gradient(90deg, #fde047 0%, #facc15 100%)'
          }}
        />
      </div>
    </div>
    <div className="flex flex-col items-center w-1/3">
      <span className="text-xs font-semibold text-gray-700 mb-1">Conciseness</span>
      <div className="w-full bg-gray-200 rounded h-2">
        <div
          className="h-2 rounded transition-all"
          style={{
            width: `${conciseness}%`,
            background: 'linear-gradient(90deg, #f87171 0%, #dc2626 100%)'
          }}
        />
      </div>
    </div>
  </div>
);
