"use client";
import { useState } from "react";
import Link from "next/link";

export default function ImportPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success?: boolean; message?: string; error?: string } | null>(null);
  const [files, setFiles] = useState<FileList | null>(null);
  const [uploadMode, setUploadMode] = useState(false);

  const handleImport = async (useSimple = false) => {
    setLoading(true);
    setResult(null);

    try {
      const endpoint = useSimple ? "/api/import-interactions-simple" : "/api/import-interactions";
      const response = await fetch(endpoint, {
        method: "POST",
      });

      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Import Drug Interactions
            </h1>
            <Link 
              href="/"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              ← Back to Dashboard
            </Link>
          </div>
          
          <p className="text-gray-600 mb-6">
            Import ~50,000 drug interactions from CSV files to Firestore
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">📋 Prerequisites:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>✅ Firebase service account configured in .env.local</li>
              <li>✅ Firestore database enabled</li>
              <li>✅ Security rules published</li>
              <li>✅ CSV files available in Drug-Interaction folder</li>
            </ul>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-yellow-900 mb-2">⚠️ Important:</h3>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• This will take 2-3 minutes to complete</li>
              <li>• Do not close this page during import</li>
              <li>• Run this only once to avoid duplicates</li>
            </ul>
          </div>

          {/* Toggle between auto and manual mode */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setUploadMode(false)}
              className={`flex-1 py-2 rounded-lg font-semibold transition-all ${
                !uploadMode
                  ? "bg-purple-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Auto Import (from ddinterpy folder)
            </button>
            <button
              onClick={() => setUploadMode(true)}
              className={`flex-1 py-2 rounded-lg font-semibold transition-all ${
                uploadMode
                  ? "bg-purple-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Manual Upload
            </button>
          </div>

          {!uploadMode ? (
            /* Auto Import Mode */
            <div className="space-y-3">
              <button
                onClick={() => handleImport(false)}
                disabled={loading}
                className={`w-full py-4 rounded-lg font-semibold text-white transition-all shadow-lg ${
                  loading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                }`}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Importing... Please wait</span>
                  </div>
                ) : (
                  "Start Import (Batch Mode - Faster)"
                )}
              </button>

              <button
                onClick={() => handleImport(true)}
                disabled={loading}
                className={`w-full py-3 rounded-lg font-semibold transition-all ${
                  loading
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-white text-purple-600 border-2 border-purple-600 hover:bg-purple-50"
                }`}
              >
                Alternative: Simple Import (Slower but Reliable)
              </button>
            </div>
          ) : (
            /* Manual Upload Mode */
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  multiple
                  accept=".csv"
                  onChange={(e) => setFiles(e.target.files)}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer inline-block"
                >
                  <div className="text-gray-600 mb-2">
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span className="text-purple-600 font-semibold hover:text-purple-700">
                    Click to select CSV files
                  </span>
                  <p className="text-xs text-gray-500 mt-1">Select all 8 CSV files from ddinterpy folder</p>
                </label>
              </div>

              {files && files.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Selected Files ({files.length}):</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    {Array.from(files).map((file, idx) => (
                      <li key={idx}>• {file.name}</li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                onClick={async () => {
                  if (!files || files.length === 0) {
                    alert("Please select CSV files first!");
                    return;
                  }
                  setLoading(true);
                  setResult(null);
                  try {
                    const formData = new FormData();
                    for (let i = 0; i < files.length; i++) {
                      formData.append("files", files[i]);
                    }
                    const response = await fetch("/api/upload-interactions", {
                      method: "POST",
                      body: formData,
                    });
                    const data = await response.json();
                    setResult(data);
                  } catch (error: any) {
                    setResult({ error: error.message });
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading || !files || files.length === 0}
                className={`w-full py-4 rounded-lg font-semibold text-white transition-all shadow-lg ${
                  loading || !files || files.length === 0
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                }`}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Uploading and Importing...</span>
                  </div>
                ) : (
                  "Upload and Import CSV Files"
                )}
              </button>
            </div>
          )}

          {result && (
            <div
              className={`mt-6 p-4 rounded-lg ${
                result.success
                  ? "bg-green-50 border border-green-200"
                  : "bg-red-50 border border-red-200"
              }`}
            >
              <h3
                className={`font-semibold mb-2 ${
                  result.success ? "text-green-900" : "text-red-900"
                }`}
              >
                {result.success ? "✅ Success!" : "❌ Error"}
              </h3>
              <p
                className={`text-sm ${
                  result.success ? "text-green-800" : "text-red-800"
                }`}
              >
                {result.message || result.error}
              </p>

              {result.success && (
                <div className="mt-4 space-y-2">
                  <Link
                    href="/interactions"
                    className="block w-full text-center py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Test Drug Interactions →
                  </Link>
                  <a
                    href="https://console.firebase.google.com/project/smartpilladvisor/firestore"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-center py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    View in Firestore Console →
                  </a>
                </div>
              )}
            </div>
          )}

          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">📊 What gets imported:</h3>
            <div className="text-sm text-gray-700 space-y-1">
              <p>• <strong>Collection:</strong> interactions</p>
              <p>• <strong>Fields:</strong> Drug_A, Drug_B, Level, DDInterID_A, DDInterID_B</p>
              <p>• <strong>Severity Levels:</strong> Major, Moderate, Minor</p>
              <p>• <strong>Total Records:</strong> ~50,000 interactions</p>
            </div>
          </div>

          <div className="mt-6 text-center text-sm text-gray-500">
            <p>After import, you can check interactions at:</p>
            <Link href="/interactions" className="text-purple-600 hover:underline">
              /interactions
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
