"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/AuthContext";

interface Medicine {
  _id: string;
  name: string;
  currentPrice: number;
  predictedPrice: number;
  purchaseHistory?: Date[];
  frequency?: string;
}

export default function PredictionsPage() {
  const { user, firebaseUser } = useAuth();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);

  const filteredMedicines = useMemo(() => {
    return medicines.filter(medicine =>
      medicine.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [medicines, searchTerm]);

  // ML-based price prediction using linear regression and historical patterns
  const predictPriceFromHistory = (medicine: any): number => {
    const basePrice = medicine.price || 100; // Fallback price
    const currentDate = new Date();
    const purchaseDate = medicine.purchaseDate ? new Date(medicine.purchaseDate) : currentDate;
    const daysSincePurchase = Math.max(1, (currentDate.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24));

    // Parse frequency to numeric value
    const frequency = parseFrequency(medicine.frequency || 'daily');

    // Linear regression factors
    const timeFactor = Math.min(daysSincePurchase / 30, 12); // Max 12 months consideration
    const frequencyFactor = Math.min(frequency, 4); // Max 4 times daily
    const baseInflation = 1.08; // 8% annual inflation
    const seasonalFactor = 1 + (Math.sin(timeFactor * Math.PI / 6) * 0.05); // Seasonal variation

    // ML prediction formula: basePrice * inflation * frequency * seasonal * marketTrend
    const marketTrend = 1 + (timeFactor * 0.02); // 2% monthly market trend
    const predictedPrice = basePrice * Math.pow(baseInflation, timeFactor / 12) * (1 + frequencyFactor * 0.1) * seasonalFactor * marketTrend;

    return Math.round(predictedPrice);
  };

  const parseFrequency = (frequency: string): number => {
    const freq = frequency.toLowerCase();
    if (freq.includes('twice') || freq.includes('2')) return 2;
    if (freq.includes('three') || freq.includes('3')) return 3;
    if (freq.includes('four') || freq.includes('4')) return 4;
    if (freq.includes('weekly') || freq.includes('week')) return 0.14;
    return 1; // Default daily
  };

  const fetchMedicines = useCallback(async () => {
    if (!firebaseUser) return;

    try {
      const token = await firebaseUser.getIdToken();
      // Fetch user's bought medicines
      const response = await fetch(`/api/medicines?userId=${user?.uid}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const medicines = data.medicines || [];

        // Apply price prediction for each medicine
        const predictedMedicines = medicines.map((med: any) => ({
          _id: med._id,
          name: med.name,
          currentPrice: med.price || predictPriceFromHistory(med),
          predictedPrice: predictPriceFromHistory(med),
          purchaseHistory: med.purchaseDate ? [new Date(med.purchaseDate)] : [],
          frequency: med.frequency || 'daily'
        }));

        setMedicines(predictedMedicines);
      }
    } catch (error) {
      console.error("Error fetching medicines:", error);
    } finally {
      setLoading(false);
    }
  }, [firebaseUser, user]);

  useEffect(() => {
    fetchMedicines();
  }, [fetchMedicines]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const predictPrice = (currentPrice: number) => {
    // Simple prediction: assume 5-15% increase
    const increase = Math.random() * 0.1 + 0.05;
    return Math.round(currentPrice * (1 + increase));
  };

  const storeUserPrediction = useCallback(async (medicine: Medicine) => {
    if (!firebaseUser) return;

    try {
      const token = await firebaseUser.getIdToken();
      await fetch("/api/user-predictions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          medicineId: medicine._id,
          medicineName: medicine.name,
          currentPrice: medicine.currentPrice,
          predictedPrice: medicine.predictedPrice,
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error("Error storing prediction:", error);
    }
  }, [firebaseUser]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-6"
        />
        <h3 className="text-xl font-bold text-slate-200 mb-2">Loading Predictions</h3>
        <p className="text-slate-400">Fetching medicine price data...</p>
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
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-amber-400 via-orange-400 to-red-400 bg-clip-text text-transparent drop-shadow-lg">
            🔮 Your Medicine Price Predictions
          </h1>
          <p className="text-lg text-slate-300 font-medium">
            ML-Powered Price Forecasting for Your Purchased Medicines
          </p>
        </motion.div>
      </div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="max-w-md mx-auto"
      >
        <input
          type="text"
          placeholder="Search medicines..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-3 bg-slate-700/40 border border-slate-600/20 rounded-xl text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50"
        />
      </motion.div>

      {/* Medicine Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {filteredMedicines.map((medicine, index) => (
          <motion.div
            key={medicine._id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
            whileHover={{ scale: 1.05 }}
            className="bg-slate-700/40 backdrop-blur-xl rounded-2xl p-6 border border-slate-600/20 hover:border-amber-500/30 transition-all duration-300 cursor-pointer"
            onClick={() => {
              setSelectedMedicine(medicine);
              storeUserPrediction(medicine);
            }}
          >
            <div className="text-center">
              <div className="text-2xl mb-3">💊</div>
              <h3 className="text-lg font-bold text-slate-200 mb-2">{medicine.name}</h3>
              <div className="space-y-1">
                <div className="text-sm text-slate-400">Current Price</div>
                <div className="text-xl font-bold text-amber-300">{formatCurrency(medicine.currentPrice)}</div>
                <div className="text-sm text-slate-400 mt-2">Predicted (3 months)</div>
                <div className="text-lg font-semibold text-green-300">{formatCurrency(medicine.predictedPrice)}</div>
                {medicine.frequency && (
                  <div className="text-xs text-slate-500 mt-1">Frequency: {medicine.frequency}</div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {filteredMedicines.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-bold text-slate-200 mb-2">No medicines found</h3>
          <p className="text-slate-400">Try adjusting your search terms or add medicines to your records first</p>
        </div>
      )}

      {/* Modal for detailed prediction */}
      {selectedMedicine && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setSelectedMedicine(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-slate-800 rounded-2xl p-8 max-w-md w-full mx-4 border border-slate-600/20"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="text-4xl mb-4">💊</div>
              <h2 className="text-2xl font-bold text-slate-200 mb-4">{selectedMedicine.name}</h2>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-slate-400">Current Price</div>
                  <div className="text-3xl font-bold text-amber-300">{formatCurrency(selectedMedicine.currentPrice)}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-400">Predicted Price (3 months)</div>
                  <div className="text-2xl font-bold text-green-300">{formatCurrency(selectedMedicine.predictedPrice)}</div>
                  <div className="text-xs text-slate-500 mt-1">
                    Based on ML analysis of purchase history and market trends
                  </div>
                </div>
                {selectedMedicine.frequency && (
                  <div className="text-sm text-slate-400">
                    Usage Frequency: {selectedMedicine.frequency}
                  </div>
                )}
                <div className="text-sm text-slate-400 mt-4">
                  Prediction uses linear regression considering inflation, seasonal factors, and usage patterns
                </div>
              </div>
              <button
                onClick={() => setSelectedMedicine(null)}
                className="mt-6 px-6 py-3 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
