"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import Link from "next/link";

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
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black opacity-20"></div>
      
      <div className="relative max-w-md w-full">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-2">💊</h1>
          <h2 className="text-3xl font-bold text-white mb-2">Smart Pill Advisory</h2>
          <p className="text-purple-200">Your Intelligent Medication Companion</p>
        </div>

        {/* Auth Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                isLogin
                  ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                !isLogin
                  ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={!isLogin}
                  placeholder="John Doe"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none transition-colors"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none transition-colors"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border-2 border-red-200 rounded-xl">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Please wait...</span>
                </div>
              ) : isLogin ? (
                "Login to Dashboard"
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {/* Mock Login Button for Testing */}
          {isLogin && (
            <div className="mt-4 space-y-2">
              <button
                onClick={async () => {
                  setLoading(true);
                  setError("");
                  try {
                    // First try to signup with test account (this will work if auth is enabled)
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
                      // Signup failed, try login (account might already exist)
                      const result = await login("test@example.com", "test123");
                      if (result.success) {
                        router.push("/dashboard");
                      } else {
                        // Check if it's a configuration issue
                        if (result.error?.includes('invalid-credential') || result.error?.includes('configuration')) {
                          setError("Firebase Authentication not properly configured. Please enable Email/Password sign-in in Firebase Console → Authentication → Sign-in method");
                        } else {
                          setError(result.error || "Mock login failed");
                        }
                      }
                    }
                  } catch (err) {
                    setError("An error occurred during mock login. Check Firebase configuration.");
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                🚀 Quick Test Login (Demo Account)
              </button>

              {/* Development Mode Bypass */}
              <button
                onClick={async () => {
                  setLoading(true);
                  setError("");
                  try {
                    // Bypass authentication for development/testing
                    localStorage.setItem("dev_bypass", "true");
                    localStorage.setItem("dev_user", JSON.stringify({
                      uid: "dev-user-123",
                      email: "dev@example.com",
                      name: "Dev User"
                    }));
                    router.push("/dashboard");
                  } catch (err) {
                    setError("Development bypass failed");
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
                className="w-full py-2 bg-gradient-to-r from-orange-600 to-red-600 text-white font-semibold rounded-xl hover:from-orange-700 hover:to-red-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-xs"
              >
                🔧 Dev Mode (No Auth Required)
              </button>

              <p className="text-xs text-gray-500 text-center mt-2">
                Use Dev Mode if Firebase auth is not configured
              </p>
            </div>
          )}

          {isLogin && (
            <div className="mt-4 text-center">
              <a href="#" className="text-sm text-purple-600 hover:text-purple-700 font-medium">
                Forgot password?
              </a>
            </div>
          )}
        </div>

        <p className="text-center text-purple-200 text-sm mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
