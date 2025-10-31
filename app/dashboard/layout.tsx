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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-white shadow-2xl transition-all duration-300 z-50 ${
          sidebarOpen ? "w-64" : "w-20"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="text-3xl">💊</div>
              {sidebarOpen && (
                <div>
                  <h2 className="font-bold text-lg bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    Smart Pill
                  </h2>
                  <p className="text-xs text-gray-500">Advisory</p>
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
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive
                      ? `bg-gradient-to-r from-${item.color}-100 to-${item.color}-50 border-2 border-${item.color}-300 text-${item.color}-700 shadow-md`
                      : "hover:bg-gray-100 text-gray-700"
                  }`}
                >
                  <span className="text-2xl">{item.icon}</span>
                  {sidebarOpen && (
                    <span className="font-semibold text-sm">{item.label}</span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Profile & Logout */}
          <div className="p-4 border-t border-gray-200">
            <div className={`flex items-center gap-3 mb-3 ${sidebarOpen ? "" : "justify-center"}`}>
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center text-white font-bold">
                {user.name.charAt(0).toUpperCase()}
              </div>
              {sidebarOpen && (
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900 truncate">{user.name}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
              )}
            </div>
            <button
              onClick={handleLogout}
              className={`w-full py-2 bg-red-50 hover:bg-red-100 text-red-600 font-semibold rounded-xl transition-all flex items-center ${
                sidebarOpen ? "justify-center gap-2" : "justify-center"
              }`}
            >
              <span>🚪</span>
              {sidebarOpen && <span className="text-sm">Logout</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div
        className={`transition-all duration-300 ${
          sidebarOpen ? "ml-64" : "ml-20"
        }`}
      >
        {/* Top Bar */}
        <header className="bg-white shadow-sm sticky top-0 z-40">
          <div className="px-6 py-4 flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
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
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                Welcome back, <span className="font-semibold text-purple-600">{user.name}</span>!
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6 min-h-[calc(100vh-73px)] overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
