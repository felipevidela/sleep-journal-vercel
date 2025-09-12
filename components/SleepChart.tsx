'use client';

import { 
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { SleepEntry, prepareChartData, calculateMovingAverage } from '@/lib/utils';
import { useEffect, useState } from 'react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface SleepChartProps {
  entries: SleepEntry[];
  days?: number;
}

interface ThemeColors {
  primary: string;
  primaryLight: string;
  secondary: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
  bgPrimary: string;
}

export default function SleepChart({ entries, days = 30 }: SleepChartProps) {
  const { labels, data } = prepareChartData(entries, days);
  const movingAverage = calculateMovingAverage(data, 7);
  
  const [themeColors, setThemeColors] = useState<ThemeColors>({
    primary: 'rgb(99, 102, 241)',
    primaryLight: 'rgba(99, 102, 241, 0.1)',
    secondary: 'rgb(34, 197, 94)',
    textPrimary: 'rgb(17, 24, 39)',
    textSecondary: 'rgb(75, 85, 99)',
    border: 'rgb(229, 231, 235)',
    bgPrimary: 'rgb(255, 255, 255)',
  });

  useEffect(() => {
    const updateThemeColors = () => {
      const computedStyle = getComputedStyle(document.documentElement);
      const isDark = document.documentElement.classList.contains('dark');
      
      setThemeColors({
        primary: isDark ? 'rgb(99, 102, 241)' : 'rgb(99, 102, 241)',
        primaryLight: isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.1)',
        secondary: isDark ? 'rgb(34, 197, 94)' : 'rgb(34, 197, 94)',
        textPrimary: `rgb(${computedStyle.getPropertyValue('--text-primary').trim()})`,
        textSecondary: `rgb(${computedStyle.getPropertyValue('--text-secondary').trim()})`,
        border: `rgb(${computedStyle.getPropertyValue('--border').trim()})`,
        bgPrimary: `rgb(${computedStyle.getPropertyValue('--bg-primary').trim()})`,
      });
    };

    updateThemeColors();

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          setTimeout(updateThemeColors, 100);
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Nota de sueño',
        data: data,
        borderColor: themeColors.primary,
        backgroundColor: themeColors.primaryLight,
        pointBackgroundColor: themeColors.primary,
        pointBorderColor: themeColors.bgPrimary,
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.1,
        fill: true,
      },
      {
        label: 'Promedio móvil (7 días)',
        data: movingAverage,
        borderColor: themeColors.secondary,
        backgroundColor: 'transparent',
        pointRadius: 0,
        pointHoverRadius: 4,
        borderWidth: 2,
        tension: 0.3,
        borderDash: [5, 5],
      }
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
          },
          color: themeColors.textPrimary,
        }
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: themeColors.bgPrimary,
        titleColor: themeColors.textPrimary,
        bodyColor: themeColors.textPrimary,
        borderColor: themeColors.border,
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        displayColors: true,
        callbacks: {
          title: function(tooltipItems: any[]) {
            return tooltipItems[0]?.label || '';
          },
          label: function(context: any) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            if (value === null || value === undefined) return '';
            
            if (context.datasetIndex === 0) {
              return `${label}: ${value}/10`;
            } else {
              return `${label}: ${value.toFixed(1)}/10`;
            }
          }
        }
      },
    },
    scales: {
      x: {
        display: true,
        grid: {
          color: themeColors.border.replace('rgb(', 'rgba(').replace(')', ', 0.5)'),
        },
        ticks: {
          color: themeColors.textSecondary,
          font: {
            size: 11,
          },
          maxRotation: 45,
        }
      },
      y: {
        display: true,
        min: 0,
        max: 10,
        ticks: {
          stepSize: 1,
          color: themeColors.textSecondary,
          font: {
            size: 11,
          },
          callback: function(value: any) {
            return value + '/10';
          }
        },
        grid: {
          color: themeColors.border.replace('rgb(', 'rgba(').replace(')', ', 0.3)'),
        }
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
    elements: {
      point: {
        hoverBackgroundColor: themeColors.bgPrimary,
      }
    }
  };

  // Calculate some stats
  const validEntries = data.filter(d => d !== null) as number[];
  const hasData = validEntries.length > 0;
  
  const stats = hasData ? {
    average: (validEntries.reduce((sum, val) => sum + val, 0) / validEntries.length).toFixed(1),
    highest: Math.max(...validEntries),
    lowest: Math.min(...validEntries),
    total: validEntries.length
  } : null;

  if (!hasData) {
    return (
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4 text-accent">
          📈 Tendencias de Sueño
        </h3>
        <div className="text-center py-8">
          <p className="text-gray-700 dark:text-gray-400 mb-2">
            No hay suficientes datos para mostrar el gráfico
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-500">
            Agrega algunos registros de sueño para ver las tendencias
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-accent">
          📈 Tendencias de Sueño ({days} días)
        </h3>
        
        {stats && (
          <div className="text-xs text-gray-600 dark:text-gray-400 text-right">
            <div>Promedio: {stats.average}/10</div>
            <div>{stats.total} registros</div>
          </div>
        )}
      </div>

      <div className="h-64 mb-4">
        <Line data={chartData} options={options} />
      </div>

      {stats && (
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {stats.highest}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Mejor</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {stats.average}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Promedio</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {stats.lowest}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Menor</div>
          </div>
        </div>
      )}
    </div>
  );
}