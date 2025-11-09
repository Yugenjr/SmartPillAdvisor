"use client";
import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

type Interaction = {
  Drug_A: string;
  Drug_B: string;
  Description?: string;
  Level?: string;
  DDInterID_A?: string;
  DDInterID_B?: string;
};

export default function InteractionsPage() {
  const [drugs, setDrugs] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Interaction[]>([]);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [drugsNotFound, setDrugsNotFound] = useState(false);

  const addDrug = () => {
    const v = input.trim();
    if (!v) return;
    setDrugs((d) => Array.from(new Set([...d, v])));
    setInput("");
    setDrugsNotFound(false);
  };

  const removeDrug = (drug: string) => {
    setDrugs((d) => d.filter(x => x !== drug));
    setDrugsNotFound(false);
  };

  const check = async () => {
    setLoading(true);
    setResults([]);
    setDebugInfo(null);
    setDrugsNotFound(false);
    try {
      const res = await fetch("/api/interactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ drugList: drugs.map((name) => ({ name })) }),
      });
      const data = await res.json();
      setResults(data.interactions || []);
      setDebugInfo(data.debug);
      setDrugsNotFound(data.drugsFound === false);
      console.log("API Response:", data);
    } finally {
      setLoading(false);
    }
  };

  const seedDatabase = async () => {
    alert("Database seeding not needed - you already have 222k interactions uploaded!");
  };

  const getSeverityColor = (level: string) => {
    switch(level?.toLowerCase()) {
      case 'major': return 'bg-red-500/20 border-red-400/40 text-red-300 shadow-red-500/25';
      case 'moderate': return 'bg-orange-500/20 border-orange-400/40 text-orange-300 shadow-orange-500/25';
      case 'minor': return 'bg-green-500/20 border-green-400/40 text-green-300 shadow-green-500/25';
      default: return 'bg-slate-500/20 border-slate-400/40 text-slate-300 shadow-slate-500/25';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full"
    >
      {/* Main Interactions Card */}
      <div className="bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-cyan-500/20 shadow-2xl shadow-cyan-500/10 overflow-hidden">
        <div className="p-8 lg:p-12">
          {/* Floating Header */}
          <div className="text-center mb-12">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <h1 className="text-4xl lg:text-6xl font-bold mb-4 bg-gradient-to-r from-cyan-400 via-pink-400 to-purple-400 bg-clip-text text-transparent drop-shadow-lg">
                💊 Drug Interactions
              </h1>
              <p className="text-lg lg:text-xl text-slate-300 font-medium">
                Check for potential interactions between medications
              </p>
            </motion.div>
          </div>

          {/* Input Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="bg-slate-800/60 backdrop-blur-xl rounded-2xl p-8 border border-cyan-500/20 shadow-lg shadow-cyan-500/10 mb-8"
          >
            <div className="flex flex-col lg:flex-row gap-4 mb-6">
              <div className="flex-1">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addDrug()}
                  placeholder="Enter medicine name (e.g., Abacavir, Aspirin, Warfarin)"
                  className="w-full px-6 py-4 border-2 border-cyan-500/30 rounded-2xl focus:outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/20 transition-all duration-300 bg-slate-700/60 backdrop-blur-sm shadow-lg text-slate-200 placeholder-slate-400 text-base"
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={addDrug}
                className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-2xl hover:from-cyan-600 hover:to-blue-700 transition-all duration-300 shadow-xl hover:shadow-2xl border border-cyan-400/20"
              >
                ➕ Add Drug
              </motion.button>
            </div>

            {/* Added Drugs */}
            {drugs.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-wrap gap-3 mb-6"
              >
                {drugs.map((drug, idx) => (
                  <motion.span
                    key={drug}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: idx * 0.1, type: "spring", stiffness: 200 }}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-600/20 border border-cyan-400/30 text-cyan-300 text-sm font-bold flex items-center gap-2 shadow-lg shadow-cyan-500/10"
                  >
                    {drug}
                    <motion.button
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.8 }}
                      onClick={() => removeDrug(drug)}
                      className="hover:bg-cyan-500/30 rounded-lg p-1 transition-colors"
                    >
                      ✕
                    </motion.button>
                  </motion.span>
                ))}
              </motion.div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col lg:flex-row gap-4 mb-6">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={check}
                disabled={drugs.length < 2 || loading}
                className="flex-1 px-8 py-5 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed hover:from-pink-600 hover:to-purple-700 transition-all duration-300 shadow-xl hover:shadow-2xl border border-pink-400/20 text-lg"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Checking Interactions...</span>
                  </div>
                ) : (
                  <>⚡ Check Interactions {drugs.length >= 2 ? `(${drugs.length} drugs)` : ""}</>
                )}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={seedDatabase}
                disabled={loading}
                className="px-8 py-5 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-xl hover:shadow-2xl border border-green-400/20"
                title="Your database already has 222k interactions uploaded"
              >
                ✅ DB Ready
              </motion.button>
            </div>

            {drugs.length < 2 && drugs.length > 0 && (
              <p className="text-base text-slate-400 text-center font-medium">Add at least 2 medicines to check interactions</p>
            )}

            {/* Quick Test Drugs */}
            {drugs.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="border-t border-cyan-500/20 pt-6"
              >
                <p className="text-base text-slate-300 mb-4 text-center font-semibold">Quick test with common drugs:</p>
                <div className="flex flex-wrap gap-3 justify-center">
                  {["Abacavir", "Aspirin", "Warfarin", "Ibuprofen", "Paracetamol"].map((drug, idx) => (
                    <motion.button
                      key={drug}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7 + idx * 0.1, duration: 0.5 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setDrugs([drug]);
                        setInput("");
                      }}
                      className="px-6 py-3 bg-slate-700/60 backdrop-blur-xl border-2 border-cyan-500/20 rounded-2xl text-sm text-cyan-300 hover:bg-slate-600/60 hover:border-cyan-400/40 transition-all duration-300 shadow-lg hover:shadow-xl font-semibold"
                    >
                      {drug}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Results Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="bg-slate-800/60 backdrop-blur-xl rounded-2xl p-8 border border-pink-500/20 shadow-lg shadow-pink-500/10"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="text-3xl">🔍</div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                Interaction Results {results.length > 0 && `(${results.length})`}
              </h2>
            </div>

            {results.length === 0 ? (
              <div className="text-center py-16">
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 1.0, duration: 0.5 }}
                  className="text-8xl mb-6"
                >
                  💊
                </motion.div>
                {drugsNotFound ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.1, duration: 0.5 }}
                  >
                    <p className="text-xl text-slate-300 font-semibold mb-4">No interactions found yet</p>
                    <div className="p-6 bg-orange-500/10 backdrop-blur-xl rounded-2xl border-2 border-orange-400/20">
                      <p className="text-lg text-orange-300 font-bold mb-2">⚠️ Drug Not Found in Database</p>
                      <p className="text-base text-orange-200">
                        Make sure that the drug you have entered is human consumable and often medically prescribed.
                      </p>
                      <p className="text-sm text-orange-300 mt-2">
                        Common prescription medications include Aspirin, Ibuprofen, Paracetamol, Warfarin, etc.
                      </p>
                    </div>
                  </motion.div>
                ) : drugs.length >= 2 && debugInfo && debugInfo.found === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.1, duration: 0.5 }}
                  >
                    <p className="text-xl text-green-300 font-semibold mb-4">✅ Safe Combination</p>
                    <div className="p-6 bg-green-500/10 backdrop-blur-xl rounded-2xl border-2 border-green-400/20">
                      <p className="text-lg text-green-300 font-bold mb-2">🟢 Uninteractive Medicines</p>
                      <p className="text-base text-green-200">
                        These medicines do not interact with each other. However, always consult a doctor before combining medications.
                      </p>
                      <p className="text-sm text-green-300 mt-2 font-medium">
                        Individual medicine effects should still be monitored by a healthcare professional.
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.1, duration: 0.5 }}
                  >
                    <p className="text-xl text-slate-400 font-semibold">No interactions found yet</p>
                    <p className="text-base text-slate-500 mt-2 font-medium">Add medicines above and click "Check Interactions"</p>
                  </motion.div>
                )}

                {debugInfo && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.3, duration: 0.5 }}
                    className="mt-6 p-6 bg-slate-700/60 backdrop-blur-xl rounded-2xl text-left border border-slate-600/20"
                  >
                    <p className="text-base font-bold text-slate-200">Debug Info:</p>
                    <p className="text-sm text-slate-400">Total in DB: {debugInfo.totalInDB}</p>
                    <p className="text-sm text-slate-400">Drugs searched: {debugInfo.drugsSearched?.join(', ')}</p>
                    <p className="text-sm text-slate-400">Found: {debugInfo.found}</p>
                    {debugInfo.unique && <p className="text-sm text-slate-400">Unique: {debugInfo.unique}</p>}
                    {debugInfo.message && <p className="text-sm text-red-300 mt-3 font-medium">{debugInfo.message}</p>}
                  </motion.div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {results.map((r, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.0 + idx * 0.1, duration: 0.5 }}
                    whileHover={{ scale: 1.02 }}
                    className="border-2 rounded-3xl p-8 transition-all duration-300 bg-slate-700/40 backdrop-blur-xl border-slate-600/20 hover:border-cyan-500/30"
                  >
                    <div className="flex items-start justify-between gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-4">
                          <span className="font-bold text-cyan-300 text-xl">{r.Drug_A}</span>
                          <span className="text-cyan-400 text-2xl">⚡</span>
                          <span className="font-bold text-pink-300 text-xl">{r.Drug_B}</span>
                        </div>
                        {(r.Description || r.DDInterID_A) && (
                          <div className="text-slate-300 text-base space-y-2">
                            {r.Description && <p className="font-medium">{r.Description}</p>}
                            <div className="flex gap-4">
                              {r.DDInterID_A && <span className="bg-cyan-500/20 backdrop-blur-sm px-3 py-2 rounded-xl border border-cyan-400/30 text-sm font-semibold text-cyan-300">ID: {r.DDInterID_A}</span>}
                              {r.DDInterID_B && <span className="bg-pink-500/20 backdrop-blur-sm px-3 py-2 rounded-xl border border-pink-400/30 text-sm font-semibold text-pink-300">ID: {r.DDInterID_B}</span>}
                            </div>
                          </div>
                        )}
                      </div>
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 1.2 + idx * 0.1, type: "spring", stiffness: 200 }}
                        className={`px-6 py-3 rounded-2xl text-base font-bold border-2 whitespace-nowrap shadow-lg ${getSeverityColor(r.Level || 'Unknown')}`}
                      >
                        {r.Level || "Unknown"}
                      </motion.span>
                    </div>
                  </motion.div>
                ))}

                {debugInfo && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5, duration: 0.5 }}
                    className="mt-8 p-6 bg-slate-700/60 backdrop-blur-xl rounded-2xl border border-slate-600/20"
                  >
                    <p className="text-base font-bold text-slate-200">Debug Info:</p>
                    <p className="text-sm text-slate-400">Total in DB: {debugInfo.totalInDB}</p>
                    <p className="text-sm text-slate-400">Drugs searched: {debugInfo.drugsSearched?.join(', ')}</p>
                    <p className="text-sm text-slate-400">Found: {debugInfo.found}</p>
                    {debugInfo.unique && <p className="text-sm text-slate-400">Unique: {debugInfo.unique}</p>}
                  </motion.div>
                )}
              </div>
            )}
          </motion.div>

          {/* Severity Legend */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0, duration: 0.6 }}
            className="mt-8 bg-slate-800/60 backdrop-blur-xl rounded-2xl p-8 border border-cyan-500/20 shadow-lg shadow-cyan-500/10"
          >
            <h3 className="font-bold text-cyan-300 mb-6 text-xl flex items-center gap-3">
              <span className="text-2xl">ℹ️</span>
              About Severity Levels
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-4 p-4 bg-red-500/10 backdrop-blur-xl rounded-2xl border border-red-400/20"
              >
                <span className="px-4 py-2 rounded-xl bg-red-500/20 border border-red-400/30 text-red-300 font-bold shadow-lg shadow-red-500/10">Major</span>
                <span className="text-slate-300 font-semibold">Avoid combination</span>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-4 p-4 bg-orange-500/10 backdrop-blur-xl rounded-2xl border border-orange-400/20"
              >
                <span className="px-4 py-2 rounded-xl bg-orange-500/20 border border-orange-400/30 text-orange-300 font-bold shadow-lg shadow-orange-500/10">Moderate</span>
                <span className="text-slate-300 font-semibold">Use with caution</span>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-4 p-4 bg-green-500/10 backdrop-blur-xl rounded-2xl border border-green-400/20"
              >
                <span className="px-4 py-2 rounded-xl bg-green-500/20 border border-green-400/30 text-green-300 font-bold shadow-lg shadow-green-500/10">Minor</span>
                <span className="text-slate-300 font-semibold">Usually safe</span>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
} 