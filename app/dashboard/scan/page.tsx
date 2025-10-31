"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { BrowserMultiFormatReader } from "@zxing/browser";

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
    } catch (e: any) {
      setStatus(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 rounded-3xl p-8 text-white shadow-xl">
        <h1 className="text-3xl font-bold mb-2">📱 Medicine Scanner</h1>
        <p className="text-emerald-100">Scan QR codes or barcodes to track medicine expiry dates</p>
      </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Camera Section */}
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                📷 Camera Scanner
              </h2>
            </div>
            <div className="p-6">
              <div className="rounded-2xl bg-black aspect-video overflow-hidden shadow-inner">
                <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
              </div>
              {detected && (
                <div className="mt-4 p-4 bg-emerald-50 border-2 border-emerald-200 rounded-xl">
                  <p className="text-sm font-semibold text-emerald-900 mb-2">✓ Code Detected:</p>
                  <p className="text-xs text-emerald-700 font-mono break-all">{detected}</p>
                </div>
              )}
            </div>
          </div>

          {/* Form Section */}
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                📝 Medicine Details
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Medicine Name *</label>
                  <input 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    placeholder="e.g., Paracetamol"
                    className="w-full rounded-lg border-2 border-gray-200 px-4 py-3 focus:border-emerald-500 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Company</label>
                  <input 
                    value={company} 
                    onChange={(e) => setCompany(e.target.value)} 
                    placeholder="e.g., Pfizer"
                    className="w-full rounded-lg border-2 border-gray-200 px-4 py-3 focus:border-emerald-500 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Dosage</label>
                  <input 
                    value={dosage} 
                    onChange={(e) => setDosage(e.target.value)} 
                    placeholder="e.g., 500mg"
                    className="w-full rounded-lg border-2 border-gray-200 px-4 py-3 focus:border-emerald-500 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Purchase Date</label>
                  <input 
                    type="date" 
                    value={purchaseDate} 
                    onChange={(e) => setPurchaseDate(e.target.value)} 
                    className="w-full rounded-lg border-2 border-gray-200 px-4 py-3 focus:border-emerald-500 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Expiry Date *</label>
                  <input 
                    type="date" 
                    value={expiryDate} 
                    onChange={(e) => setExpiryDate(e.target.value)} 
                    className="w-full rounded-lg border-2 border-gray-200 px-4 py-3 focus:border-emerald-500 focus:outline-none transition-colors"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Your Email (for calendar reminders)</label>
                  <input 
                    type="email" 
                    value={userEmail} 
                    onChange={(e) => setUserEmail(e.target.value)} 
                    placeholder="your@email.com"
                    className="w-full rounded-lg border-2 border-gray-200 px-4 py-3 focus:border-emerald-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <button 
                onClick={submit} 
                disabled={loading || !name || !expiryDate} 
                className="w-full px-6 py-4 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:from-emerald-700 hover:to-teal-700 transition-all shadow-md hover:shadow-lg"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Saving...</span>
                  </div>
                ) : (
                  "💾 Save & Create Reminder"
                )}
              </button>

              {status && (
                <div className={`p-4 rounded-xl ${status.includes('successfully') ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'}`}>
                  <p className={`text-sm font-semibold ${status.includes('successfully') ? 'text-green-900' : 'text-red-900'}`}>
                    {status.includes('successfully') ? '✓' : '✗'} {status}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-gradient-to-r from-emerald-100 to-teal-100 rounded-3xl p-8 border-2 border-emerald-200">
          <h3 className="font-bold text-emerald-900 text-lg mb-4">📱 How to Use</h3>
          <div className="grid md:grid-cols-3 gap-6 text-sm">
            <div className="flex gap-3">
              <div className="text-3xl">1️⃣</div>
              <div>
                <p className="font-semibold text-emerald-900 mb-1">Scan QR/Barcode</p>
                <p className="text-emerald-700">Point your camera at the medicine package</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="text-3xl">2️⃣</div>
              <div>
                <p className="font-semibold text-emerald-900 mb-1">Fill Details</p>
                <p className="text-emerald-700">Enter medicine name and expiry date</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="text-3xl">3️⃣</div>
              <div>
                <p className="font-semibold text-emerald-900 mb-1">Get Reminders</p>
                <p className="text-emerald-700">Receive calendar alerts before expiry</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
