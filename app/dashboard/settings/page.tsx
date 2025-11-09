"use client";
import { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useTheme } from "@/lib/ThemeContext";
import { motion } from "framer-motion";

export default function SettingsPage() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [notifications, setNotifications] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    // Save settings logic here
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full"
    >
      {/* Main Settings Card */}
      <div className="bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-cyan-500/20 shadow-2xl shadow-cyan-500/10 overflow-hidden">
        <div className="p-8 lg:p-12">
          {/* Floating Header */}
          <div className="text-center mb-12">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <h1 className="text-4xl lg:text-6xl font-bold mb-4 bg-gradient-to-r from-cyan-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent drop-shadow-lg">
                ⚙️ Settings
              </h1>
              <p className="text-lg lg:text-xl text-slate-300 font-medium">
                Manage your account and preferences
              </p>
            </motion.div>
          </div>

          {/* Profile Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="bg-slate-800/60 backdrop-blur-xl rounded-2xl p-8 border border-cyan-500/20 shadow-lg shadow-cyan-500/10 mb-8"
          >
            <h2 className="text-2xl font-bold text-slate-200 mb-6 flex items-center gap-3">
              <span className="text-3xl">👤</span>
              Profile Information
            </h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-3">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-4 border-2 border-cyan-500/30 rounded-xl focus:outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/20 transition-all duration-300 bg-slate-700/60 backdrop-blur-sm text-slate-200 placeholder-slate-400 text-base"
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-3">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-4 border-2 border-cyan-500/30 rounded-xl focus:outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/20 transition-all duration-300 bg-slate-700/60 backdrop-blur-sm text-slate-200 placeholder-slate-400 text-base"
                  placeholder="your@email.com"
                />
              </div>
            </div>
          </motion.div>

          {/* Notification Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="bg-slate-800/60 backdrop-blur-xl rounded-2xl p-8 border border-pink-500/20 shadow-lg shadow-pink-500/10 mb-8"
          >
            <h2 className="text-2xl font-bold text-slate-200 mb-6 flex items-center gap-3">
              <span className="text-3xl">🔔</span>
              Notifications
            </h2>
            <div className="space-y-4">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="flex items-center justify-between p-6 bg-slate-700/40 rounded-xl border border-slate-600/20"
              >
                <div>
                  <p className="font-semibold text-slate-200 mb-1">Push Notifications</p>
                  <p className="text-sm text-slate-400">Receive notifications about medicine expiry</p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setNotifications(!notifications)}
                  className={`relative w-14 h-8 rounded-full transition-colors border-2 border-transparent ${
                    notifications ? "bg-gradient-to-r from-pink-500 to-purple-600 shadow-lg shadow-pink-500/25" : "bg-slate-600"
                  }`}
                >
                  <motion.div
                    className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform`}
                    animate={{ x: notifications ? 24 : 0 }}
                  />
                </motion.button>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className="flex items-center justify-between p-6 bg-slate-700/40 rounded-xl border border-slate-600/20"
              >
                <div>
                  <p className="font-semibold text-slate-200 mb-1">Email Alerts</p>
                  <p className="text-sm text-slate-400">Get email reminders for upcoming expiries</p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setEmailAlerts(!emailAlerts)}
                  className={`relative w-14 h-8 rounded-full transition-colors border-2 border-transparent ${
                    emailAlerts ? "bg-gradient-to-r from-pink-500 to-purple-600 shadow-lg shadow-pink-500/25" : "bg-slate-600"
                  }`}
                >
                  <motion.div
                    className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform`}
                    animate={{ x: emailAlerts ? 24 : 0 }}
                  />
                </motion.button>
              </motion.div>
            </div>
          </motion.div>

          {/* Appearance Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className={`bg-slate-800/60 backdrop-blur-xl rounded-2xl p-8 border ${
              theme === 'dark' ? 'border-emerald-500/20' : 'border-blue-500/20'
            } shadow-lg ${
              theme === 'dark' ? 'shadow-emerald-500/10' : 'shadow-blue-500/10'
            } mb-8`}
          >
            <h2 className="text-2xl font-bold text-slate-200 mb-6 flex items-center gap-3">
              <span className="text-3xl">🎨</span>
              Appearance
            </h2>
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="flex items-center justify-between p-6 bg-slate-700/40 rounded-xl border border-slate-600/20"
            >
              <div>
                <p className="font-semibold text-slate-200 mb-1">Theme</p>
                <p className="text-sm text-slate-400">Current: {theme === 'dark' ? '🌙 Dark' : '☀️ Light'}</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleTheme}
                className={`relative w-14 h-8 rounded-full transition-colors border-2 border-transparent ${
                  theme === 'dark'
                    ? "bg-gradient-to-r from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25"
                    : "bg-gradient-to-r from-blue-500 to-cyan-600 shadow-lg shadow-blue-500/25"
                }`}
              >
                <motion.div
                  className="absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform"
                  animate={{ x: theme === 'dark' ? 24 : 0 }}
                />
              </motion.button>
            </motion.div>
          </motion.div>

          {/* Privacy & Security */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0, duration: 0.6 }}
            className="bg-slate-800/60 backdrop-blur-xl rounded-2xl p-8 border border-blue-500/20 shadow-lg shadow-blue-500/10 mb-8"
          >
            <h2 className="text-2xl font-bold text-slate-200 mb-6 flex items-center gap-3">
              <span className="text-3xl">🔒</span>
              Privacy & Security
            </h2>
            <div className="space-y-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                className="w-full p-6 bg-slate-700/40 hover:bg-slate-600/40 rounded-xl text-left transition-all duration-300 border border-slate-600/20 hover:border-cyan-500/30"
              >
                <p className="font-semibold text-slate-200 mb-1">Change Password</p>
                <p className="text-sm text-slate-400">Update your account password</p>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                className="w-full p-6 bg-slate-700/40 hover:bg-slate-600/40 rounded-xl text-left transition-all duration-300 border border-slate-600/20 hover:border-cyan-500/30"
              >
                <p className="font-semibold text-slate-200 mb-1">Two-Factor Authentication</p>
                <p className="text-sm text-slate-400">Add an extra layer of security</p>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                className="w-full p-6 bg-slate-700/40 hover:bg-slate-600/40 rounded-xl text-left transition-all duration-300 border border-slate-600/20 hover:border-cyan-500/30"
              >
                <p className="font-semibold text-slate-200 mb-1">Privacy Settings</p>
                <p className="text-sm text-slate-400">Manage your data and privacy</p>
              </motion.button>
            </div>
          </motion.div>

          {/* Danger Zone */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.6 }}
            className="bg-slate-800/60 backdrop-blur-xl rounded-2xl p-8 border-2 border-red-500/30 shadow-lg shadow-red-500/10 mb-8"
          >
            <h2 className="text-2xl font-bold text-red-300 mb-6 flex items-center gap-3">
              <span className="text-3xl">⚠️</span>
              Danger Zone
            </h2>
            <motion.button
              whileHover={{ scale: 1.02 }}
              className="w-full p-6 bg-red-500/10 hover:bg-red-500/20 text-red-300 font-semibold rounded-xl transition-all duration-300 border border-red-500/20 hover:border-red-400/40"
            >
              Delete Account
            </motion.button>
          </motion.div>

          {/* Save/Cancel Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4, duration: 0.6 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSave}
              className="flex-1 py-5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-2xl hover:from-cyan-600 hover:to-blue-700 transition-all duration-300 shadow-xl hover:shadow-2xl border border-cyan-400/20 text-lg"
            >
              💾 Save Changes
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-5 bg-slate-600 hover:bg-slate-700 text-white font-bold rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl border border-slate-500/20"
            >
              Cancel
            </motion.button>
          </motion.div>
        </div>
      </div>

      {/* Success Notification */}
      {saved && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="fixed bottom-8 right-8 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-4 rounded-2xl shadow-2xl border border-green-400/20 flex items-center gap-3"
        >
          <motion.span
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="text-2xl"
          >
            ✓
          </motion.span>
          <span className="font-bold">Settings saved successfully!</span>
        </motion.div>
      )}
    </motion.div>
  );
}
