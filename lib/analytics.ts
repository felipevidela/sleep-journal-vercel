// Advanced sleep analytics and statistical calculations

import type { SleepEntry, SleepStatistics, DateRange } from '@/lib/types';

export interface SleepTrend {
  direction: 'improving' | 'declining' | 'stable';
  strength: 'weak' | 'moderate' | 'strong';
  percentage: number;
  description: string;
}

export interface SleepPattern {
  weekdayAverage: number;
  weekendAverage: number;
  bestDay: string;
  worstDay: string;
  consistencyScore: number;
  patterns: Record<string, number>;
}

export interface SleepInsight {
  type: 'positive' | 'warning' | 'info';
  title: string;
  description: string;
  actionable: boolean;
  recommendation?: string;
}

export interface AdvancedAnalytics {
  overview: SleepStatistics;
  trend: SleepTrend;
  pattern: SleepPattern;
  insights: SleepInsight[];
  streaks: {
    current: number;
    longest: number;
    type: 'good' | 'bad' | 'neutral';
  };
  periodComparison: {
    thisWeek: number;
    lastWeek: number;
    thisMonth: number;
    lastMonth: number;
  };
}

export class SleepAnalytics {
  /**
   * Calculate comprehensive sleep statistics
   */
  static calculateStatistics(entries: SleepEntry[]): SleepStatistics {
    if (entries.length === 0) {
      return {
        average: 0,
        highest: 0,
        lowest: 0,
        total: 0,
        trend: 'stable',
        consistency: 0
      };
    }

    const ratings = entries.map(entry => entry.rating);
    const total = entries.length;
    const sum = ratings.reduce((acc, rating) => acc + rating, 0);
    const average = sum / total;
    const highest = Math.max(...ratings);
    const lowest = Math.min(...ratings);

    // Calculate trend using linear regression
    const trend = this.calculateTrend(entries);
    
    // Calculate consistency (inverse of standard deviation)
    const variance = ratings.reduce((acc, rating) => acc + Math.pow(rating - average, 2), 0) / total;
    const standardDeviation = Math.sqrt(variance);
    const consistency = Math.max(0, 1 - (standardDeviation / 5)); // Normalize to 0-1

    return {
      average: Math.round(average * 100) / 100,
      highest,
      lowest,
      total,
      trend,
      consistency: Math.round(consistency * 100) / 100
    };
  }

