import { Groq } from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export interface MedicineRecord {
  _id: string;
  name: string;
  dosage: string;
  price?: number;
  frequency?: string;
  duration?: number;
  condition?: string;
  severity?: string;
  createdAt: Date;
  expiryDate?: Date;
  purchaseDate?: Date;
}

interface PredictionResult {
  predictions: {
    nextWeek: number;
    nextMonth: number;
    totalEstimated: number;
    confidence: number;
  };
  insights: string[];
  charts: {
    expenseTrend: Array<{ date: string; amount: number }>;
    medicineBreakdown: Array<{ medicine: string; amount: number; percentage: number }>;
    projectionChart: Array<{ period: string; predicted: number; confidence: [number, number] }>;
  };
  confidence: number;
}

interface FeaturesData {
  dailyExpenses: number[];
  weeklyExpenses: number[];
  medicineFrequency: Record<string, number>;
  conditionSeverity: Record<string, number>;
  timeSeries: Array<{ date: string; amount: number }>;
}

interface PredictionData {
  nextWeek: number;
  nextMonth: number;
  totalEstimated: number;
  confidence: number;
}

class ExpensePredictionEngine {
  // Simple linear regression implementation
  private linearRegression(x: number[], y: number[]): { slope: number; intercept: number; r2: number } {
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calculate R²
    const yMean = sumY / n;
    const ssRes = y.reduce((sum, yi, i) => sum + Math.pow(yi - (slope * x[i] + intercept), 2), 0);
    const ssTot = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
    const r2 = 1 - (ssRes / ssTot);

    return { slope, intercept, r2 };
  }

  // Simple moving average
  private movingAverage(data: number[], window: number): number[] {
    const result: number[] = [];
    for (let i = window - 1; i < data.length; i++) {
      const sum = data.slice(i - window + 1, i + 1).reduce((a, b) => a + b, 0);
      result.push(sum / window);
    }
    return result;
  }

  private extractFeatures(medicines: MedicineRecord[]): FeaturesData {
    const features = {
      dailyExpenses: [] as number[],
      weeklyExpenses: [] as number[],
      medicineFrequency: {} as Record<string, number>,
      conditionSeverity: {} as Record<string, number>,
      timeSeries: [] as Array<{ date: string; amount: number }>
    };

    // Group by date and calculate daily expenses
    const dailyMap = new Map<string, number>();

    medicines.forEach(medicine => {
      const date = medicine.createdAt.toISOString().split('T')[0];
      const price = medicine.price || this.estimatePrice(medicine);
      const frequency = this.parseFrequency(medicine.frequency || 'daily');
      const dailyCost = (price * frequency) / (medicine.duration || 30);

      dailyMap.set(date, (dailyMap.get(date) || 0) + dailyCost);

      // Track medicine frequency
      features.medicineFrequency[medicine.name] = (features.medicineFrequency[medicine.name] || 0) + frequency;

      // Track condition severity
      if (medicine.condition && medicine.severity) {
        const severityScore = this.severityToScore(medicine.severity);
        features.conditionSeverity[medicine.condition] = Math.max(
          features.conditionSeverity[medicine.condition] || 0,
          severityScore
        );
      }
    });

    // Convert to time series
    features.timeSeries = Array.from(dailyMap.entries())
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Calculate daily expenses
    features.dailyExpenses = features.timeSeries.map(d => d.amount);

    // Calculate 7-day moving averages for weekly expenses
    if (features.dailyExpenses.length >= 7) {
      features.weeklyExpenses = this.movingAverage(features.dailyExpenses, 7);
    }

    return features;
  }

  private estimatePrice(medicine: MedicineRecord): number {
    // Simple price estimation based on medicine type
    const name = medicine.name.toLowerCase();
    if (name.includes('paracetamol') || name.includes('acetaminophen')) return 50;
    if (name.includes('ibuprofen')) return 75;
    if (name.includes('antibiotic') || name.includes('amoxicillin')) return 150;
    if (name.includes('insulin')) return 500;
    return 100; // Default price
  }

  private parseFrequency(frequency: string): number {
    const freq = frequency.toLowerCase();
    if (freq.includes('twice') || freq.includes('2')) return 2;
    if (freq.includes('three') || freq.includes('3')) return 3;
    if (freq.includes('four') || freq.includes('4')) return 4;
    if (freq.includes('weekly') || freq.includes('week')) return 0.14;
    return 1; // Default daily
  }

  private severityToScore(severity: string): number {
    const sev = severity.toLowerCase();
    if (sev.includes('mild') || sev.includes('starting')) return 1;
    if (sev.includes('moderate') || sev.includes('middle')) return 2;
    if (sev.includes('severe') || sev.includes('advanced')) return 3;
    if (sev.includes('critical')) return 4;
    return 2; // Default moderate
  }

