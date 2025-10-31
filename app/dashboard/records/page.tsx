"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Medicine {
  id: string;
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

  useEffect(() => {
    if (user) {
      fetchMedicines();
    }
  }, [user]);

  const fetchMedicines = async () => {
    if (!user) return;

    try {
      const medicinesQuery = query(
        collection(db, 'medicines'),
        where('userId', '==', user.uid)
      );
      const snapshot = await getDocs(medicinesQuery);
      const medicinesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Medicine[];
      
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
      await deleteDoc(doc(db, 'medicines', id));
      setMedicines(medicines.filter(m => m.id !== id));
    } catch (error) {
      console.error("Failed to delete medicine:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-8 text-white shadow-xl">
        <h1 className="text-3xl font-bold mb-2">📋 Track Medicine Records</h1>
        <p className="text-purple-100">Monitor all your medications and expiry dates</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setFilter("all")}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              filter === "all"
                ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            All Medicines ({medicines.length})
          </button>
          <button
            onClick={() => setFilter("expiring")}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              filter === "expiring"
                ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Expiring Soon ({medicines.filter(m => getExpiryStatus(m.expiryDate).status === "expiring").length})
          </button>
          <button
            onClick={() => setFilter("expired")}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              filter === "expired"
                ? "bg-gradient-to-r from-red-600 to-pink-600 text-white shadow-lg"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Expired ({medicines.filter(m => getExpiryStatus(m.expiryDate).status === "expired").length})
          </button>
        </div>
      </div>

      {/* Medicine List */}
      {loading ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading medicines...</p>
        </div>
      ) : filteredMedicines.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <div className="text-6xl mb-4">💊</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Medicines Found</h3>
          <p className="text-gray-600 mb-6">Start by scanning your first medicine!</p>
          <a
            href="/dashboard/scan"
            className="inline-block px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg"
          >
            Scan Medicine
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMedicines.map((medicine) => {
            const { status, color, text } = getExpiryStatus(medicine.expiryDate);
            return (
              <div
                key={medicine.id}
                className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all p-6 border-2 border-gray-100"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="text-4xl">💊</div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      color === "red"
                        ? "bg-red-100 text-red-800 border-2 border-red-300"
                        : color === "orange"
                        ? "bg-orange-100 text-orange-800 border-2 border-orange-300"
                        : "bg-green-100 text-green-800 border-2 border-green-300"
                    }`}
                  >
                    {text}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-2">{medicine.name}</h3>
                
                {medicine.company && (
                  <p className="text-sm text-gray-600 mb-1">
                    <span className="font-semibold">Company:</span> {medicine.company}
                  </p>
                )}
                
                {medicine.dosage && (
                  <p className="text-sm text-gray-600 mb-1">
                    <span className="font-semibold">Dosage:</span> {medicine.dosage}
                  </p>
                )}

                <p className="text-sm text-gray-600 mb-1">
                  <span className="font-semibold">Expiry:</span> {new Date(medicine.expiryDate).toLocaleDateString()}
                </p>

                {medicine.purchaseDate && (
                  <p className="text-sm text-gray-600 mb-4">
                    <span className="font-semibold">Purchased:</span> {new Date(medicine.purchaseDate).toLocaleDateString()}
                  </p>
                )}

                <button
                  onClick={() => deleteMedicine(medicine.id)}
                  className="w-full py-2 bg-red-50 hover:bg-red-100 text-red-600 font-semibold rounded-lg transition-all"
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
