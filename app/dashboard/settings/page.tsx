"use client";
import { useState } from "react";
import { useAuth } from "@/lib/AuthContext";

export default function SettingsPage() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [notifications, setNotifications] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    // Save settings logic here
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-700 via-gray-800 to-gray-900 rounded-3xl p-8 text-white shadow-xl">
        <h1 className="text-3xl font-bold mb-2">⚙️ Settings</h1>
        <p className="text-gray-300">Manage your account and preferences</p>
      </div>

      {/* Profile Settings */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <span>👤</span> Profile Information
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <span>🔔</span> Notifications
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <p className="font-semibold text-gray-900">Push Notifications</p>
              <p className="text-sm text-gray-600">Receive notifications about medicine expiry</p>
            </div>
            <button
              onClick={() => setNotifications(!notifications)}
              className={`relative w-14 h-8 rounded-full transition-colors ${
                notifications ? "bg-gradient-to-r from-purple-600 to-blue-600" : "bg-gray-300"
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                  notifications ? "transform translate-x-6" : ""
                }`}
              ></div>
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <p className="font-semibold text-gray-900">Email Alerts</p>
              <p className="text-sm text-gray-600">Get email reminders for upcoming expiries</p>
            </div>
            <button
              onClick={() => setEmailAlerts(!emailAlerts)}
              className={`relative w-14 h-8 rounded-full transition-colors ${
                emailAlerts ? "bg-gradient-to-r from-purple-600 to-blue-600" : "bg-gray-300"
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                  emailAlerts ? "transform translate-x-6" : ""
                }`}
              ></div>
            </button>
          </div>
        </div>
      </div>

      {/* Appearance Settings */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <span>🎨</span> Appearance
        </h2>
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
          <div>
            <p className="font-semibold text-gray-900">Dark Mode</p>
            <p className="text-sm text-gray-600">Switch to dark theme</p>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`relative w-14 h-8 rounded-full transition-colors ${
              darkMode ? "bg-gradient-to-r from-purple-600 to-blue-600" : "bg-gray-300"
            }`}
          >
            <div
              className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                darkMode ? "transform translate-x-6" : ""
              }`}
            ></div>
          </button>
        </div>
      </div>

      {/* Privacy & Security */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <span>🔒</span> Privacy & Security
        </h2>
        <div className="space-y-3">
          <button className="w-full p-4 bg-gray-50 hover:bg-gray-100 rounded-xl text-left transition-colors">
            <p className="font-semibold text-gray-900">Change Password</p>
            <p className="text-sm text-gray-600">Update your account password</p>
          </button>
          <button className="w-full p-4 bg-gray-50 hover:bg-gray-100 rounded-xl text-left transition-colors">
            <p className="font-semibold text-gray-900">Two-Factor Authentication</p>
            <p className="text-sm text-gray-600">Add an extra layer of security</p>
          </button>
          <button className="w-full p-4 bg-gray-50 hover:bg-gray-100 rounded-xl text-left transition-colors">
            <p className="font-semibold text-gray-900">Privacy Settings</p>
            <p className="text-sm text-gray-600">Manage your data and privacy</p>
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-red-200">
        <h2 className="text-2xl font-bold text-red-600 mb-6 flex items-center gap-2">
          <span>⚠️</span> Danger Zone
        </h2>
        <button className="w-full p-4 bg-red-50 hover:bg-red-100 text-red-600 font-semibold rounded-xl transition-colors">
          Delete Account
        </button>
      </div>

      {/* Save Button */}
      <div className="flex gap-4">
        <button
          onClick={handleSave}
          className="flex-1 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl"
        >
          Save Changes
        </button>
        <button className="px-8 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors">
          Cancel
        </button>
      </div>

      {saved && (
        <div className="fixed bottom-6 right-6 bg-green-500 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-2 animate-bounce">
          <span>✓</span>
          <span className="font-semibold">Settings saved successfully!</span>
        </div>
      )}
    </div>
  );
}