  private generatePredictions(features: FeaturesData): PredictionData {
    const { dailyExpenses } = features;

    if (dailyExpenses.length < 3) {
      // Fallback to simple average
      const avgDaily = dailyExpenses.reduce((a, b) => a + b, 0) / dailyExpenses.length;
      return {
        nextWeek: avgDaily * 7,
        nextMonth: avgDaily * 30,
        totalEstimated: avgDaily * 60, // Assume 2 months treatment
        confidence: 0.3
      };
    }

    // Use linear regression to predict trends
    const x = Array.from({ length: dailyExpenses.length }, (_, i) => i);
    const regression = this.linearRegression(x, dailyExpenses);

    const lastIndex = dailyExpenses.length - 1;
    const nextWeekIndex = lastIndex + 7;
    const nextMonthIndex = lastIndex + 30;

    const nextWeek = Math.max(0, regression.slope * nextWeekIndex + regression.intercept) * 7;
    const nextMonth = Math.max(0, regression.slope * nextMonthIndex + regression.intercept) * 30;

    // Estimate total treatment cost (assume 2 months for most conditions)
    const totalEstimated = nextMonth * 2;

    return {
      nextWeek,
      nextMonth,
      totalEstimated,
      confidence: Math.min(0.95, Math.max(0.1, regression.r2))
    };
  }

  async predictExpenses(medicines: MedicineRecord[]): Promise<PredictionResult> {
    try {
      // Extract features
      const features = this.extractFeatures(medicines);

      // Generate predictions
      const predictions = this.generatePredictions(features);

      // Generate insights using Groq
      const insights = await this.generateInsights(features, predictions);

      // Create charts data
      const charts = this.generateCharts(features, predictions);

      return {
        predictions,
        insights,
        charts,
        confidence: predictions.confidence
      };

    } catch (error) {
      console.error('Expense prediction error:', error);
      throw new Error('Failed to generate expense predictions');
    }
  }

  private async generateInsights(features: FeaturesData, predictions: PredictionData): Promise<string[]> {
    try {
      const prompt = `
        Based on the following medical expense data, provide 3-4 concise insights about future expenses:

        Current daily expenses: ₹${features.dailyExpenses.slice(-7).reduce((a, b) => a + b, 0).toFixed(0)}
        Weekly average: ₹${(features.dailyExpenses.slice(-7).reduce((a, b) => a + b, 0) * 7).toFixed(0)}
        Predicted next week: ₹${predictions.nextWeek.toFixed(0)}
        Predicted next month: ₹${predictions.nextMonth.toFixed(0)}
        Total estimated: ₹${predictions.totalEstimated.toFixed(0)}
        Confidence: ${(predictions.confidence * 100).toFixed(0)}%

        Most used medicines: ${Object.entries(features.medicineFrequency)
          .sort(([, a], [, b]) => (b as number) - (a as number))
          .slice(0, 3)
          .map(([name, freq]) => `${name} (${freq}x daily)`)
          .join(', ')}

        Provide insights in a natural, helpful tone. Focus on trends, recommendations, and cost-saving opportunities.
      `;

      const response = await groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "mixtral-8x7b-32768",
        temperature: 0.3,
        max_tokens: 300
      });

      const insightsText = response.choices[0]?.message?.content || "";
      return insightsText.split('\n').filter(line => line.trim().length > 0).slice(0, 4);

    } catch (error) {
      console.error('Groq API error:', error);
      return [
        `Projected expense next week: ₹${predictions.nextWeek.toFixed(0)}`,
        `Monthly estimate: ₹${predictions.nextMonth.toFixed(0)}`,
        "Consider cost-effective alternatives for long-term treatment"
      ];
    }
  }

  private generateCharts(features: FeaturesData, predictions: PredictionData) {
    // Expense trend chart
    const expenseTrend = features.timeSeries.slice(-30); // Last 30 days

    // Medicine breakdown
    const medicineBreakdown = Object.entries(features.medicineFrequency)
      .map(([medicine, frequency]) => ({
        medicine,
        amount: this.estimatePrice({ name: medicine } as MedicineRecord) * (frequency as number),
        percentage: 0 // Will be calculated below
      }))
      .sort((a, b) => b.amount - a.amount);

    const totalAmount = medicineBreakdown.reduce((sum, item) => sum + item.amount, 0);
    medicineBreakdown.forEach(item => {
      item.percentage = (item.amount / totalAmount) * 100;
    });

    // Projection chart
    const projectionChart = [
      { period: 'Current Week', predicted: features.dailyExpenses.slice(-7).reduce((a, b) => a + b, 0) * 7, confidence: [0, 0] as [number, number] },
      { period: 'Next Week', predicted: predictions.nextWeek, confidence: [predictions.nextWeek * 0.8, predictions.nextWeek * 1.2] as [number, number] },
      { period: 'Next Month', predicted: predictions.nextMonth, confidence: [predictions.nextMonth * 0.85, predictions.nextMonth * 1.15] as [number, number] },
      { period: 'Total Estimate', predicted: predictions.totalEstimated, confidence: [predictions.totalEstimated * 0.75, predictions.totalEstimated * 1.25] as [number, number] }
    ];

    return {
      expenseTrend,
      medicineBreakdown: medicineBreakdown.slice(0, 8), // Top 8 medicines
      projectionChart
    };
  }
}

export const expensePredictionEngine = new ExpensePredictionEngine();
