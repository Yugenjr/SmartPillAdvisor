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
    { icon: "⚙️", label: "Settings", href: "/dashboard/settings", color: "gray" },
  ];

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-white/95 backdrop-blur-xl shadow-2xl border-r border-white/20 z-50 transition-all duration-500 ease-in-out ${
          sidebarOpen ? "w-72 shadow-2xl" : "w-20 shadow-lg"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-gray-100/50">
            <div className="flex items-center gap-3">
              <div className="text-4xl p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl text-white shadow-lg">
                💊
              </div>
              {sidebarOpen && (
                <div className="transition-all duration-300">
                  <h2 className="font-bold text-xl bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                    Smart Pill
                  </h2>
                  <p className="text-sm text-gray-500 font-medium">Advisor</p>
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
                      ? `bg-gradient-to-r ${item.color}-500 to-${item.color}-600 text-white shadow-xl scale-105`
                      : "hover:bg-gradient-to-r hover:from-white/60 hover:to-gray-50/60 text-gray-700 hover:shadow-lg"
                  }`}
                >
                  <span className="text-3xl group-hover:scale-110 transition-transform duration-200">{item.icon}</span>
                  {sidebarOpen && (
                    <span className="font-semibold text-sm tracking-wide">{item.label}</span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Profile & Logout */}
          <div className="p-4 border-t border-gray-100/50">
            <div className={`flex items-center gap-3 mb-4 ${sidebarOpen ? "" : "justify-center"}`}>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg ring-4 ring-white/50">
                {user.name.charAt(0).toUpperCase()}
              </div>
              {sidebarOpen && (
                <div className="flex-1 min-w-0 transition-all duration-300">
                  <p className="font-bold text-sm text-gray-900 truncate">{user.name}</p>
                  <p className="text-xs text-gray-500 truncate font-medium">{user.email}</p>
                </div>
              )}
            </div>
            <button
              onClick={handleLogout}
              className={`w-full py-3 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-bold rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center ${
                sidebarOpen ? "justify-center gap-3" : "justify-center"
              }`}
            >
              <span className="text-lg">🚪</span>
              {sidebarOpen && <span className="text-sm tracking-wide">Logout</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div
        className={`flex flex-col transition-all duration-500 ease-in-out ${
          sidebarOpen ? "ml-72" : "ml-20"
        }`}
      >
        {/* Top Bar */}
        <header className="bg-white/80 backdrop-blur-xl shadow-lg sticky top-0 z-40 border-b border-white/20">
          <div className="px-8 py-6 flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-3 hover:bg-gray-100/80 rounded-2xl transition-all duration-300 hover:scale-110 shadow-lg hover:shadow-xl"
            >
              <svg
                className="w-6 h-6 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-sm text-gray-600 font-medium">Welcome back,</p>
                <p className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {user.name}
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg">
                {user.name.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto min-h-0">
          {children}
        </main>
      </div>
    </div>
  );
}
