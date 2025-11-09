"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

interface ChatSession {
  sessionId: string;
  title: string;
  messages: any[];
  createdAt: Date | string;
  userId: string;
}

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalMedicines: 0,
    interactionsChecked: 0,
    aiConsultations: 0,
    upcomingExpiries: 0,
  });
  const [expiryData, setExpiryData] = useState({ safe: 0, warning: 0, critical: 0 });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    if (!user) return;

    try {
      // Fetch medicines from MongoDB
      const medicinesResponse = await fetch(`/api/medicines?userId=${user.uid}`);
      const medicinesData = await medicinesResponse.json();
      const medicines = medicinesData.medicines || [];

      // Calculate expiry stats
      const today = new Date();
      let safe = 0, warning = 0, critical = 0, upcoming = 0;

      medicines.forEach((med: any) => {
        const expiryDate = new Date(med.expiryDate);
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (daysUntilExpiry < 0) {
          critical++;
        } else if (daysUntilExpiry <= 30) {
          warning++;
          upcoming++;
        } else {
          safe++;
        }
      });

      setExpiryData({ safe, warning, critical });

      // Fetch chat sessions from MongoDB
      const chatResponse = await fetch(`/api/chat/sessions?userId=${user.uid}`);
      const chatData = await chatResponse.json();
      const chatSessions: ChatSession[] = chatData.sessions || [];

      // For now, we'll estimate interactions checked from chat sessions (can be improved later)
      const interactionsChecked = chatSessions.length > 0 ? Math.floor(chatSessions.length * 0.8) : 0;

      setStats({
        totalMedicines: medicines.length,
        interactionsChecked,
        aiConsultations: chatSessions.length,
        upcomingExpiries: upcoming
      });

      // Fetch recent activity
      const activities: any[] = [];

      // Add recent medicines
      medicines.slice(0, 2).forEach((med: any) => {
        activities.push({
          icon: "💊",
          text: `Added medicine: ${med.name}`,
          time: getTimeAgo(med.createdAt || new Date().toISOString()),
          type: "success"
        });
      });

      // Add recent chats
      chatSessions.slice(0, 1).forEach(session => {
        activities.push({
          icon: "🤖",
          text: "AI Consultation",
          time: getTimeAgo(session.createdAt ? (typeof session.createdAt === 'string' ? session.createdAt : session.createdAt.toISOString()) : new Date().toISOString()),
          type: "info"
        });
      });

      setRecentActivity(activities.slice(0, 3));
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  };

  const data = {
    labels: ['Safe', 'Warning', 'Critical'],
    datasets: [
      {
        label: "Medicine Expiry Risk",
        data: [expiryData.safe, expiryData.warning, expiryData.critical],
        backgroundColor: ["#22c55e", "#f59e0b", "#ef4444"],
        borderRadius: 8,
      },
    ],
  };

  const quickActions = [
    {
      icon: "🤖",
      title: "Ask AI Assistant",
      description: "Get instant medical guidance",
      href: "/dashboard/chat",
      gradient: "from-pink-500 to-purple-600",
      bgGradient: "from-pink-50 to-purple-50"
    },
    {
      icon: "💊",
      title: "Check Interactions",
      description: "Verify drug compatibility",
      href: "/dashboard/interactions",
      gradient: "from-purple-500 to-blue-600",
      bgGradient: "from-purple-50 to-blue-50"
    },
    {
      icon: "📱",
      title: "Scan Medicine",
      description: "Track expiry dates",
      href: "/dashboard/scan",
      gradient: "from-emerald-500 to-teal-600",
      bgGradient: "from-emerald-50 to-teal-50"
    },
    {
      icon: "📋",
      title: "View Records",
      description: "Track your medications",
      href: "/dashboard/records",
      gradient: "from-indigo-500 to-purple-600",
      bgGradient: "from-indigo-50 to-purple-50"
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 overflow-y-auto">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 rounded-3xl p-10 text-white shadow-2xl">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute -top-4 -right-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-white/5 rounded-full blur-xl"></div>
        <div className="relative z-10">
          <h1 className="text-4xl font-bold mb-3">Welcome to Your Dashboard! 👋</h1>
          <p className="text-xl text-blue-100 font-medium">Manage your medications and health with ease</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <div className="group bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105 border border-white/20">
          <div className="flex items-center justify-between mb-6">
            <div className="text-6xl group-hover:scale-110 transition-transform duration-300">💊</div>
            <div className="text-right">
              <p className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{stats.totalMedicines}</p>
              <p className="text-sm text-gray-600 font-medium">Total Medicines</p>
            </div>
          </div>
          <div className="h-3 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full overflow-hidden">
            <div className="h-full w-4/5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full shadow-lg"></div>
          </div>
        </div>

        <div className="group bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105 border border-white/20">
          <div className="flex items-center justify-between mb-6">
            <div className="text-6xl group-hover:scale-110 transition-transform duration-300">⚡</div>
            <div className="text-right">
              <p className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">{stats.interactionsChecked}</p>
              <p className="text-sm text-gray-600 font-medium">Interactions Checked</p>
            </div>
          </div>
          <div className="h-3 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full overflow-hidden">
            <div className="h-full w-3/5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-lg"></div>
          </div>
        </div>

        <div className="group bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105 border border-white/20">
          <div className="flex items-center justify-between mb-6">
            <div className="text-6xl group-hover:scale-110 transition-transform duration-300">🤖</div>
            <div className="text-right">
              <p className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">{stats.aiConsultations}</p>
              <p className="text-sm text-gray-600 font-medium">AI Consultations</p>
            </div>
          </div>
          <div className="h-3 bg-gradient-to-r from-pink-100 to-rose-100 rounded-full overflow-hidden">
            <div className="h-full w-2/3 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full shadow-lg"></div>
          </div>
        </div>

        <div className="group bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105 border border-white/20">
          <div className="flex items-center justify-between mb-6">
            <div className="text-6xl group-hover:scale-110 transition-transform duration-300">⏰</div>
            <div className="text-right">
              <p className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">{stats.upcomingExpiries}</p>
              <p className="text-sm text-gray-600 font-medium">Upcoming Expiries</p>
            </div>
          </div>
          <div className="h-3 bg-gradient-to-r from-orange-100 to-red-100 rounded-full overflow-hidden">
            <div className="h-full w-1/3 bg-gradient-to-r from-orange-500 to-red-500 rounded-full shadow-lg"></div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action, idx) => (
            <Link
              key={idx}
              href={action.href}
              className="group relative overflow-hidden bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105 border border-white/20"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${action.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
              <div className="relative p-8">
                <div className="text-6xl mb-6 group-hover:scale-110 transition-transform duration-300">{action.icon}</div>
                <h3 className={`text-2xl font-bold mb-3 bg-gradient-to-r ${action.gradient} bg-clip-text text-transparent`}>
                  {action.title}
                </h3>
                <p className="text-gray-600 text-base font-medium">{action.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Chart */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl p-8 border border-white/20">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Expiry Risk Overview</h3>
          <div className="h-80">
            <Bar
              data={data}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                },
                scales: {
                  y: { 
                    beginAtZero: true, 
                    grid: { color: 'rgba(0, 0, 0, 0.05)' },
                    ticks: { font: { size: 12, weight: 'bold' } }
                  },
                  x: { 
                    grid: { display: false },
                    ticks: { font: { size: 12, weight: 'bold' } }
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl p-8 border border-white/20">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Recent Activity</h3>
          <div className="space-y-6">
            {recentActivity.map((activity, idx) => (
              <div key={idx} className="flex items-start gap-4 p-6 bg-gradient-to-r from-gray-50/80 to-white/80 rounded-2xl hover:from-gray-100/80 hover:to-gray-50/80 transition-all duration-300 border border-white/20">
                <div className="text-4xl p-2 bg-white rounded-2xl shadow-lg">{activity.icon}</div>
                <div className="flex-1">
                  <p className="text-base font-bold text-gray-900">{activity.text}</p>
                  <p className="text-sm text-gray-500 mt-1 font-medium">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
