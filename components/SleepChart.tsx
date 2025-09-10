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

export default function SleepChart({ entries, days = 30 }: SleepChartProps) {
  const { labels, data } = prepareChartData(entries, days);
  const movingAverage = calculateMovingAverage(data, 7);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Nota de sueño',
        data: data,
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        pointBackgroundColor: 'rgb(99, 102, 241)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.1,
        fill: true,
      },
      {
        label: 'Promedio móvil (7 días)',
        data: movingAverage,
        borderColor: 'rgb(34, 197, 94)',
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
          color: 'rgb(var(--text-primary))',
        }
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgb(var(--bg-primary))',
        titleColor: 'rgb(var(--text-primary))',
        bodyColor: 'rgb(var(--text-primary))',
        borderColor: 'rgb(var(--border))',
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
            if (value === null || value === undefined) return null;
            
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
          color: 'rgba(var(--border), 0.5)',
        },
        ticks: {
          color: 'rgb(var(--text-secondary))',
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
          color: 'rgb(var(--text-secondary))',
          font: {
            size: 11,
          },
          callback: function(value: any) {
            return value + '/10';
          }
        },
        grid: {
          color: 'rgba(var(--border), 0.3)',
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
        hoverBackgroundColor: 'rgb(var(--bg-primary))',
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