  /**
   * Calculate sleep trend using linear regression
   */
  static calculateTrend(entries: SleepEntry[]): 'improving' | 'declining' | 'stable' {
    if (entries.length < 3) return 'stable';

    // Sort entries by date
    const sortedEntries = [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const n = sortedEntries.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = sortedEntries.map(entry => entry.rating);

    // Calculate linear regression slope
    const sumX = x.reduce((acc, val) => acc + val, 0);
    const sumY = y.reduce((acc, val) => acc + val, 0);
    const sumXY = x.reduce((acc, val, i) => acc + val * (y[i] ?? 0), 0);
    const sumXX = x.reduce((acc, val) => acc + val * val, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);

    // Determine trend based on slope
    if (slope > 0.1) return 'improving';
    if (slope < -0.1) return 'declining';
    return 'stable';
  }

  /**
   * Analyze detailed sleep trend
   */
  static analyzeTrend(entries: SleepEntry[]): SleepTrend {
    if (entries.length < 7) {
      return {
        direction: 'stable',
        strength: 'weak',
        percentage: 0,
        description: 'Necesitas más datos para análisis de tendencias'
      };
    }

    const sortedEntries = [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const recentEntries = sortedEntries.slice(-14); // Last 14 days
    const earlierEntries = sortedEntries.slice(-28, -14); // Previous 14 days

    if (earlierEntries.length === 0) {
      return {
        direction: 'stable',
        strength: 'weak',
        percentage: 0,
        description: 'Datos insuficientes para comparación'
      };
    }

    const recentAvg = recentEntries.reduce((sum, entry) => sum + entry.rating, 0) / recentEntries.length;
    const earlierAvg = earlierEntries.reduce((sum, entry) => sum + entry.rating, 0) / earlierEntries.length;

    const change = recentAvg - earlierAvg;
    const percentage = Math.abs(change / earlierAvg) * 100;

    let direction: 'improving' | 'declining' | 'stable';
    let strength: 'weak' | 'moderate' | 'strong';
    let description: string;

    if (Math.abs(change) < 0.3) {
      direction = 'stable';
      strength = 'weak';
      description = `Tu calidad de sueño se mantiene estable en ${recentAvg.toFixed(1)}/10`;
    } else if (change > 0) {
      direction = 'improving';
      if (percentage > 20) strength = 'strong';
      else if (percentage > 10) strength = 'moderate';
      else strength = 'weak';
      description = `Tu sueño ha mejorado ${percentage.toFixed(1)}% en las últimas 2 semanas`;
    } else {
      direction = 'declining';
      if (percentage > 20) strength = 'strong';
      else if (percentage > 10) strength = 'moderate';
      else strength = 'weak';
      description = `Tu sueño ha empeorado ${percentage.toFixed(1)}% en las últimas 2 semanas`;
    }

    return {
      direction,
      strength,
      percentage: Math.round(percentage * 10) / 10,
      description
    };
  }

  /**
   * Analyze sleep patterns by day of week
   */
  static analyzePatterns(entries: SleepEntry[]): SleepPattern {
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const dayTotals: Record<string, { sum: number; count: number }> = {};
    
    // Initialize day totals
    dayNames.forEach(day => {
      dayTotals[day] = { sum: 0, count: 0 };
    });

    // Calculate totals for each day
    entries.forEach(entry => {
      const date = new Date(entry.date + 'T00:00:00');
      const dayName = dayNames[date.getDay()];
      if (dayName && dayTotals[dayName]) {
        dayTotals[dayName].sum += entry.rating;
        dayTotals[dayName].count += 1;
      }
    });

    // Calculate averages
    const patterns: Record<string, number> = {};
    let bestDay = '';
    let worstDay = '';
    let bestAvg = 0;
    let worstAvg = 10;

    dayNames.forEach(day => {
      const dayData = dayTotals[day];
      if (dayData && dayData.count > 0) {
        const avg = dayData.sum / dayData.count;
        patterns[day] = Math.round(avg * 100) / 100;
        
        if (avg > bestAvg) {
          bestAvg = avg;
          bestDay = day;
        }
        if (avg < worstAvg) {
          worstAvg = avg;
          worstDay = day;
        }
      } else {
        patterns[day] = 0;
      }
    });

    // Calculate weekday vs weekend averages
    const weekdays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
    const weekends = ['Sábado', 'Domingo'];

    const weekdayRatings: number[] = [];
    const weekendRatings: number[] = [];

    entries.forEach(entry => {
      const date = new Date(entry.date + 'T00:00:00');
      const dayName = dayNames[date.getDay()];
      
      if (dayName && weekdays.includes(dayName)) {
        weekdayRatings.push(entry.rating);
      } else if (dayName && weekends.includes(dayName)) {
        weekendRatings.push(entry.rating);
      }
    });

    const weekdayAverage = weekdayRatings.length > 0 
      ? weekdayRatings.reduce((sum, rating) => sum + rating, 0) / weekdayRatings.length 
      : 0;
    
    const weekendAverage = weekendRatings.length > 0
      ? weekendRatings.reduce((sum, rating) => sum + rating, 0) / weekendRatings.length
      : 0;

    // Calculate consistency score (how similar are the day averages)
    const validAverages = Object.values(patterns).filter(avg => avg > 0);
    const avgOfAverages = validAverages.reduce((sum, avg) => sum + avg, 0) / validAverages.length;
    const variance = validAverages.reduce((sum, avg) => sum + Math.pow(avg - avgOfAverages, 2), 0) / validAverages.length;
    const consistencyScore = Math.max(0, 1 - (Math.sqrt(variance) / 5));

    return {
      weekdayAverage: Math.round(weekdayAverage * 100) / 100,
      weekendAverage: Math.round(weekendAverage * 100) / 100,
      bestDay: bestDay || 'N/A',
      worstDay: worstDay || 'N/A',
      consistencyScore: Math.round(consistencyScore * 100) / 100,
      patterns
    };
  }

  /**
   * Generate actionable insights
   */
  static generateInsights(entries: SleepEntry[], analytics: { overview: SleepStatistics; trend: SleepTrend; pattern: SleepPattern }): SleepInsight[] {
    const insights: SleepInsight[] = [];
    const { overview, trend, pattern } = analytics;

    // Average quality insights
    if (overview.average >= 8) {
      insights.push({
        type: 'positive',
        title: 'Excelente calidad de sueño',
        description: `Tu promedio de ${overview.average}/10 indica una excelente calidad de sueño.`,
        actionable: false
      });
    } else if (overview.average >= 6) {
      insights.push({
        type: 'info',
        title: 'Calidad de sueño moderada',
        description: `Tu promedio de ${overview.average}/10 es bueno, pero hay espacio para mejoras.`,
        actionable: true,
        recommendation: 'Considera mantener una rutina de sueño más consistente'
      });
    } else {
      insights.push({
        type: 'warning',
        title: 'Calidad de sueño preocupante',
        description: `Tu promedio de ${overview.average}/10 indica problemas de sueño que necesitan atención.`,
        actionable: true,
        recommendation: 'Considera consultar con un profesional de la salud'
      });
    }

    // Trend insights
    if (trend.direction === 'improving' && trend.strength !== 'weak') {
      insights.push({
        type: 'positive',
        title: 'Tendencia positiva',
        description: trend.description,
        actionable: false
      });
    } else if (trend.direction === 'declining' && trend.strength !== 'weak') {
      insights.push({
        type: 'warning',
        title: 'Tendencia preocupante',
        description: trend.description,
        actionable: true,
        recommendation: 'Revisa qué cambios recientes podrían estar afectando tu sueño'
      });
    }

    // Consistency insights
    if (overview.consistency < 0.5) {
      insights.push({
        type: 'warning',
        title: 'Sueño inconsistente',
        description: 'Tu calidad de sueño varía mucho día a día.',
        actionable: true,
        recommendation: 'Intenta mantener horarios regulares de sueño y rutinas nocturnas'
      });
    } else if (overview.consistency > 0.8) {
      insights.push({
        type: 'positive',
        title: 'Sueño muy consistente',
        description: 'Mantienes una calidad de sueño muy estable.',
        actionable: false
      });
    }

    // Weekday vs weekend insights
    const weekendDiff = Math.abs(pattern.weekendAverage - pattern.weekdayAverage);
    if (weekendDiff > 1.5) {
      if (pattern.weekendAverage > pattern.weekdayAverage) {
        insights.push({
          type: 'info',
          title: 'Mejor sueño en fines de semana',
          description: `Duermes ${weekendDiff.toFixed(1)} puntos mejor los fines de semana.`,
          actionable: true,
          recommendation: 'Trata de aplicar tus rutinas de fin de semana a los días laborables'
        });
      } else {
        insights.push({
          type: 'warning',
          title: 'Peor sueño en fines de semana',
          description: `Tu sueño empeora ${weekendDiff.toFixed(1)} puntos los fines de semana.`,
          actionable: true,
          recommendation: 'Mantén horarios regulares incluso los fines de semana'
        });
      }
    }

    // Recent entries insights
    if (entries.length >= 7) {
      const recentEntries = entries.slice(-7);
      const recentAvg = recentEntries.reduce((sum, entry) => sum + entry.rating, 0) / recentEntries.length;
      
      if (recentAvg < overview.average - 1) {
        insights.push({
          type: 'warning',
          title: 'Semana difícil',
          description: 'Tu sueño esta semana ha sido peor que tu promedio general.',
          actionable: true,
          recommendation: 'Identifica qué factores podrían estar afectando tu sueño recientemente'
        });
      }
    }

    return insights;
  }

  /**
   * Calculate sleep streaks
   */
  static calculateStreaks(entries: SleepEntry[]): { current: number; longest: number; type: 'good' | 'bad' | 'neutral' } {
    if (entries.length === 0) {
      return { current: 0, longest: 0, type: 'neutral' };
    }

    const sortedEntries = [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    let currentStreak = 0;
    let longestStreak = 0;
    let currentStreakType: 'good' | 'bad' | 'neutral' = 'neutral';
    let tempStreak = 0;
    let tempType: 'good' | 'bad' | 'neutral' = 'neutral';

    sortedEntries.forEach((entry, index) => {
      const rating = entry.rating;
      let entryType: 'good' | 'bad' | 'neutral';
      
      if (rating >= 7) entryType = 'good';
      else if (rating <= 4) entryType = 'bad';
      else entryType = 'neutral';

      if (index === 0) {
        currentStreak = 1;
        currentStreakType = entryType;
        tempStreak = 1;
        tempType = entryType;
      } else if (entryType === tempType) {
        tempStreak++;
        if (index < 30) { // Only count current streak for recent entries
          currentStreak = tempStreak;
          currentStreakType = tempType;
        }
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
        tempType = entryType;
        if (index < 30) {
          currentStreak = 1;
          currentStreakType = entryType;
        }
      }
    });

    longestStreak = Math.max(longestStreak, tempStreak);

    return {
      current: currentStreak,
      longest: longestStreak,
      type: currentStreakType
    };
  }

  /**
   * Compare different time periods
   */
  static comparePeriods(entries: SleepEntry[]): {
    thisWeek: number;
    lastWeek: number;
    thisMonth: number;
    lastMonth: number;
  } {
    const now = new Date();
    const thisWeekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastWeekStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const thisMonthStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const lastMonthStart = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const thisWeekEntries = entries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= thisWeekStart;
    });

    const lastWeekEntries = entries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= lastWeekStart && entryDate < thisWeekStart;
    });

