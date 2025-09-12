'use client';

import { useState } from 'react';
import type { SleepEntry } from '@/lib/types';
import { SleepAnalytics, type AdvancedAnalytics as AdvancedAnalyticsType } from '@/lib/analytics';

interface AdvancedAnalyticsProps {
  entries: SleepEntry[];
}

export default function AdvancedAnalytics({ entries }: AdvancedAnalyticsProps) {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'trends' | 'patterns' | 'insights'>('overview');
  
  const analytics = SleepAnalytics.generateAdvancedAnalytics(entries);

  if (entries.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Análisis Avanzado
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Necesitas al menos algunos registros para ver el análisis avanzado.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8 px-6">
          {[
            { key: 'overview', label: 'Resumen' },
            { key: 'trends', label: 'Tendencias' },
            { key: 'patterns', label: 'Patrones' },
            { key: 'insights', label: 'Insights' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSelectedTab(tab.key as any)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                selectedTab === tab.key
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="p-6">
        {selectedTab === 'overview' && <OverviewTab analytics={analytics} />}
        {selectedTab === 'trends' && <TrendsTab analytics={analytics} />}
        {selectedTab === 'patterns' && <PatternsTab analytics={analytics} />}
        {selectedTab === 'insights' && <InsightsTab analytics={analytics} />}
      </div>
    </div>
  );
}

function OverviewTab({ analytics }: { analytics: AdvancedAnalyticsType }) {
  const { overview, streaks, periodComparison } = analytics;

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {overview.average}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Promedio</div>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {(overview.consistency * 100).toFixed(0)}%
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Consistencia</div>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {streaks.current}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Racha {streaks.type === 'good' ? 'buena' : streaks.type === 'bad' ? 'mala' : 'actual'}
          </div>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {overview.total}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total registros</div>
        </div>
      </div>

      {/* Period Comparison */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Comparación por Períodos
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Esta semana</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {periodComparison.thisWeek.toFixed(1)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Semana anterior</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {periodComparison.lastWeek.toFixed(1)}
              </span>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Este mes</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {periodComparison.thisMonth.toFixed(1)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Mes anterior</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {periodComparison.lastMonth.toFixed(1)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Streaks */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Rachas de Sueño
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <div className="text-xl font-semibold text-gray-900 dark:text-white">
              {streaks.current} días
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Racha actual ({streaks.type === 'good' ? 'buen' : streaks.type === 'bad' ? 'mal' : 'regular'} sueño)
            </div>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <div className="text-xl font-semibold text-gray-900 dark:text-white">
              {streaks.longest} días
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Racha más larga
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TrendsTab({ analytics }: { analytics: AdvancedAnalyticsType }) {
  const { trend } = analytics;

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

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="text-6xl mb-4">{getTrendIcon()}</div>
        <h3 className={`text-2xl font-bold mb-2 ${getTrendColor()}`}>
          {trend.direction === 'improving' ? 'Mejorando' : 
           trend.direction === 'declining' ? 'Empeorando' : 'Estable'}
        </h3>
        <p className="text-gray-600 dark:text-gray-300 text-lg">
          {trend.description}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 text-center">
          <div className="text-xl font-semibold text-gray-900 dark:text-white">
            {trend.percentage.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Cambio porcentual
          </div>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 text-center">
          <div className="text-xl font-semibold text-gray-900 dark:text-white capitalize">
            {trend.strength}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Intensidad
          </div>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
          ¿Qué significa esto?
        </h4>
        <p className="text-blue-800 dark:text-blue-200 text-sm">
          {trend.direction === 'improving' 
            ? 'Tu calidad de sueño está mejorando con el tiempo. ¡Sigue así!'
            : trend.direction === 'declining'
            ? 'Tu calidad de sueño está empeorando. Considera qué factores podrían estar influyendo.'
            : 'Tu calidad de sueño se mantiene estable sin cambios significativos.'
          }
        </p>
      </div>
    </div>
  );
}

function PatternsTab({ analytics }: { analytics: AdvancedAnalyticsType }) {
  const { pattern } = analytics;

  const dayOrder = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  return (
    <div className="space-y-6">
      {/* Weekday vs Weekend */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Semana vs Fin de Semana
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {pattern.weekdayAverage.toFixed(1)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Promedio días laborables
            </div>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {pattern.weekendAverage.toFixed(1)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Promedio fin de semana
            </div>
          </div>
        </div>
      </div>

      {/* Day Patterns */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Patrón por Día de la Semana
        </h3>
        <div className="space-y-3">
          {dayOrder.map((day) => {
            const value = pattern.patterns[day] || 0;
            const percentage = value > 0 ? (value / 10) * 100 : 0;
            const isHighest = day === pattern.bestDay;
            const isLowest = day === pattern.worstDay;
            
            return (
              <div key={day} className="flex items-center space-x-3">
                <div className="w-16 text-sm text-gray-600 dark:text-gray-400">
                  {day.slice(0, 3)}
                </div>
                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all ${
                      isHighest ? 'bg-green-500' : 
                      isLowest ? 'bg-red-500' : 
                      'bg-blue-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="w-12 text-sm font-medium text-gray-900 dark:text-white">
                  {value.toFixed(1)}
                </div>
                {isHighest && (
                  <span className="text-xs text-green-600 dark:text-green-400">
                    Mejor
                  </span>
                )}
                {isLowest && (
                  <span className="text-xs text-red-600 dark:text-red-400">
                    Peor
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Consistency Score */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 dark:text-white mb-2">
          Puntuación de Consistencia
        </h4>
        <div className="flex items-center space-x-3">
          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div 
              className="h-3 rounded-full bg-blue-500 transition-all"
              style={{ width: `${(pattern.consistencyScore * 100)}%` }}
            />
          </div>
          <span className="text-lg font-semibold text-gray-900 dark:text-white">
            {(pattern.consistencyScore * 100).toFixed(0)}%
          </span>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          {pattern.consistencyScore > 0.8 ? 'Muy consistente' :
           pattern.consistencyScore > 0.6 ? 'Moderadamente consistente' :
           'Inconsistente - considera mantener rutinas más regulares'}
        </p>
      </div>
    </div>
  );
}

function InsightsTab({ analytics }: { analytics: AdvancedAnalyticsType }) {
  const { insights } = analytics;

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'positive':
        return '✅';
      case 'warning':
        return '⚠️';
      default:
        return 'ℹ️';
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'positive':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200';
      case 'warning':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200';
      default:
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200';
    }
  };

  return (
    <div className="space-y-4">
      {insights.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-300 text-center py-8">
          No hay insights disponibles con los datos actuales.
        </p>
      ) : (
        insights.map((insight, index) => (
          <div
            key={index}
            className={`border rounded-lg p-4 ${getInsightColor(insight.type)}`}
          >
            <div className="flex items-start space-x-3">
              <span className="text-xl">{getInsightIcon(insight.type)}</span>
              <div className="flex-1">
                <h4 className="font-medium mb-1">{insight.title}</h4>
                <p className="text-sm mb-2">{insight.description}</p>
                {insight.actionable && insight.recommendation && (
                  <div className="bg-white/50 dark:bg-black/20 rounded p-2 text-xs">
                    <strong>Recomendación:</strong> {insight.recommendation}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}