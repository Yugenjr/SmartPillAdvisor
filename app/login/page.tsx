"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import Link from "next/link";
import { motion } from "framer-motion";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, signup } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      let result;
      if (isLogin) {
        result = await login(email, password);
      } else {
        if (!name.trim()) {
          setError("Please enter your name");
          setLoading(false);
          return;
        }
        result = await signup(name, email, password);
      }

      if (result.success) {
        router.push("/dashboard");
      } else {
        setError(result.error || "Authentication failed. Please try again.");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="relative max-w-md w-full"
      >
        {/* Logo/Brand */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="text-7xl mb-4">💊</div>
          <h1 className="text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent drop-shadow-lg">
            Smart Pill Advisor
          </h1>
          <p className="text-slate-300 font-medium text-lg">Your Intelligent Medication Companion</p>
        </motion.div>

        {/* Auth Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="bg-slate-800/60 backdrop-blur-xl rounded-3xl border border-cyan-500/20 shadow-2xl shadow-cyan-500/10 p-8"
        >
          <div className="flex gap-3 mb-8 p-1 bg-slate-700/50 rounded-2xl">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-4 rounded-xl font-bold transition-all duration-300 ${
                isLogin
                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-xl border border-cyan-400/20"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Login
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-4 rounded-xl font-bold transition-all duration-300 ${
                !isLogin
                  ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-xl border border-pink-400/20"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Sign Up
            </motion.button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <label className="block text-sm font-semibold text-slate-300 mb-3">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={!isLogin}
                  placeholder="John Doe"
                  className="w-full px-4 py-4 border-2 border-cyan-500/30 rounded-xl focus:outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/20 transition-all duration-300 bg-slate-700/60 backdrop-blur-sm text-slate-200 placeholder-slate-400 text-base"
                />
              </motion.div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-3">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full px-4 py-4 border-2 border-cyan-500/30 rounded-xl focus:outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/20 transition-all duration-300 bg-slate-700/60 backdrop-blur-sm text-slate-200 placeholder-slate-400 text-base"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-3">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-4 py-4 border-2 border-cyan-500/30 rounded-xl focus:outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/20 transition-all duration-300 bg-slate-700/60 backdrop-blur-sm text-slate-200 placeholder-slate-400 text-base"
              />
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 bg-red-500/10 backdrop-blur-xl rounded-xl border-2 border-red-400/20"
              >
                <p className="text-sm text-red-300 font-medium">{error}</p>
              </motion.div>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-2xl hover:from-cyan-600 hover:to-blue-700 transition-all duration-300 shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed border border-cyan-400/20 text-lg"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Please wait...</span>
                </div>
              ) : isLogin ? (
                <>🔓 Login to Dashboard</>
              ) : (
                <>✨ Create Account</>
              )}
            </motion.button>
          </form>

          {/* Mock Login Button for Testing */}
          {isLogin && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="mt-6 space-y-3"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={async () => {
                  setLoading(true);
                  setError("");
                  try {
                    // Try login first (since account likely exists)
                    const loginResult = await login("test@example.com", "test123");
                    if (loginResult.success) {
                      router.push("/dashboard");
                      return;
                    }

                    // If login fails, try signup (new account)
                    const signupResult = await signup("Test User", "test@example.com", "test123");
                    if (signupResult.success) {
                      // Account created successfully, now login
                      const result = await login("test@example.com", "test123");
                      if (result.success) {
                        router.push("/dashboard");
                      } else {
                        setError(result.error || "Login failed after account creation");
                      }
                    } else {
                      setError(signupResult.error || "Failed to create demo account");
                    }
                  } catch (err: any) {
                    console.error("Demo login error:", err);
                    setError("Demo login failed. Check your internet connection and Firebase setup.");
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-2xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed border border-emerald-400/20"
              >
                🚀 Quick Test Login (Demo Account)
              </motion.button>

              <p className="text-xs text-slate-400 text-center">
                Creates a demo account for testing the app
              </p>
            </motion.div>
          )}

          {isLogin && (
            <div className="mt-6 text-center">
              <a href="#" className="text-sm text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
                Forgot password?
              </a>
            </div>
          )}
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0, duration: 0.6 }}
          className="text-center text-slate-400 text-sm mt-8"
        >
          By continuing, you agree to our Terms of Service and Privacy Policy
        </motion.p>
      </motion.div>
    </div>
  );
}