    const thisMonthEntries = entries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= thisMonthStart;
    });

    const lastMonthEntries = entries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= lastMonthStart && entryDate < thisMonthStart;
    });

    const calculateAverage = (entryList: SleepEntry[]) => {
      if (entryList.length === 0) return 0;
      return entryList.reduce((sum, entry) => sum + entry.rating, 0) / entryList.length;
    };

    return {
      thisWeek: Math.round(calculateAverage(thisWeekEntries) * 100) / 100,
      lastWeek: Math.round(calculateAverage(lastWeekEntries) * 100) / 100,
      thisMonth: Math.round(calculateAverage(thisMonthEntries) * 100) / 100,
      lastMonth: Math.round(calculateAverage(lastMonthEntries) * 100) / 100
    };
  }

  /**
   * Generate comprehensive analytics
   */
  static generateAdvancedAnalytics(entries: SleepEntry[]): AdvancedAnalytics {
    const overview = this.calculateStatistics(entries);
    const trend = this.analyzeTrend(entries);
    const pattern = this.analyzePatterns(entries);
    const insights = this.generateInsights(entries, { overview, trend, pattern });
    const streaks = this.calculateStreaks(entries);
    const periodComparison = this.comparePeriods(entries);

    return {
      overview,
      trend,
      pattern,
      insights,
      streaks,
      periodComparison
    };
  }
}