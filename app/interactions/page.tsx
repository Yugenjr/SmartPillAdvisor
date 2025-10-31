"use client";
import { useState } from "react";
import Link from "next/link";

type Interaction = {
  Drug_A: string;
  Drug_B: string;
  Description?: string;
  Level?: string;
};

export default function InteractionsPage() {
  const [drugs, setDrugs] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Interaction[]>([]);

  const addDrug = () => {
    const v = input.trim();
    if (!v) return;
    setDrugs((d) => Array.from(new Set([...d, v])));
    setInput("");
  };

  const removeDrug = (drug: string) => {
    setDrugs((d) => d.filter(x => x !== drug));
  };

  const check = async () => {
    setLoading(true);
    setResults([]);
    try {
      const res = await fetch("/api/interactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ drugList: drugs.map((name) => ({ name })) }),
      });
      const data = await res.json();
      setResults(data.interactions || []);
    } finally {
      setLoading(false);
    }
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Drug Interaction Checker
            </h1>
            <p className="text-gray-600 mt-1">Check for potential interactions between medications</p>
          </div>
          <Link href="/" className="px-4 py-2 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow text-gray-700">
            ← Back to Home
          </Link>
        </div>

        {/* Input Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
          <div className="flex gap-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addDrug()}
              placeholder="Enter medicine name (e.g., Aspirin, Warfarin)"
              className="flex-1 rounded-lg border-2 border-gray-200 px-4 py-3 focus:border-purple-500 focus:outline-none transition-colors"
            />
            <button 
              onClick={addDrug} 
              className="px-6 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold hover:from-purple-700 hover:to-blue-700 transition-all shadow-md hover:shadow-lg"
            >
              Add
            </button>
          </div>

          {drugs.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {drugs.map((d) => (
                <span 
                  key={d} 
                  className="px-4 py-2 rounded-full bg-gradient-to-r from-purple-100 to-blue-100 border border-purple-300 text-purple-800 text-sm font-medium flex items-center gap-2"
                >
                  {d}
                  <button 
                    onClick={() => removeDrug(d)}
                    className="hover:bg-purple-200 rounded-full p-0.5 transition-colors"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          )}

          <button 
            onClick={check} 
            disabled={drugs.length < 2 || loading} 
            className="w-full px-6 py-4 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:from-emerald-700 hover:to-teal-700 transition-all shadow-md hover:shadow-lg"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Checking Interactions...</span>
              </div>
            ) : (
              <>Check Interactions {drugs.length >= 2 ? `(${drugs.length} drugs)` : ""}</>
            )}
          </button>

          {drugs.length < 2 && drugs.length > 0 && (
            <p className="text-sm text-gray-500 text-center">Add at least 2 medicines to check interactions</p>
          )}
        </div>

        {/* Results Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-purple-600 to-blue-600">
            <h2 className="text-xl font-semibold text-white">
              Interaction Results {results.length > 0 && `(${results.length})`}
            </h2>
          </div>
          
          <div className="p-6">
            {results.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">💊</div>
                <p className="text-gray-500 text-lg">No interactions found yet</p>
                <p className="text-gray-400 text-sm mt-2">Add medicines above and click "Check Interactions"</p>
              </div>
            ) : (
              <div className="space-y-4">
                {results.map((r, idx) => (
                  <div 
                    key={idx} 
                    className="border-2 rounded-xl p-5 hover:shadow-md transition-shadow bg-gradient-to-r from-gray-50 to-white"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-semibold text-purple-700">{r.Drug_A}</span>
                          <span className="text-gray-400">⚡</span>
                          <span className="font-semibold text-blue-700">{r.Drug_B}</span>
                        </div>
                        {r.Description && (
                          <p className="text-gray-600 text-sm">{r.Description}</p>
                        )}
                      </div>
                      <span className={`px-4 py-2 rounded-full text-sm font-semibold border-2 whitespace-nowrap ${getSeverityColor(r.Level || 'Unknown')}`}>
                        {r.Level || "Unknown"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-2xl p-6 border-2 border-purple-200">
          <h3 className="font-semibold text-purple-900 mb-2">ℹ️ About Severity Levels</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-red-100 text-red-800 border border-red-300 font-medium">Major</span>
              <span className="text-gray-700">Avoid combination</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 border border-yellow-300 font-medium">Moderate</span>
              <span className="text-gray-700">Use with caution</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-300 font-medium">Minor</span>
              <span className="text-gray-700">Usually safe</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
