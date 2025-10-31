"use client";
import { useState } from "react";
import Link from "next/link";

export default function SimpleImportPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<string[]>([]);
  const [totalImported, setTotalImported] = useState(0);

  const handleFileUpload = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setProgress(prev => [...prev, `Uploading ${selectedFile.name}...`]);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch("/api/upload-single-file", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      
      if (data.success) {
        setProgress(prev => [...prev, `✅ ${selectedFile.name}: ${data.count} records imported`]);
        setTotalImported(prev => prev + data.count);
      } else {
        setProgress(prev => [...prev, `❌ ${selectedFile.name}: ${data.error}`]);
      }
    } catch (error: any) {
      setProgress(prev => [...prev, `❌ Error: ${error.message}`]);
    } finally {
      setLoading(false);
      setSelectedFile(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Simple Import (One File at a Time)
            </h1>
            <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">
              ← Back
            </Link>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">📋 Instructions:</h3>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Select ONE CSV file</li>
              <li>Click "Upload This File"</li>
              <li>Wait for success message (~30 seconds per file)</li>
              <li>Repeat for all 8 files</li>
            </ol>
          </div>

          <div className="space-y-4">
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              disabled={loading}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
            />

            {selectedFile && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-700">
                  Selected: <strong>{selectedFile.name}</strong>
                </p>
              </div>
            )}

            <button
              onClick={handleFileUpload}
              disabled={loading || !selectedFile}
              className={`w-full py-3 rounded-lg font-semibold text-white transition-all ${
                loading || !selectedFile
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              }`}
            >
              {loading ? "Uploading..." : "Upload This File"}
            </button>
          </div>

          {progress.length > 0 && (
            <div className="mt-6 bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Progress:</h3>
              <div className="space-y-1 text-sm">
                {progress.map((msg, idx) => (
                  <div key={idx}>{msg}</div>
                ))}
              </div>
              {totalImported > 0 && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="font-semibold text-green-900">
                    Total Imported: {totalImported} records
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Files to upload (8 total):</strong>
            </p>
            <ul className="text-xs text-yellow-700 mt-2 space-y-1">
              <li>• ddinter_downloads_code_A.csv</li>
              <li>• ddinter_downloads_code_B.csv</li>
              <li>• ddinter_downloads_code_D.csv</li>
              <li>• ddinter_downloads_code_H.csv</li>
              <li>• ddinter_downloads_code_L.csv</li>
              <li>• ddinter_downloads_code_P.csv</li>
              <li>• ddinter_downloads_code_R.csv</li>
              <li>• ddinter_downloads_code_V.csv</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
