'use client';

import type { SleepEntry } from '@/lib/types';
import { SleepAnalytics } from '@/lib/analytics';

interface QuickInsightsProps {
  entries: SleepEntry[];
}

export default function QuickInsights({ entries }: QuickInsightsProps) {
  if (entries.length < 3) {
    return null;
  }

  const analytics = SleepAnalytics.generateAdvancedAnalytics(entries);
  const { overview, trend, streaks } = analytics;

  const getTrendIcon = () => {
    switch (trend.direction) {
      case 'improving':
        return '📈';
      case 'declining':
        return '📉';
      default:
        return '➡️';
    }
  };

  const getTrendColor = () => {
    switch (trend.direction) {
      case 'improving':
        return 'text-green-600 dark:text-green-400';
      case 'declining':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getStreakIcon = () => {
    switch (streaks.type) {
      case 'good':
        return '🔥';
      case 'bad':
        return '❄️';
      default:
        return '⚡';
    }
  };

  return (
    <div className="mt-4 grid grid-cols-2 gap-3">
      {/* Trend Insight */}
      <div className="card p-3">
        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
          <span>{getTrendIcon()}</span>
          <span>Tendencia</span>
        </div>
        <div className={`text-sm font-medium ${getTrendColor()}`}>
          {trend.direction === 'improving' ? 'Mejorando' : 
           trend.direction === 'declining' ? 'Declinando' : 'Estable'}
        </div>
        {trend.percentage > 0 && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {trend.percentage.toFixed(1)}%
          </div>
        )}
      </div>

      {/* Streak */}
      <div className="card p-3">
        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
          <span>{getStreakIcon()}</span>
          <span>Racha</span>
        </div>
        <div className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
          {streaks.current}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {streaks.type === 'good' ? 'días buenos' : 
           streaks.type === 'bad' ? 'días malos' : 'días'}
        </div>
      </div>

      {/* Consistency */}
      <div className="card p-3">
        <div className="text-xs text-gray-600 dark:text-gray-400">Consistencia</div>
        <div className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
          {(overview.consistency * 100).toFixed(0)}%
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {overview.consistency > 0.8 ? 'Excelente' :
           overview.consistency > 0.6 ? 'Buena' :
           overview.consistency > 0.4 ? 'Regular' : 'Baja'}
        </div>
      </div>

      {/* Best/Worst */}
      <div className="card p-3">
        <div className="text-xs text-gray-600 dark:text-gray-400">Rango</div>
        <div className="text-sm font-medium text-gray-900 dark:text-white">
          {overview.lowest} - {overview.highest}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          de {overview.total} registros
        </div>
      </div>
    </div>
  );
}