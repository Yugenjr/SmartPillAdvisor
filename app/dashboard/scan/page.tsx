"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { motion } from "framer-motion";

export default function ScanPage() {
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const [detected, setDetected] = useState<string>("");
  const [name, setName] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [company, setCompany] = useState("");
  const [dosage, setDosage] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(true);

  useEffect(() => {
    const setup = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream as any;
          await videoRef.current.play();
        }
        const reader = new BrowserMultiFormatReader();
        codeReaderRef.current = reader;
        reader.decodeFromVideoDevice(undefined, videoRef.current!, (result: any) => {
          if (result) {
            const text = result.getText();
            setDetected(text);
            setIsScanning(false);
            try {
              const data = JSON.parse(text);
              if (data?.medicine_info?.length) {
                const first = data.medicine_info[0];
                setName(first.name || name);
                setCompany(first.company_name || company);
                if (first.expiry) {
                  // Expecting mm/dd/yyyy → convert to yyyy-mm-dd
                  const [mm, dd, yyyy] = first.expiry.split("/");
                  setExpiryDate(`${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`);
                }
              }
            } catch {
              // plain barcode/QR string - leave it in detected
            }
          }
        });
      } catch (e) {
        setStatus("Camera access denied or unavailable.");
      }
    };
    setup();
    return () => {
      const tracks = (videoRef.current?.srcObject as MediaStream | null)?.getTracks();
      tracks?.forEach((t) => t.stop());
    };
  }, []);

  const submit = async () => {
    if (!user) {
      setStatus("Please login to save medicines");
      return;
    }

    setLoading(true);
    setStatus("");
    try {
      const res = await fetch("/api/medicines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          code: detected || undefined,
          purchaseDate: purchaseDate || undefined,
          expiryDate,
          company: company || undefined,
          dosage: dosage || undefined,
          userEmail: userEmail || user.email,
          userId: user.uid,
          addCalendar: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      setStatus("Saved successfully" + (data.calendarEvent?.id ? `, calendar event: ${data.calendarEvent.id}` : ""));
      setDetected("");
      setName("");
      setCompany("");
      setDosage("");
      setPurchaseDate("");
      setExpiryDate("");
      setIsScanning(true);
    } catch (e: any) {
      setStatus(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full"
    >
      {/* Main Scanner Card */}
      <div className="bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-emerald-500/20 shadow-2xl shadow-emerald-500/10 overflow-hidden">
        <div className="p-8 lg:p-12">
          {/* Floating Header */}
          <div className="text-center mb-12">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <h1 className="text-4xl lg:text-6xl font-bold mb-4 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-lg">
                📱 Medicine Scanner
              </h1>
              <p className="text-lg lg:text-xl text-slate-300 font-medium">
                Scan QR codes or barcodes to track medicine expiry dates
              </p>
            </motion.div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Camera Section */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="bg-slate-800/60 backdrop-blur-xl rounded-2xl p-6 border border-emerald-500/20 shadow-lg shadow-emerald-500/10"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="text-3xl">📷</div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                  Camera Scanner
                </h2>
              </div>

              {/* Scanning Area */}
              <div className="relative mb-6">
                <div className="rounded-2xl bg-slate-900 border-2 border-emerald-400/50 aspect-video overflow-hidden shadow-2xl shadow-emerald-500/20 relative">
                  <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />

                  {/* Scanning Frame */}
                  <div className="absolute inset-0 border-2 border-emerald-400 rounded-2xl">
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-emerald-400 shadow-lg shadow-emerald-400/50"></div>
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-emerald-400 shadow-lg shadow-emerald-400/50"></div>
                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-16 bg-emerald-400 shadow-lg shadow-emerald-400/50"></div>
                    <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-1 h-16 bg-emerald-400 shadow-lg shadow-emerald-400/50"></div>
                  </div>

                  {/* Animated Scan Line */}
                  {isScanning && (
                    <motion.div
                      initial={{ top: 0 }}
                      animate={{ top: "100%" }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "linear"
                      }}
                      className="absolute left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-lg shadow-emerald-400/50"
                    />
                  )}
                </div>

                {/* Scan Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsScanning(!isScanning)}
                  className="absolute bottom-4 left-1/2 transform -translate-x-1/2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-2xl shadow-xl hover:shadow-2xl border border-emerald-400/20"
                >
                  {isScanning ? "⏸️ Pause Scan" : "▶️ Start Scan"}
                </motion.button>
              </div>

              {/* Detection Status */}
              {detected && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 bg-emerald-500/10 backdrop-blur-xl rounded-xl border-2 border-emerald-400/20"
                >
                  <p className="text-sm font-semibold text-emerald-300 mb-2 flex items-center gap-2">
                    <span className="text-lg">✓</span>
                    Code Detected:
                  </p>
                  <p className="text-xs text-emerald-200 font-mono break-all bg-slate-800/50 p-2 rounded">{detected}</p>
                </motion.div>
              )}

              {!detected && isScanning && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-4"
                >
                  <div className="text-emerald-400 text-sm font-medium">Position QR code or barcode within the frame</div>
                </motion.div>
              )}
            </motion.div>

            {/* Form Section */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="bg-slate-800/60 backdrop-blur-xl rounded-2xl p-6 border border-emerald-500/20 shadow-lg shadow-emerald-500/10"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="text-3xl">📝</div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                  Medicine Details
                </h2>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-300 mb-2">Medicine Name *</label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., Paracetamol"
                      className="w-full px-4 py-3 border-2 border-emerald-500/30 rounded-xl focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/20 transition-all duration-300 bg-slate-700/60 backdrop-blur-sm text-slate-200 placeholder-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">Company</label>
                    <input
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="e.g., Pfizer"
                      className="w-full px-4 py-3 border-2 border-emerald-500/30 rounded-xl focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/20 transition-all duration-300 bg-slate-700/60 backdrop-blur-sm text-slate-200 placeholder-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">Dosage</label>
                    <input
                      value={dosage}
                      onChange={(e) => setDosage(e.target.value)}
                      placeholder="e.g., 500mg"
                      className="w-full px-4 py-3 border-2 border-emerald-500/30 rounded-xl focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/20 transition-all duration-300 bg-slate-700/60 backdrop-blur-sm text-slate-200 placeholder-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">Purchase Date</label>
                    <input
                      type="date"
                      value={purchaseDate}
                      onChange={(e) => setPurchaseDate(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-emerald-500/30 rounded-xl focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/20 transition-all duration-300 bg-slate-700/60 backdrop-blur-sm text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">Expiry Date *</label>
                    <input
                      type="date"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-emerald-500/30 rounded-xl focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/20 transition-all duration-300 bg-slate-700/60 backdrop-blur-sm text-slate-200"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-300 mb-2">Your Email (for calendar reminders)</label>
                    <input
                      type="email"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full px-4 py-3 border-2 border-emerald-500/30 rounded-xl focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/20 transition-all duration-300 bg-slate-700/60 backdrop-blur-sm text-slate-200 placeholder-slate-400"
                    />
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={submit}
                  disabled={loading || !name || !expiryDate}
                  className="w-full px-8 py-5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 shadow-xl hover:shadow-2xl border border-emerald-400/20 text-lg"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Saving...</span>
                    </div>
                  ) : (
                    <>💾 Save & Create Reminder</>
                  )}
                </motion.button>

                {status && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`p-4 rounded-xl border-2 ${
                      status.includes('successfully')
                        ? 'bg-green-500/10 border-green-400/20 text-green-300'
                        : 'bg-red-500/10 border-red-400/20 text-red-300'
                    }`}
                  >
                    <p className={`text-sm font-semibold`}>
                      {status.includes('successfully') ? '✓' : '✗'} {status}
                    </p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>

          {/* How to Use Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="mt-8 bg-slate-800/60 backdrop-blur-xl rounded-2xl p-8 border border-emerald-500/20 shadow-lg shadow-emerald-500/10"
          >
            <h3 className="font-bold text-emerald-300 mb-6 text-xl flex items-center gap-3">
              <span className="text-2xl">📱</span>
              How to Use
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex gap-4 p-4 bg-slate-700/40 rounded-xl border border-emerald-500/20"
              >
                <div className="text-3xl">1️⃣</div>
                <div>
                  <p className="font-semibold text-emerald-300 mb-2">Scan QR/Barcode</p>
                  <p className="text-slate-400 text-sm">Point your camera at the medicine package</p>
                </div>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex gap-4 p-4 bg-slate-700/40 rounded-xl border border-emerald-500/20"
              >
                <div className="text-3xl">2️⃣</div>
                <div>
                  <p className="font-semibold text-emerald-300 mb-2">Fill Details</p>
                  <p className="text-slate-400 text-sm">Enter medicine name and expiry date</p>
                </div>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex gap-4 p-4 bg-slate-700/40 rounded-xl border border-emerald-500/20"
              >
                <div className="text-3xl">3️⃣</div>
                <div>
                  <p className="font-semibold text-emerald-300 mb-2">Get Reminders</p>
                  <p className="text-slate-400 text-sm">Receive calendar alerts before expiry</p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
