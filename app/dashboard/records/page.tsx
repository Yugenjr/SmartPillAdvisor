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

    if (daysUntilExpiry < 0) return { status: "expired", color: "red", text: "Expired" };
    if (daysUntilExpiry <= 30) return { status: "expiring", color: "orange", text: `${daysUntilExpiry} days left` };
    return { status: "safe", color: "green", text: "Safe" };
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

    return {
      totalMedicines,
      expiredCount,
      expiringCount,
      safeCount,
      companyStats,
      expiryTimeline
    };
  };

  const analytics = getAnalyticsData();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 overflow-y-auto">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 rounded-3xl p-10 text-white shadow-2xl">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute -top-4 -right-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-white/5 rounded-full blur-xl"></div>
        <div className="relative z-10">
          <h1 className="text-4xl font-bold mb-3">📋 Track Medicine Records</h1>
          <p className="text-xl text-blue-100 font-medium">Monitor all your medications and expiry dates</p>
        </div>
      </div>

      {/* Quick Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/20 text-center">
          <div className="text-4xl font-bold text-blue-600 mb-2">{analytics.totalMedicines}</div>
          <div className="text-sm text-gray-600 font-medium">Total Medicines</div>
        </div>
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/20 text-center">
          <div className="text-4xl font-bold text-green-600 mb-2">{analytics.safeCount}</div>
          <div className="text-sm text-gray-600 font-medium">Safe</div>
        </div>
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/20 text-center">
          <div className="text-4xl font-bold text-orange-600 mb-2">{analytics.expiringCount}</div>
          <div className="text-sm text-gray-600 font-medium">Expiring Soon</div>
        </div>
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/20 text-center">
          <div className="text-4xl font-bold text-red-600 mb-2">{analytics.expiredCount}</div>
          <div className="text-sm text-gray-600 font-medium">Expired</div>
        </div>
      </div>

      {/* Data Science Analytics Section */}
      {medicines.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Expiry Status Distribution */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl p-8 border border-white/20">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">📊 Expiry Status Distribution</h3>
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
                    legend: { position: 'bottom' },
                    tooltip: {
                      callbacks: {
                        label: (context) => `${context.label}: ${context.parsed} medicines`
                      }
                    }
                  }
                }}
              />
            </div>
          </div>

          {/* Company Distribution */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl p-8 border border-white/20">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">🏢 Company Distribution</h3>
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
                    legend: { position: 'bottom', labels: { boxWidth: 12 } },
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Expiry Timeline (30-day forecast) */}
      {medicines.length > 0 && (
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl p-8 border border-white/20">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">📅 30-Day Expiry Forecast</h3>
          <div className="h-80">
            <Line
              data={{
                labels: analytics.expiryTimeline.map(d => d.date.split(' ')[1] + ' ' + d.date.split(' ')[2]),
                datasets: [{
                  label: 'Medicines Expiring',
                  data: analytics.expiryTimeline.map(d => d.count),
                  borderColor: '#3b82f6',
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  borderWidth: 3,
                  fill: true,
                  tension: 0.4,
                  pointRadius: 4,
                  pointHoverRadius: 6,
                }],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  tooltip: {
                    callbacks: {
                      label: (context) => `${context.parsed.y} medicine(s) expiring on ${context.label}`
                    }
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: { stepSize: 1 }
                  }
                }
              }}
            />
          </div>
        </div>
      )}

      {/* Filters and Add Medicine Button */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
        {/* Filters */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl p-8 border border-white/20">
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => setFilter("all")}
              className={`px-8 py-4 rounded-2xl font-bold transition-all duration-300 transform hover:scale-105 ${
                filter === "all"
                  ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-xl scale-105"
                  : "bg-white/60 backdrop-blur-sm border-2 border-white/50 text-gray-700 hover:bg-white/80 shadow-lg hover:shadow-xl"
              }`}
            >
              All Medicines ({medicines.length})
            </button>
            <button
              onClick={() => setFilter("expiring")}
              className={`px-8 py-4 rounded-2xl font-bold transition-all duration-300 transform hover:scale-105 ${
                filter === "expiring"
                  ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-xl scale-105"
                  : "bg-white/60 backdrop-blur-sm border-2 border-white/50 text-gray-700 hover:bg-white/80 shadow-lg hover:shadow-xl"
              }`}
            >
              Expiring Soon ({medicines.filter(m => getExpiryStatus(m.expiryDate).status === "expiring").length})
            </button>
            <button
              onClick={() => setFilter("expired")}
              className={`px-8 py-4 rounded-2xl font-bold transition-all duration-300 transform hover:scale-105 ${
                filter === "expired"
                  ? "bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-xl scale-105"
                  : "bg-white/60 backdrop-blur-sm border-2 border-white/50 text-gray-700 hover:bg-white/80 shadow-lg hover:shadow-xl"
              }`}
            >
              Expired ({medicines.filter(m => getExpiryStatus(m.expiryDate).status === "expired").length})
            </button>
          </div>
        </div>

        {/* Add Medicine Button */}
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-2xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105"
        >
          {showAddForm ? "✕ Cancel" : "➕ Add Medicine Manually"}
        </button>
      </div>

      {/* Manual Entry Form */}
      {showAddForm && (
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl p-8 border border-white/20">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">📝 Add Medicine Manually</h3>
          <form onSubmit={handleFormSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2">Medicine Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
                placeholder="e.g., Paracetamol, Aspirin"
                className="w-full px-4 py-3 border-2 border-gray-200/50 rounded-2xl focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 bg-white/50 backdrop-blur-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Company</label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({...formData, company: e.target.value})}
                placeholder="e.g., Pfizer, Johnson & Johnson"
                className="w-full px-4 py-3 border-2 border-gray-200/50 rounded-2xl focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 bg-white/50 backdrop-blur-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Dosage</label>
              <input
                type="text"
                value={formData.dosage}
                onChange={(e) => setFormData({...formData, dosage: e.target.value})}
                placeholder="e.g., 500mg, 10mg/ml"
                className="w-full px-4 py-3 border-2 border-gray-200/50 rounded-2xl focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 bg-white/50 backdrop-blur-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Purchase Date</label>
              <input
                type="date"
                value={formData.purchaseDate}
                onChange={(e) => setFormData({...formData, purchaseDate: e.target.value})}
                className="w-full px-4 py-3 border-2 border-gray-200/50 rounded-2xl focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 bg-white/50 backdrop-blur-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Expiry Date *</label>
              <input
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
                required
                className="w-full px-4 py-3 border-2 border-gray-200/50 rounded-2xl focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 bg-white/50 backdrop-blur-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Barcode/Serial Code</label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({...formData, code: e.target.value})}
                placeholder="Optional barcode or serial number"
                className="w-full px-4 py-3 border-2 border-gray-200/50 rounded-2xl focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 bg-white/50 backdrop-blur-sm"
              />
            </div>

            <div className="md:col-span-2 flex gap-4">
              <button
                type="submit"
                disabled={formLoading || !formData.name || !formData.expiryDate}
                className="flex-1 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-2xl hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105"
              >
                {formLoading ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Adding Medicine...</span>
                  </div>
                ) : (
                  "💾 Add Medicine"
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-8 py-4 bg-gray-500 text-white font-bold rounded-2xl hover:bg-gray-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Medicine List */}
      {loading ? (
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl p-16 text-center border border-white/20">
          <div className="w-20 h-20 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-xl text-gray-600 font-semibold">Loading medicines...</p>
        </div>
      ) : filteredMedicines.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl p-16 text-center border border-white/20">
          <div className="text-8xl mb-6">💊</div>
          <h3 className="text-3xl font-bold text-gray-900 mb-4">No Medicines Found</h3>
          <p className="text-lg text-gray-600 mb-8 font-medium">Start by scanning medicines or adding them manually!</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={loadSampleData}
              disabled={formLoading}
              className="inline-block px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-2xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {formLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Loading Sample Data...</span>
                </div>
              ) : (
                "🎯 Load Sample Data (8 Medicines)"
              )}
            </button>
            <a
              href="/dashboard/scan"
              className="inline-block px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold rounded-2xl hover:from-emerald-700 hover:to-teal-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105"
            >
              📱 Scan Medicine
            </a>
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-block px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-2xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105"
            >
              ✏️ Add Manually
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredMedicines.map((medicine) => {
            const { status, color, text } = getExpiryStatus(medicine.expiryDate);
            return (
              <div
                key={medicine._id}
                className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105 border border-white/20 p-8"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="text-7xl group-hover:scale-110 transition-transform duration-300">💊</div>
                  <span
                    className={`px-4 py-2 rounded-2xl text-sm font-bold shadow-lg ${
                      color === "red"
                        ? "bg-red-100/80 backdrop-blur-sm text-red-800 border-2 border-red-300/50"
                        : color === "orange"
                        ? "bg-orange-100/80 backdrop-blur-sm text-orange-800 border-2 border-orange-300/50"
                        : "bg-green-100/80 backdrop-blur-sm text-green-800 border-2 border-green-300/50"
                    }`}
                  >
                    {text}
                  </span>
                </div>

                <h3 className="text-2xl font-bold text-gray-900 mb-4">{medicine.name}</h3>

                {medicine.company && (
                  <p className="text-base text-gray-600 mb-3 font-medium">
                    <span className="font-bold text-gray-900">Company:</span> {medicine.company}
                  </p>
                )}

                {medicine.dosage && (
                  <p className="text-base text-gray-600 mb-3 font-medium">
                    <span className="font-bold text-gray-900">Dosage:</span> {medicine.dosage}
                  </p>
                )}

                <p className="text-base text-gray-600 mb-3 font-medium">
                  <span className="font-bold text-gray-900">Expiry:</span> {new Date(medicine.expiryDate).toLocaleDateString()}
                </p>

                {medicine.purchaseDate && (
                  <p className="text-base text-gray-600 mb-6 font-medium">
                    <span className="font-bold text-gray-900">Purchased:</span> {new Date(medicine.purchaseDate).toLocaleDateString()}
                  </p>
                )}

                <button
                  onClick={() => deleteMedicine(medicine._id)}
                  className="w-full py-4 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-bold rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Delete
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
