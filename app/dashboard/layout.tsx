"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import Link from "next/link";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const menuItems = [
    { icon: "🏠", label: "Dashboard", href: "/dashboard", color: "purple" },
    { icon: "🤖", label: "AI Chatbot", href: "/dashboard/chat", color: "pink" },
    { icon: "💊", label: "Interactions", href: "/dashboard/interactions", color: "blue" },
    { icon: "📱", label: "Scanner", href: "/dashboard/scan", color: "emerald" },
    { icon: "📋", label: "Track Records", href: "/dashboard/records", color: "indigo" },
    { icon: "🔮", label: "Price Predictions", href: "/dashboard/predictions", color: "amber" },
    { icon: "⚙️", label: "Settings", href: "/dashboard/settings", color: "gray" },
  ];

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"></div>
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-cyan-500/5 to-transparent rounded-full blur-3xl"></div>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-slate-900/95 backdrop-blur-xl border-r border-cyan-500/20 z-50 transition-all duration-500 ease-in-out ${
          sidebarOpen ? "w-72 lg:w-72 md:w-64 shadow-2xl" : "w-20 shadow-lg"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-cyan-500/20">
            <div className="flex items-center gap-3">
              <div className="text-4xl p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl text-white shadow-lg shadow-cyan-500/25 transform hover:scale-110 transition-transform duration-300">
                💊
              </div>
              {sidebarOpen && (
                <div className="transition-all duration-300">
                  <h2 className="font-bold text-xl bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                    Smart Pill
                  </h2>
                  <p className="text-sm text-slate-400 font-medium">Advisor</p>
                </div>
              )}
            </div>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 transform hover:scale-105 ${
                    isActive
                      ? `bg-gradient-to-r ${item.color}-500/20 to-${item.color}-600/20 text-white shadow-xl scale-105 border border-${item.color}-500/30`
                      : "hover:bg-slate-800/60 text-slate-300 hover:shadow-lg border border-transparent hover:border-cyan-500/20"
                  }`}
                  aria-label={`${item.label} ${isActive ? '(current page)' : ''}`}
                >
                  <span className="text-3xl group-hover:scale-110 transition-transform duration-200" aria-hidden="true">{item.icon}</span>
                  {sidebarOpen && (
                    <span className="font-semibold text-sm tracking-wide">{item.label}</span>
                  )}
                  {isActive && (
                    <div className="ml-auto w-2 h-2 bg-cyan-400 rounded-full animate-pulse shadow-lg shadow-cyan-400/50" aria-hidden="true"></div>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Profile & Logout */}
          <div className="p-4 border-t border-cyan-500/20">
            <div className={`flex items-center gap-3 mb-4 ${sidebarOpen ? "" : "justify-center"}`}>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 via-blue-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg shadow-cyan-500/25 transform hover:scale-110 transition-transform duration-300">
                {user.name.charAt(0).toUpperCase()}
              </div>
              {sidebarOpen && (
                <div className="flex-1 min-w-0 transition-all duration-300">
                  <p className="font-bold text-sm text-slate-200 truncate">{user.name}</p>
                  <p className="text-xs text-slate-400 truncate font-medium">{user.email}</p>
                </div>
              )}
            </div>
            <button
              onClick={handleLogout}
              className={`w-full py-3 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-bold rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl shadow-red-500/25 flex items-center ${
                sidebarOpen ? "justify-center gap-3" : "justify-center"
              } focus:outline-none focus:ring-4 focus:ring-red-500/20 border border-red-500/20 hover:border-red-500/40`}
              aria-label="Logout"
            >
              <span className="text-lg" aria-hidden="true">🚪</span>
              {sidebarOpen && <span className="text-sm tracking-wide">Logout</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        ></div>
      )}

      {/* Main Content */}
      <div
        className={`flex flex-col transition-all duration-500 ease-in-out ${
          sidebarOpen ? "ml-72 lg:ml-72 md:ml-64" : "ml-20"
        }`}
      >
        {/* Top Bar */}
        <header className="bg-slate-900/80 backdrop-blur-xl shadow-2xl sticky top-0 z-40 border-b border-cyan-500/20">
          <div className="px-4 sm:px-6 lg:px-8 py-4 lg:py-6 flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 lg:p-3 bg-slate-800/60 hover:bg-slate-700/60 rounded-2xl transition-all duration-300 hover:scale-110 shadow-lg hover:shadow-xl shadow-cyan-500/10 focus:outline-none focus:ring-4 focus:ring-cyan-500/20 border border-cyan-500/20"
              aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            >
              <svg
                className="w-5 h-5 lg:w-6 lg:h-6 text-cyan-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <div className="flex items-center gap-3 lg:gap-6">
              <div className="hidden sm:block text-right">
                <p className="text-xs lg:text-sm text-slate-400 font-medium">Welcome back,</p>
                <p className="text-sm lg:text-lg font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent truncate max-w-32 lg:max-w-none">
                  {user.name}
                </p>
              </div>
              <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg shadow-cyan-500/25 transform hover:scale-110 transition-transform duration-300">
                {user.name.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-hidden min-h-0 relative">
          <div className="h-full w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
