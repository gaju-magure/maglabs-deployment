
import React from 'react';
import { ResponsiveContainer, RadarChart as RechartsRadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

interface RadarChartProps {
  data: Array<{
    metric: string;
    value: number;
  }>;
}

export const RadarChart = ({ data }: RadarChartProps) => {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <RechartsRadarChart data={data}>
        <PolarGrid />
        <PolarAngleAxis dataKey="metric" className="text-xs" />
        <PolarRadiusAxis 
          angle={90} 
          domain={[0, 100]} 
          tick={false}
        />
        <Radar
          name="Score"
          dataKey="value"
          stroke="#3b82f6"
          fill="#3b82f6"
          fillOpacity={0.2}
          strokeWidth={2}
        />
      </RechartsRadarChart>
    </ResponsiveContainer>
  );
};
