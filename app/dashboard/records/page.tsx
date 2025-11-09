"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { Bar, Pie, Line, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { motion } from "framer-motion";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
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

export default function RecordsPage() {
  const { user } = useAuth();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "expiring" | "expired">("all");

  // Manual entry form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    dosage: "",
    expiryDate: "",
    purchaseDate: "",
    code: ""
  });
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchMedicines();
    }
  }, [user]);

  const fetchMedicines = async () => {
    if (!user) return;

    try {
      const response = await fetch(`/api/medicines?userId=${user.uid}`);
      const data = await response.json();
      const medicinesData = data.medicines || [];

      setMedicines(medicinesData);
    } catch (error) {
      console.error("Failed to fetch medicines:", error);
    } finally {
      setLoading(false);
    }
  };

  const getExpiryStatus = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) return { status: "expired", color: "red", text: "Expired", glowColor: "red" };
    if (daysUntilExpiry <= 30) return { status: "expiring", color: "orange", text: `${daysUntilExpiry} days left`, glowColor: "orange" };
    return { status: "safe", color: "green", text: "Safe", glowColor: "green" };
  };

  const filteredMedicines = medicines.filter((med) => {
    if (filter === "all") return true;
    const { status } = getExpiryStatus(med.expiryDate);
    return status === filter;
  });

  const deleteMedicine = async (id: string) => {
    if (!confirm("Are you sure you want to delete this medicine?")) return;

    try {
      const response = await fetch(`/api/medicines?id=${id}&userId=${user?.uid}`, {
        method: "DELETE"
      });

      if (response.ok) {
        setMedicines(medicines.filter(m => m._id !== id));
      } else {
        console.error("Failed to delete medicine");
      }
    } catch (error) {
      console.error("Failed to delete medicine:", error);
    }
  };

  // Manual entry form handler
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.name || !formData.expiryDate) return;

    setFormLoading(true);
    try {
      const response = await fetch("/api/medicines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          userId: user.uid,
          userEmail: user.email,
          addCalendar: true,
        })
      });

      if (response.ok) {
        const result = await response.json();
        setFormData({
          name: "",
          company: "",
          dosage: "",
          expiryDate: "",
          purchaseDate: "",
          code: ""
        });
        setShowAddForm(false);
        fetchMedicines(); // Refresh the list
      } else {
        console.error("Failed to add medicine");
      }
    } catch (error) {
      console.error("Error adding medicine:", error);
    } finally {
      setFormLoading(false);
    }
  };

  // Load sample data for testing
  const loadSampleData = async () => {
    if (!user) return;

    setFormLoading(true);
    try {
      const response = await fetch("/api/sample-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid })
      });

      if (response.ok) {
        fetchMedicines(); // Refresh the list
        alert("Sample data loaded successfully! You now have 8 medicines to explore the analytics.");
      } else {
        console.error("Failed to load sample data");
      }
    } catch (error) {
      console.error("Error loading sample data:", error);
    } finally {
      setFormLoading(false);
    }
  };

  const getAnalyticsData = () => {
    const totalMedicines = medicines.length;
    const expiredCount = medicines.filter(m => getExpiryStatus(m.expiryDate).status === "expired").length;
    const expiringCount = medicines.filter(m => getExpiryStatus(m.expiryDate).status === "expiring").length;
    const safeCount = medicines.filter(m => getExpiryStatus(m.expiryDate).status === "safe").length;

    // Company distribution
    const companyStats = medicines.reduce((acc, med) => {
      const company = med.company || "Unknown";
      acc[company] = (acc[company] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Dosage distribution
    const dosageStats = medicines.reduce((acc, med) => {
      if (med.dosage) {
        const dosage = med.dosage.toLowerCase().replace(/[^\d.]/g, '').split('.')[0] + 'mg';
        acc[dosage] = (acc[dosage] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    // Monthly expiry pattern
    const monthlyExpiry = medicines.reduce((acc, med) => {
      const month = new Date(med.expiryDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Purchase vs Expiry timeline
    const purchaseExpiryData = medicines.map(med => ({
      name: med.name.substring(0, 20) + (med.name.length > 20 ? '...' : ''),
      purchaseDate: med.purchaseDate ? new Date(med.purchaseDate) : null,
      expiryDate: new Date(med.expiryDate),
      status: getExpiryStatus(med.expiryDate).status
    }));

    // Expiry timeline (next 30 days)
    const today = new Date();
    const expiryTimeline = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const expiringOnDate = medicines.filter(med => {
        const expDate = new Date(med.expiryDate);
        return expDate.toDateString() === date.toDateString();
      }).length;
      expiryTimeline.push({
        date: date.toLocaleDateString(),
        count: expiringOnDate
      });
    }

    // Health insights
    const avgDaysToExpiry = medicines.reduce((acc, med) => {
      const days = Math.ceil((new Date(med.expiryDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return acc + days;
    }, 0) / medicines.length || 0;

    const criticalMedicines = medicines.filter(m => {
      const days = Math.ceil((new Date(m.expiryDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return days <= 7;
    });

    return {
      totalMedicines,
      expiredCount,
      expiringCount,
      safeCount,
      companyStats,
      dosageStats,
      monthlyExpiry,
      purchaseExpiryData,
      expiryTimeline,
      avgDaysToExpiry,
      criticalMedicines: criticalMedicines.length,
      healthScore: Math.max(0, Math.min(100, (safeCount / totalMedicines) * 100))
    };
  };

  const analytics = getAnalyticsData();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full"
    >
      {/* Main Records Card */}
      <div className="bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-cyan-500/20 shadow-2xl shadow-cyan-500/10 overflow-hidden">
        <div className="p-8 lg:p-12">
          {/* Floating Header */}
          <div className="text-center mb-12">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <h1 className="text-4xl lg:text-6xl font-bold mb-4 bg-gradient-to-r from-cyan-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent drop-shadow-lg">
                📋 Track Records
              </h1>
              <p className="text-lg lg:text-xl text-slate-300 font-medium">
                Monitor all your medications and expiry dates
              </p>
            </motion.div>
          </div>

          {/* Quick Stats Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-slate-800/60 backdrop-blur-xl rounded-2xl p-6 border border-cyan-500/20 shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/25 transition-all duration-300 text-center"
            >
              <div className="text-4xl font-bold text-cyan-400 mb-2 drop-shadow-lg">{analytics.totalMedicines}</div>
              <div className="text-sm text-slate-400 font-medium">Total Medicines</div>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-slate-800/60 backdrop-blur-xl rounded-2xl p-6 border border-green-500/20 shadow-lg shadow-green-500/10 hover:shadow-green-500/25 transition-all duration-300 text-center"
            >
              <div className="text-4xl font-bold text-green-400 mb-2 drop-shadow-lg">{analytics.safeCount}</div>
              <div className="text-sm text-slate-400 font-medium">Safe</div>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-slate-800/60 backdrop-blur-xl rounded-2xl p-6 border border-orange-500/20 shadow-lg shadow-orange-500/10 hover:shadow-orange-500/25 transition-all duration-300 text-center"
            >
              <div className="text-4xl font-bold text-orange-400 mb-2 drop-shadow-lg">{analytics.expiringCount}</div>
              <div className="text-sm text-slate-400 font-medium">Expiring Soon</div>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-slate-800/60 backdrop-blur-xl rounded-2xl p-6 border border-red-500/20 shadow-lg shadow-red-500/10 hover:shadow-red-500/25 transition-all duration-300 text-center"
            >
              <div className="text-4xl font-bold text-red-400 mb-2 drop-shadow-lg">{analytics.expiredCount}</div>
              <div className="text-sm text-slate-400 font-medium">Expired</div>
            </motion.div>
          </motion.div>

          {/* Data Science Analytics Section */}
          {medicines.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12"
            >
              {/* Expiry Status Distribution */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-slate-800/60 backdrop-blur-xl rounded-2xl p-6 border border-cyan-500/20 shadow-lg shadow-cyan-500/10"
              >
                <h3 className="text-xl font-bold text-slate-200 mb-6 flex items-center">
                  📊 Expiry Status Distribution
                </h3>
                <div className="h-80">
                  <Pie
                    data={{
                      labels: ['Safe', 'Expiring Soon', 'Expired'],
                      datasets: [{
                        data: [analytics.safeCount, analytics.expiringCount, analytics.expiredCount],
                        backgroundColor: ['#22c55e', '#f59e0b', '#ef4444'],
                        borderColor: ['#16a34a', '#d97706', '#dc2626'],
                        borderWidth: 2,
                      }],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { position: 'bottom', labels: { color: '#94a3b8' } },
                        tooltip: {
                          backgroundColor: 'rgba(15, 23, 42, 0.9)',
                          titleColor: '#e2e8f0',
                          bodyColor: '#e2e8f0',
                          callbacks: {
                            label: (context) => `${context.label}: ${context.parsed} medicines`
                          }
                        }
                      }
                    }}
                  />
                </div>
              </motion.div>

              {/* Company Distribution */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-slate-800/60 backdrop-blur-xl rounded-2xl p-6 border border-pink-500/20 shadow-lg shadow-pink-500/10"
              >
                <h3 className="text-xl font-bold text-slate-200 mb-6 flex items-center">
                  🏢 Company Distribution
                </h3>
                <div className="h-80">
                  <Doughnut
                    data={{
                      labels: Object.keys(analytics.companyStats),
                      datasets: [{
                        data: Object.values(analytics.companyStats),
                        backgroundColor: [
                          '#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6',
                          '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#6366f1'
                        ],
                        borderWidth: 2,
                      }],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { position: 'bottom', labels: { color: '#94a3b8', boxWidth: 12 } },
                      }
                    }}
                  />
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Advanced Analytics Section */}
          {medicines.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.6 }}
              className="space-y-8"
            >
              {/* Health Score & Insights */}
              <motion.div
                whileHover={{ scale: 1.01 }}
                className="bg-slate-800/60 backdrop-blur-xl rounded-2xl p-8 border border-purple-500/20 shadow-lg shadow-purple-500/10"
              >
                <h3 className="text-2xl font-bold text-slate-200 mb-6 flex items-center">
                  🏥 Health Insights Dashboard
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl p-6 border border-purple-500/30"
                  >
                    <div className="text-3xl font-bold text-purple-300 mb-2">{analytics.healthScore.toFixed(1)}%</div>
                    <div className="text-sm text-slate-300">Medicine Health Score</div>
                    <div className="text-xs text-slate-400 mt-1">
                      {analytics.healthScore > 80 ? 'Excellent' : analytics.healthScore > 60 ? 'Good' : analytics.healthScore > 40 ? 'Fair' : 'Poor'}
                    </div>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl p-6 border border-blue-500/30"
                  >
                    <div className="text-3xl font-bold text-blue-300 mb-2">{analytics.avgDaysToExpiry.toFixed(0)}</div>
                    <div className="text-sm text-slate-300">Avg Days to Expiry</div>
                    <div className="text-xs text-slate-400 mt-1">Overall shelf life</div>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-xl p-6 border border-orange-500/30"
                  >
                    <div className="text-3xl font-bold text-orange-300 mb-2">{analytics.criticalMedicines}</div>
                    <div className="text-sm text-slate-300">Critical (≤7 days)</div>
                    <div className="text-xs text-slate-400 mt-1">Need immediate attention</div>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl p-6 border border-green-500/30"
                  >
                    <div className="text-3xl font-bold text-green-300 mb-2">
                      {Object.keys(analytics.companyStats).length}
                    </div>
                    <div className="text-sm text-slate-300">Unique Companies</div>
                    <div className="text-xs text-slate-400 mt-1">Brand diversity</div>
                  </motion.div>
                </div>
              </motion.div>

              {/* Dosage Distribution & Monthly Patterns */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Dosage Distribution */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-slate-800/60 backdrop-blur-xl rounded-2xl p-6 border border-indigo-500/20 shadow-lg shadow-indigo-500/10"
                >
                  <h3 className="text-xl font-bold text-slate-200 mb-6 flex items-center">
                    💊 Dosage Distribution
                  </h3>
                  <div className="h-80">
                    <Bar
                      data={{
                        labels: Object.keys(analytics.dosageStats).slice(0, 10),
                        datasets: [{
                          label: 'Medicines by Dosage',
                          data: Object.values(analytics.dosageStats).slice(0, 10),
                          backgroundColor: 'rgba(99, 102, 241, 0.8)',
                          borderColor: '#6366f1',
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
                          }
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            ticks: { stepSize: 1, color: '#94a3b8' },
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

                {/* Monthly Expiry Pattern */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-slate-800/60 backdrop-blur-xl rounded-2xl p-6 border border-teal-500/20 shadow-lg shadow-teal-500/10"
                >
                  <h3 className="text-xl font-bold text-slate-200 mb-6 flex items-center">
                    📅 Monthly Expiry Pattern
                  </h3>
                  <div className="h-80">
                    <Bar
                      data={{
                        labels: Object.keys(analytics.monthlyExpiry),
                        datasets: [{
                          label: 'Medicines Expiring',
                          data: Object.values(analytics.monthlyExpiry),
                          backgroundColor: [
                            '#14b8a6', '#0d9488', '#0f766e', '#115e59',
                            '#134e4a', '#042f2e', '#ec4899', '#db2777'
                          ],
                          borderWidth: 2,
                          borderRadius: 6,
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
                          }
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            ticks: { stepSize: 1, color: '#94a3b8' },
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
              </div>

              {/* Purchase vs Expiry Timeline */}
              {analytics.purchaseExpiryData.filter(d => d.purchaseDate).length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.1, duration: 0.6 }}
                  className="bg-slate-800/60 backdrop-blur-xl rounded-2xl p-8 border border-rose-500/20 shadow-lg shadow-rose-500/10"
                >
                  <h3 className="text-2xl font-bold text-slate-200 mb-6 flex items-center">
                    ⏱️ Purchase to Expiry Timeline
                  </h3>
                  <div className="overflow-x-auto">
                    <div className="min-w-full">
                      <div className="space-y-4">
                        {analytics.purchaseExpiryData.filter(d => d.purchaseDate).slice(0, 8).map((item, idx) => {
                          const purchaseDate = item.purchaseDate!;
                          const expiryDate = item.expiryDate;
                          const totalDays = Math.ceil((expiryDate.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24));
                          const daysUsed = Math.ceil((new Date().getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24));
                          const progressPercent = Math.min(100, Math.max(0, (daysUsed / totalDays) * 100));

                          return (
                            <motion.div
                              key={idx}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 1.2 + idx * 0.1, duration: 0.5 }}
                              className="bg-slate-700/40 rounded-xl p-4 border border-slate-600/20"
                            >
                              <div className="flex justify-between items-center mb-2">
                                <span className="font-semibold text-slate-200">{item.name}</span>
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  item.status === 'expired' ? 'bg-red-500/20 text-red-300' :
                                  item.status === 'expiring' ? 'bg-orange-500/20 text-orange-300' :
                                  'bg-green-500/20 text-green-300'
                                }`}>
                                  {item.status}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm text-slate-400 mb-2">
                                <span>Purchased: {purchaseDate.toLocaleDateString()}</span>
                                <span>Expires: {expiryDate.toLocaleDateString()}</span>
                              </div>
                              <div className="w-full bg-slate-600 rounded-full h-2">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${progressPercent}%` }}
                                  transition={{ delay: 1.5 + idx * 0.1, duration: 1 }}
                                  className={`h-2 rounded-full ${
                                    progressPercent > 90 ? 'bg-red-500' :
                                    progressPercent > 70 ? 'bg-orange-500' :
                                    'bg-green-500'
                                  }`}
                                />
                              </div>
                              <div className="text-xs text-slate-500 mt-1">
                                {Math.max(0, totalDays - daysUsed)} days remaining
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Data Insights Summary */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.3, duration: 0.6 }}
                className="bg-gradient-to-r from-slate-800/60 to-slate-700/60 backdrop-blur-xl rounded-2xl p-8 border border-slate-500/20 shadow-lg"
              >
                <h3 className="text-2xl font-bold text-slate-200 mb-6 flex items-center">
                  📊 Data Insights & Recommendations
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-slate-700/40 rounded-xl p-6 border border-slate-600/20">
                    <div className="text-2xl mb-3">💡</div>
                    <h4 className="font-bold text-slate-200 mb-2">Usage Pattern</h4>
                    <p className="text-sm text-slate-400">
                      {analytics.safeCount > analytics.expiringCount + analytics.expiredCount
                        ? "Great job maintaining fresh medicines!"
                        : "Consider using medicines before they expire to optimize your health investment."}
                    </p>
                  </div>

                  <div className="bg-slate-700/40 rounded-xl p-6 border border-slate-600/20">
                    <div className="text-2xl mb-3">🏢</div>
                    <h4 className="font-bold text-slate-200 mb-2">Brand Diversity</h4>
                    <p className="text-sm text-slate-400">
                      You have medicines from {Object.keys(analytics.companyStats).length} different companies.
                      {Object.keys(analytics.companyStats).length > 3
                        ? " Good diversification reduces dependency on single brands."
                        : " Consider trying different brands for better options."}
                    </p>
                  </div>

                  <div className="bg-slate-700/40 rounded-xl p-6 border border-slate-600/20">
                    <div className="text-2xl mb-3">⏰</div>
                    <h4 className="font-bold text-slate-200 mb-2">Expiry Planning</h4>
                    <p className="text-sm text-slate-400">
                      Average {analytics.avgDaysToExpiry.toFixed(0)} days to expiry.
                      {analytics.criticalMedicines > 0
                        ? ` ${analytics.criticalMedicines} medicines expire within 7 days - take action!`
                        : " Your expiry timeline looks healthy."}
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Filters and Add Medicine Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0, duration: 0.6 }}
            className="flex flex-col lg:flex-row justify-between items-center gap-6 mb-8"
          >
            {/* Filters */}
            <div className="bg-slate-800/60 backdrop-blur-xl rounded-2xl p-6 border border-cyan-500/20 shadow-lg shadow-cyan-500/10">
              <div className="flex flex-wrap gap-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setFilter("all")}
                  className={`px-6 py-3 rounded-xl font-bold transition-all duration-300 ${
                    filter === "all"
                      ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-xl scale-105 border border-cyan-400/20"
                      : "bg-slate-700/60 hover:bg-slate-600/60 text-slate-300 hover:shadow-lg border border-slate-600/20"
                  }`}
                >
                  All Medicines ({medicines.length})
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setFilter("expiring")}
                  className={`px-6 py-3 rounded-xl font-bold transition-all duration-300 ${
                    filter === "expiring"
                      ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-xl scale-105 border border-orange-400/20"
                      : "bg-slate-700/60 hover:bg-slate-600/60 text-slate-300 hover:shadow-lg border border-slate-600/20"
                  }`}
                >
                  Expiring Soon ({medicines.filter(m => getExpiryStatus(m.expiryDate).status === "expiring").length})
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setFilter("expired")}
                  className={`px-6 py-3 rounded-xl font-bold transition-all duration-300 ${
                    filter === "expired"
                      ? "bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-xl scale-105 border border-red-400/20"
                      : "bg-slate-700/60 hover:bg-slate-600/60 text-slate-300 hover:shadow-lg border border-slate-600/20"
                  }`}
                >
                  Expired ({medicines.filter(m => getExpiryStatus(m.expiryDate).status === "expired").length})
                </motion.button>
              </div>
            </div>

            {/* Add Medicine Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-2xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 shadow-xl hover:shadow-2xl border border-emerald-400/20"
            >
              {showAddForm ? "✕ Cancel" : "➕ Add Medicine Manually"}
            </motion.button>
          </motion.div>

          {/* Manual Entry Form */}
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-800/60 backdrop-blur-xl rounded-2xl p-8 border border-cyan-500/20 shadow-lg shadow-cyan-500/10 mb-8"
            >
              <h3 className="text-2xl font-bold text-slate-200 mb-6 flex items-center gap-3">
                <span className="text-3xl">📝</span>
                Add Medicine Manually
              </h3>
              <form onSubmit={handleFormSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Medicine Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                    placeholder="e.g., Paracetamol, Aspirin"
                    className="w-full px-4 py-3 border-2 border-cyan-500/30 rounded-xl focus:outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/20 transition-all duration-300 bg-slate-700/60 backdrop-blur-sm text-slate-200 placeholder-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Company</label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({...formData, company: e.target.value})}
                    placeholder="e.g., Pfizer, Johnson & Johnson"
                    className="w-full px-4 py-3 border-2 border-cyan-500/30 rounded-xl focus:outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/20 transition-all duration-300 bg-slate-700/60 backdrop-blur-sm text-slate-200 placeholder-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Dosage</label>
                  <input
                    type="text"
                    value={formData.dosage}
                    onChange={(e) => setFormData({...formData, dosage: e.target.value})}
                    placeholder="e.g., 500mg, 10mg/ml"
                    className="w-full px-4 py-3 border-2 border-cyan-500/30 rounded-xl focus:outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/20 transition-all duration-300 bg-slate-700/60 backdrop-blur-sm text-slate-200 placeholder-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Purchase Date</label>
                  <input
                    type="date"
                    value={formData.purchaseDate}
                    onChange={(e) => setFormData({...formData, purchaseDate: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-cyan-500/30 rounded-xl focus:outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/20 transition-all duration-300 bg-slate-700/60 backdrop-blur-sm text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Expiry Date *</label>
                  <input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
                    required
                    className="w-full px-4 py-3 border-2 border-cyan-500/30 rounded-xl focus:outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/20 transition-all duration-300 bg-slate-700/60 backdrop-blur-sm text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Barcode/Serial Code</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value})}
                    placeholder="Optional barcode or serial number"
                    className="w-full px-4 py-3 border-2 border-cyan-500/30 rounded-xl focus:outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/20 transition-all duration-300 bg-slate-700/60 backdrop-blur-sm text-slate-200 placeholder-slate-400"
                  />
                </div>

                <div className="md:col-span-2 flex gap-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={formLoading || !formData.name || !formData.expiryDate}
                    className="flex-1 px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed hover:from-cyan-600 hover:to-blue-700 transition-all duration-300 shadow-xl hover:shadow-2xl border border-cyan-400/20"
                  >
                    {formLoading ? (
                      <div className="flex items-center justify-center gap-3">
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Adding Medicine...</span>
                      </div>
                    ) : (
                      "💾 Add Medicine"
                    )}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-8 py-4 bg-slate-600 text-white font-bold rounded-2xl hover:bg-slate-700 transition-all duration-300 shadow-lg hover:shadow-xl border border-slate-500/20"
                  >
                    Cancel
                  </motion.button>
                </div>
              </form>
            </motion.div>
          )}

          {/* Medicine List */}
          {loading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-slate-800/60 backdrop-blur-xl rounded-2xl p-16 text-center border border-cyan-500/20"
            >
              <div className="w-20 h-20 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-6 shadow-lg shadow-cyan-500/25"></div>
              <p className="text-xl text-slate-300 font-semibold">Loading medicines...</p>
            </motion.div>
          ) : filteredMedicines.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-slate-800/60 backdrop-blur-xl rounded-2xl p-16 text-center border border-cyan-500/20"
            >
              <div className="text-8xl mb-6">💊</div>
              <h3 className="text-3xl font-bold text-slate-200 mb-4">No Medicines Found</h3>
              <p className="text-lg text-slate-400 mb-8 font-medium">Start by scanning medicines or adding them manually!</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={loadSampleData}
                  disabled={formLoading}
                  className="inline-block px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-bold rounded-2xl hover:from-purple-600 hover:to-pink-700 transition-all duration-300 shadow-xl hover:shadow-2xl border border-purple-400/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {formLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading Sample Data...</span>
                    </div>
                  ) : (
                    "🎯 Load Sample Data (8 Medicines)"
                  )}
                </motion.button>
                <motion.a
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  href="/dashboard/scan"
                  className="inline-block px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-2xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 shadow-xl hover:shadow-2xl border border-emerald-400/20"
                >
                  📱 Scan Medicine
                </motion.a>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowAddForm(true)}
                  className="inline-block px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-2xl hover:from-cyan-600 hover:to-blue-700 transition-all duration-300 shadow-xl hover:shadow-2xl border border-cyan-400/20"
                >
                  ✏️ Add Manually
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.6 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {filteredMedicines.map((medicine, idx) => {
                const { status, color, text, glowColor } = getExpiryStatus(medicine.expiryDate);
                return (
                  <motion.div
                    key={medicine._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.3 + idx * 0.1, duration: 0.5 }}
                    whileHover={{ scale: 1.05, y: -5 }}
                    className={`bg-slate-800/60 backdrop-blur-xl rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 border border-slate-600/20 hover:border-${glowColor}-500/30 p-8 group`}
                  >
                    <div className="flex items-start justify-between mb-6">
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        className="text-6xl group-hover:drop-shadow-lg transition-all duration-300"
                      >
                        💊
                      </motion.div>
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 1.5 + idx * 0.1, type: "spring", stiffness: 200 }}
                        className={`px-4 py-2 rounded-xl text-sm font-bold shadow-lg ${
                          color === "red"
                            ? "bg-red-500/20 border border-red-400/40 text-red-300 shadow-red-500/25"
                            : color === "orange"
                            ? "bg-orange-500/20 border border-orange-400/40 text-orange-300 shadow-orange-500/25"
                            : "bg-green-500/20 border border-green-400/40 text-green-300 shadow-green-500/25"
                        }`}
                      >
                        {text}
                      </motion.span>
                    </div>

                    <h3 className="text-2xl font-bold text-slate-200 mb-4">{medicine.name}</h3>

                    {medicine.company && (
                      <p className="text-base text-slate-400 mb-3 font-medium">
                        <span className="font-bold text-slate-300">Company:</span> {medicine.company}
                      </p>
                    )}

                    {medicine.dosage && (
                      <p className="text-base text-slate-400 mb-3 font-medium">
                        <span className="font-bold text-slate-300">Dosage:</span> {medicine.dosage}
                      </p>
                    )}

                    <p className="text-base text-slate-400 mb-3 font-medium">
                      <span className="font-bold text-slate-300">Expiry:</span> {new Date(medicine.expiryDate).toLocaleDateString()}
                    </p>

                    {medicine.purchaseDate && (
                      <p className="text-base text-slate-400 mb-6 font-medium">
                        <span className="font-bold text-slate-300">Purchased:</span> {new Date(medicine.purchaseDate).toLocaleDateString()}
                      </p>
                    )}

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => deleteMedicine(medicine._id)}
                      className="w-full py-4 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-bold rounded-2xl transition-all duration-300 shadow-xl hover:shadow-2xl border border-red-400/20"
                    >
                      Delete
                    </motion.button>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
