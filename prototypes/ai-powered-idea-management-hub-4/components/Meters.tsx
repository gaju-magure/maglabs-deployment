
import React from 'react';
import { MeterScores } from '../types';
import { SparklesIcon, CheckCircleIcon } from './icons';

interface MeterGaugeProps {
  label: string;
  score: number; // 0-100
  icon?: React.ReactNode;
  colorClasses: {
    background: string; 
    foreground: string; 
    text: string;       
    iconText?: string; // Optional specific color for icon if different from main text
  };
  height?: string; 
}

const MeterGauge: React.FC<MeterGaugeProps> = ({ label, score, icon, colorClasses, height = 'h-2.5' }) => {
  const cappedScore = Math.max(0, Math.min(score, 100));
  const iconColor = colorClasses.iconText || colorClasses.text;

  return (
    <div className="w-full p-3 bg-white rounded-lg shadow">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center">
          {icon && <span className={`mr-2 ${iconColor}`}>{icon}</span>}
          <span className={`text-sm font-semibold ${colorClasses.text}`}>{label}</span>
        </div>
        <span className={`text-sm font-bold ${colorClasses.text}`}>{Math.round(cappedScore)}%</span>
      </div>
      <div className={`w-full ${colorClasses.background} rounded-full ${height} overflow-hidden`}>
        <div
          className={`${colorClasses.foreground} ${height} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${cappedScore}%` }}
          role="progressbar"
          aria-valuenow={cappedScore}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${label} score`}
        ></div>
      </div>
    </div>
  );
};

// Clarity uses brandBlue (primary)
const ClarityMeter: React.FC<{ score: number }> = ({ score }) => (
  <MeterGauge
    label="Clarity"
    score={score}
    icon={<SparklesIcon className="w-4 h-4" />}
    colorClasses={{ 
      background: 'bg-primary/20', // Lighter primary
      foreground: 'bg-primary', 
      text: 'text-primary-dark',
      iconText: 'text-primary'
    }}
  />
);

// Value uses brandOrange (secondary)
const ValueMeter: React.FC<{ score: number }> = ({ score }) => (
  <MeterGauge
    label="Value"
    score={score}
    icon={<CheckCircleIcon className="w-4 h-4" />}
    colorClasses={{ 
      background: 'bg-secondary/20', // Lighter secondary
      foreground: 'bg-secondary',
      text: 'text-secondary-dark',
      iconText: 'text-secondary'
    }}
  />
);

// Readiness uses brandCyan (highlight)
const ReadinessMeter: React.FC<{ score: number }> = ({ score }) => (
  <MeterGauge
    label="Readiness"
    score={score}
    icon={<CheckCircleIcon className="w-4 h-4" />}
    colorClasses={{ 
      background: 'bg-highlight/20', // Lighter highlight
      foreground: 'bg-highlight',
      text: 'text-highlight-dark',
      iconText: 'text-highlight'
    }}
  />
);

interface TopMetersDisplayProps {
  scores: MeterScores;
}

export const TopMetersDisplay: React.FC<TopMetersDisplayProps> = ({ scores }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 px-2">
      <ClarityMeter score={scores.clarity} />
      <ValueMeter score={scores.value} />
      <ReadinessMeter score={scores.readiness} />
    </div>
  );
};
