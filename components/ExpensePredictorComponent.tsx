"use client";
import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { User } from "firebase/auth";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

interface Medicine {
  _id: string;
  name: string;
  company?: string;
  dosage?: string;
  expiryDate: string;
  purchaseDate?: string;
  code?: string;
  userId: string;
}

interface PredictionData {
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

interface ExpensePredictorComponentProps {
  medicines: Medicine[];
  userId: string;
  user: User;
}

export default function ExpensePredictorComponent({ medicines, userId, user }: ExpensePredictorComponentProps) {
  const [predictionData, setPredictionData] = useState<PredictionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPredictions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/expense-predictor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ medicines })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch predictions");
      }

      const data = await response.json();
      setPredictionData(data);
    } catch (err: unknown) {
      console.error("Expense prediction error:", err);
      setError(err instanceof Error ? err.message : "Failed to generate expense predictions");
    } finally {
      setLoading(false);
    }
  }, [medicines]);

  useEffect(() => {
    if (medicines.length > 0 && user) {
      fetchPredictions();
    }
  }, [medicines, userId, fetchPredictions]);


  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-6"
        />
        <h3 className="text-xl font-bold text-slate-200 mb-2">Analyzing Expense Patterns</h3>
        <p className="text-slate-400">Generating predictions using advanced ML algorithms...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">⚠️</div>
        <h3 className="text-xl font-bold text-red-300 mb-2">Prediction Error</h3>
        <p className="text-slate-400 mb-6">{error}</p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={fetchPredictions}
          className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold rounded-xl hover:from-amber-600 hover:to-orange-700 transition-all duration-300 shadow-lg hover:shadow-xl"
        >
          🔄 Retry Prediction
        </motion.button>
      </div>
    );
  }

  if (!predictionData) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📊</div>
        <h3 className="text-xl font-bold text-slate-200 mb-2">Expense Predictor</h3>
        <p className="text-slate-400">No prediction data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl lg:text-4xl font-bold mb-4 bg-gradient-to-r from-amber-400 via-orange-400 to-red-400 bg-clip-text text-transparent drop-shadow-lg">
            💰 Expense Predictor
          </h2>
          <p className="text-lg text-slate-300 font-medium">
            AI-Powered Medical Expense Forecasting
          </p>
        </motion.div>
      </div>

      {/* Key Predictions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-6"
      >
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-xl p-6 border border-amber-500/30"
        >
          <div className="text-2xl font-bold text-amber-300 mb-2">
            {formatCurrency(predictionData.predictions.nextWeek)}
          </div>
          <div className="text-sm text-slate-300">Next Week</div>
          <div className="text-xs text-slate-400 mt-1">Predicted spend</div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-xl p-6 border border-orange-500/30"
        >
          <div className="text-2xl font-bold text-orange-300 mb-2">
            {formatCurrency(predictionData.predictions.nextMonth)}
          </div>
          <div className="text-sm text-slate-300">Next Month</div>
          <div className="text-xs text-slate-400 mt-1">Monthly estimate</div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-gradient-to-br from-red-500/20 to-pink-500/20 rounded-xl p-6 border border-red-500/30"
        >
          <div className="text-2xl font-bold text-red-300 mb-2">
            {formatCurrency(predictionData.predictions.totalEstimated)}
          </div>
          <div className="text-sm text-slate-300">Total Estimate</div>
          <div className="text-xs text-slate-400 mt-1">Complete treatment</div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl p-6 border border-green-500/30"
        >
          <div className="text-2xl font-bold text-green-300 mb-2">
            {(predictionData.confidence * 100).toFixed(0)}%
          </div>
          <div className="text-sm text-slate-300">Confidence</div>
          <div className="text-xs text-slate-400 mt-1">Prediction accuracy</div>
        </motion.div>
      </motion.div>

      {/* AI Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="bg-slate-700/40 backdrop-blur-xl rounded-2xl p-6 border border-slate-600/20"
      >
        <h3 className="text-xl font-bold text-slate-200 mb-4 flex items-center">
          🤖 AI Insights & Recommendations
        </h3>
        <div className="space-y-3">
          {predictionData.insights.map((insight, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + idx * 0.1, duration: 0.5 }}
              className="flex items-start gap-3 p-4 bg-slate-600/40 rounded-xl border border-slate-500/20"
            >
              <span className="text-amber-400 font-bold mt-1">💡</span>
              <p className="text-slate-300 text-sm leading-relaxed">{insight}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Expense Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="bg-slate-700/40 backdrop-blur-xl rounded-2xl p-6 border border-slate-600/20"
        >
          <h3 className="text-xl font-bold text-slate-200 mb-6 flex items-center">
            📈 Expense Trend (Last 30 Days)
          </h3>
          <div className="h-80">
            <Line
              data={{
                labels: predictionData.charts.expenseTrend.map(d => new Date(d.date).toLocaleDateString()),
                datasets: [{
                  label: 'Daily Expenses',
                  data: predictionData.charts.expenseTrend.map(d => d.amount),
                  borderColor: '#f59e0b',
                  backgroundColor: 'rgba(245, 158, 11, 0.1)',
                  borderWidth: 3,
                  fill: true,
                  tension: 0.4,
                  pointBackgroundColor: '#f59e0b',
                  pointBorderColor: '#fff',
                  pointBorderWidth: 2,
                  pointRadius: 6,
                  pointHoverRadius: 8,
                }],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    titleColor: '#e2e8f0',
                    bodyColor: '#e2e8f0',
                    callbacks: {
                      label: (context) => context.parsed.y !== null ? `Expense: ${formatCurrency(context.parsed.y)}` : 'No data'
                    }
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      color: '#94a3b8',
                      callback: (value) => formatCurrency(Number(value))
                    },
                    grid: { color: 'rgba(100, 116, 139, 0.1)' }
                  },
                  x: {
                    ticks: { color: '#94a3b8' },
                    grid: { display: false }
                  }
                }
              }}
            />
          </div>
        </motion.div>

        {/* Medicine Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="bg-slate-700/40 backdrop-blur-xl rounded-2xl p-6 border border-slate-600/20"
        >
          <h3 className="text-xl font-bold text-slate-200 mb-6 flex items-center">
            💊 Medicine Expense Breakdown
          </h3>
          <div className="h-80">
            <Bar
              data={{
                labels: predictionData.charts.medicineBreakdown.map(m => m.medicine.substring(0, 12) + (m.medicine.length > 12 ? '...' : '')),
                datasets: [{
                  label: 'Cost Contribution',
                  data: predictionData.charts.medicineBreakdown.map(m => m.amount),
                  backgroundColor: [
                    '#f59e0b', '#ef4444', '#22c55e', '#3b82f6', '#8b5cf6',
                    '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#6366f1'
                  ],
                  borderWidth: 2,
                  borderRadius: 8,
                  borderSkipped: false,
                }],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    titleColor: '#e2e8f0',
                    bodyColor: '#e2e8f0',
                    callbacks: {
                      label: (context) => {
                        const item = predictionData.charts.medicineBreakdown[context.dataIndex];
                        return [
                          `Cost: ${formatCurrency(item.amount)}`,
                          `Percentage: ${item.percentage.toFixed(1)}%`
                        ];
                      }
                    }
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      color: '#94a3b8',
                      callback: (value) => formatCurrency(Number(value))
                    },
                    grid: { color: 'rgba(100, 116, 139, 0.1)' }
                  },
                  x: {
                    ticks: { color: '#94a3b8', maxRotation: 45 },
                    grid: { display: false }
                  }
                }
              }}
            />
          </div>
        </motion.div>
      </div>

      {/* Projection Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0, duration: 0.6 }}
        className="bg-slate-700/40 backdrop-blur-xl rounded-2xl p-6 border border-slate-600/20"
      >
        <h3 className="text-xl font-bold text-slate-200 mb-6 flex items-center">
          🔮 Expense Projection (Confidence Intervals)
        </h3>
        <div className="h-80">
          <Line
            data={{
              labels: predictionData.charts.projectionChart.map(p => p.period),
              datasets: [
                {
                  label: 'Predicted Expense',
                  data: predictionData.charts.projectionChart.map(p => p.predicted),
                  borderColor: '#f59e0b',
                  backgroundColor: 'rgba(245, 158, 11, 0.1)',
                  borderWidth: 3,
                  fill: false,
                  tension: 0.4,
                  pointBackgroundColor: '#f59e0b',
                  pointBorderColor: '#fff',
                  pointBorderWidth: 2,
                  pointRadius: 8,
                  pointHoverRadius: 10,
                },
                {
                  label: 'Confidence Range (Upper)',
                  data: predictionData.charts.projectionChart.map(p => p.confidence[1]),
                  borderColor: 'rgba(239, 68, 68, 0.5)',
                  borderWidth: 2,
                  fill: false,
                  tension: 0.4,
                  pointRadius: 0,
                  borderDash: [5, 5],
                },
                {
                  label: 'Confidence Range (Lower)',
                  data: predictionData.charts.projectionChart.map(p => p.confidence[0]),
                  borderColor: 'rgba(34, 197, 94, 0.5)',
                  borderWidth: 2,
                  fill: '+1',
                  backgroundColor: 'rgba(34, 197, 94, 0.1)',
                  tension: 0.4,
                  pointRadius: 0,
                  borderDash: [5, 5],
                }
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  labels: { color: '#94a3b8' }
                },
                tooltip: {
                  backgroundColor: 'rgba(15, 23, 42, 0.9)',
                  titleColor: '#e2e8f0',
                  bodyColor: '#e2e8f0',
                  callbacks: {
                    label: (context) => {
                      if (context.datasetIndex === 0) {
                        return context.parsed.y !== null ? `Predicted: ${formatCurrency(context.parsed.y)}` : 'No data';
                      } else if (context.datasetIndex === 1) {
                        return context.parsed.y !== null ? `Upper Bound: ${formatCurrency(context.parsed.y)}` : 'No data';
                      } else {
                        return context.parsed.y !== null ? `Lower Bound: ${formatCurrency(context.parsed.y)}` : 'No data';
                      }
                    }
                  }
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    color: '#94a3b8',
                    callback: (value) => formatCurrency(Number(value))
                  },
                  grid: { color: 'rgba(100, 116, 139, 0.1)' }
                },
                x: {
                  ticks: { color: '#94a3b8' },
                  grid: { display: false }
                }
              }
            }}
          />
        </div>
        <div className="mt-4 text-center">
          <p className="text-sm text-slate-400">
            Confidence intervals show the predicted expense range based on historical patterns and market variations
          </p>
        </div>
      </motion.div>

      {/* Refresh Button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.6 }}
        className="text-center"
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={fetchPredictions}
          disabled={loading}
          className="px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold rounded-2xl hover:from-amber-600 hover:to-orange-700 transition-all duration-300 shadow-xl hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed border border-amber-400/20"
        >
          {loading ? (
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Recalculating...</span>
            </div>
          ) : (
            <>🔄 Refresh Predictions</>
          )}
        </motion.button>
        <p className="text-xs text-slate-400 mt-3">
          Updates predictions with latest medicine data and market trends
        </p>
      </motion.div>
    </div>
  );
}
