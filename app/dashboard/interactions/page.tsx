"use client";
import { useState } from "react";
import Link from "next/link";

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
    setDrugsNotFound(false); // Reset warning when adding new drugs
  };

  const removeDrug = (drug: string) => {
    setDrugs((d) => d.filter(x => x !== drug));
    setDrugsNotFound(false); // Reset warning when removing drugs
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
      case 'major': return 'bg-red-100 text-red-800 border-red-300';
      case 'moderate': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'minor': return 'bg-blue-100 text-blue-800 border-blue-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 overflow-y-auto">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 rounded-3xl p-10 text-white shadow-2xl">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute -top-4 -right-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-white/5 rounded-full blur-xl"></div>
        <div className="relative z-10">
          <h1 className="text-4xl font-bold mb-3">💊 Drug Interaction Checker</h1>
          <p className="text-xl text-blue-100 font-medium">Check for potential interactions between medications</p>
        </div>
      </div>

        {/* Input Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl p-8 border border-white/20 space-y-6">
          <div className="flex gap-4">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addDrug()}
              placeholder="Enter medicine name (e.g., Abacavir, Aspirin, Warfarin)"
              className="flex-1 rounded-2xl border-2 border-gray-200/50 px-6 py-4 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 bg-white/50 backdrop-blur-sm shadow-lg text-base font-medium"
            />
            <button 
              onClick={addDrug} 
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105"
            >
              Add
            </button>
          </div>

          {drugs.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {drugs.map((d) => (
                <span 
                  key={d} 
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-100 to-purple-100 border-2 border-white/50 text-blue-800 text-sm font-bold flex items-center gap-3 shadow-lg backdrop-blur-sm"
                >
                  {d}
                  <button 
                    onClick={() => removeDrug(d)}
                    className="hover:bg-blue-200 rounded-xl p-1 transition-colors"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="flex gap-4">
            <button 
              onClick={check} 
              disabled={drugs.length < 2 || loading} 
              className="flex-1 px-8 py-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:from-emerald-700 hover:to-teal-700 transition-all duration-300 shadow-lg text-lg"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Checking Interactions...</span>
                </div>
              ) : (
                <>Check Interactions {drugs.length >= 2 ? `(${drugs.length} drugs)` : ""}</>
              )}
            </button>

            <button 
              onClick={seedDatabase}
              disabled={loading}
              className="px-8 py-5 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:from-green-700 hover:to-emerald-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105"
              title="Your database already has 222k interactions uploaded"
            >
              ✅ DB Ready
            </button>
          </div>

          {drugs.length < 2 && drugs.length > 0 && (
            <p className="text-base text-gray-500 text-center font-medium">Add at least 2 medicines to check interactions</p>
          )}

          {/* Quick Test Drugs */}
          {drugs.length === 0 && (
            <div className="border-t-2 border-gray-100/50 pt-6">
              <p className="text-base text-gray-600 mb-4 text-center font-semibold">Quick test with common drugs:</p>
              <div className="flex flex-wrap gap-3 justify-center">
                {["Abacavir", "Aspirin", "Warfarin", "Ibuprofen", "Paracetamol"].map((drug) => (
                  <button
                    key={drug}
                    onClick={() => {
                      setDrugs([drug]);
                      setInput("");
                    }}
                    className="px-6 py-3 bg-white/60 backdrop-blur-sm border-2 border-white/50 rounded-2xl text-sm text-blue-700 hover:bg-blue-50/80 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
                  >
                    {drug}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

      {/* Results Card */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl overflow-hidden border border-white/20">
          <div className="px-8 py-6 bg-gradient-to-r from-blue-600 to-purple-600">
            <h2 className="text-2xl font-bold text-white">
              Interaction Results {results.length > 0 && `(${results.length})`}
            </h2>
          </div>
          
          <div className="p-8">
            {results.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-8xl mb-6">💊</div>
                {drugsNotFound ? (
                  <>
                    <p className="text-xl text-gray-500 font-semibold">No interactions found yet</p>
                    <div className="mt-4 p-6 bg-amber-50/80 backdrop-blur-sm rounded-2xl border-2 border-amber-200/50">
                      <p className="text-lg text-amber-800 font-bold mb-2">⚠️ Drug Not Found in Database</p>
                      <p className="text-base text-amber-700">
                        Make sure that the drug you have entered is human consumable and often medically prescribed.
                      </p>
                      <p className="text-sm text-amber-600 mt-2">
                        Common prescription medications include Aspirin, Ibuprofen, Paracetamol, Warfarin, etc.
                      </p>
                    </div>
                  </>
                ) : drugs.length >= 2 && debugInfo && debugInfo.found === 0 ? (
                  <>
                    <p className="text-xl text-green-600 font-semibold">✅ Safe Combination</p>
                    <div className="mt-4 p-6 bg-green-50/80 backdrop-blur-sm rounded-2xl border-2 border-green-200/50">
                      <p className="text-lg text-green-800 font-bold mb-2">🟢 Uninteractive Medicines</p>
                      <p className="text-base text-green-700">
                        These medicines do not interact with each other. However, always consult a doctor before combining medications.
                      </p>
                      <p className="text-sm text-green-600 mt-2 font-medium">
                        Individual medicine effects should still be monitored by a healthcare professional.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-xl text-gray-500 font-semibold">No interactions found yet</p>
                    <p className="text-base text-gray-400 mt-2 font-medium">Add medicines above and click "Check Interactions"</p>
                  </>
                )}
                {debugInfo && (
                  <div className="mt-6 p-6 bg-gray-100/80 backdrop-blur-sm rounded-2xl text-left border border-white/50">
                    <p className="text-base font-bold text-gray-700">Debug Info:</p>
                    <p className="text-sm text-gray-600">Total in DB: {debugInfo.totalInDB}</p>
                    <p className="text-sm text-gray-600">Drugs searched: {debugInfo.drugsSearched?.join(', ')}</p>
                    <p className="text-sm text-gray-600">Found: {debugInfo.found}</p>
                    {debugInfo.unique && <p className="text-sm text-gray-600">Unique: {debugInfo.unique}</p>}
                    {debugInfo.message && <p className="text-sm text-red-600 mt-3 font-medium">{debugInfo.message}</p>}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {results.map((r, idx) => (
                  <div 
                    key={idx} 
                    className="border-2 rounded-3xl p-8 hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-gray-50/80 to-white/80 backdrop-blur-sm border-white/20"
                  >
                    <div className="flex items-start justify-between gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-4">
                          <span className="font-bold text-purple-700 text-xl">{r.Drug_A}</span>
                          <span className="text-gray-400 text-2xl">⚡</span>
                          <span className="font-bold text-blue-700 text-xl">{r.Drug_B}</span>
                        </div>
                        {(r.Description || r.DDInterID_A) && (
                          <div className="text-gray-600 text-base space-y-2">
                            {r.Description && <p className="font-medium">{r.Description}</p>}
                            <div className="flex gap-4">
                              {r.DDInterID_A && <span className="bg-purple-50/80 backdrop-blur-sm px-3 py-2 rounded-xl border border-purple-200/50 text-sm font-semibold">ID: {r.DDInterID_A}</span>}
                              {r.DDInterID_B && <span className="bg-blue-50/80 backdrop-blur-sm px-3 py-2 rounded-xl border border-blue-200/50 text-sm font-semibold">ID: {r.DDInterID_B}</span>}
                            </div>
                          </div>
                        )}
                      </div>
                      <span className={`px-6 py-3 rounded-2xl text-base font-bold border-2 whitespace-nowrap shadow-lg ${getSeverityColor(r.Level || 'Unknown')}`}>
                        {r.Level || "Unknown"}
                      </span>
                    </div>
                  </div>
                ))}

                {debugInfo && (
                  <div className="mt-8 p-6 bg-blue-50/80 backdrop-blur-sm rounded-2xl border border-blue-200/50">
                    <p className="text-base font-bold text-blue-700">Debug Info:</p>
                    <p className="text-sm text-blue-600">Total in DB: {debugInfo.totalInDB}</p>
                    <p className="text-sm text-blue-600">Drugs searched: {debugInfo.drugsSearched?.join(', ')}</p>
                    <p className="text-sm text-blue-600">Found: {debugInfo.found}</p>
                    {debugInfo.unique && <p className="text-sm text-blue-600">Unique: {debugInfo.unique}</p>}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      {/* Info Card */}
      <div className="bg-gradient-to-r from-blue-50/80 to-purple-50/80 backdrop-blur-xl rounded-3xl p-8 border-2 border-white/50 shadow-xl">
          <h3 className="font-bold text-blue-900 mb-4 text-xl">ℹ️ About Severity Levels</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-base">
            <div className="flex items-center gap-4">
              <span className="px-4 py-2 rounded-2xl bg-red-100/80 backdrop-blur-sm text-red-800 border-2 border-red-300/50 font-bold shadow-lg">Major</span>
              <span className="text-gray-700 font-semibold">Avoid combination</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="px-4 py-2 rounded-2xl bg-orange-100/80 backdrop-blur-sm text-orange-800 border-2 border-orange-300/50 font-bold shadow-lg">Moderate</span>
              <span className="text-gray-700 font-semibold">Use with caution</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="px-4 py-2 rounded-2xl bg-green-100/80 backdrop-blur-sm text-green-800 border-2 border-green-300/50 font-bold shadow-lg">Minor</span>
              <span className="text-gray-700 font-semibold">Usually safe</span>
            </div>
          </div>
        </div>
    </div>
  );
} 