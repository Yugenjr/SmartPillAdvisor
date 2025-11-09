"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { Bar, Pie, Line, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { motion } from "framer-motion";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface ChatSession {
  sessionId: string;
  title: string;
  messages: any[];
  createdAt: Date | string;
  userId: string;
}

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
      gradient: "from-cyan-500 to-blue-600",
      glowColor: "cyan"
    },
    {
      icon: "💊",
      title: "Check Interactions",
      description: "Verify drug compatibility",
      href: "/dashboard/interactions",
      gradient: "from-pink-500 to-purple-600",
      glowColor: "pink"
    },
    {
      icon: "📱",
      title: "Scan Medicine",
      description: "Track expiry dates",
      href: "/dashboard/scan",
      gradient: "from-emerald-500 to-teal-600",
      glowColor: "emerald"
    },
    {
      icon: "📋",
      title: "View Records",
      description: "Track your medications",
      href: "/dashboard/records",
      gradient: "from-indigo-500 to-purple-600",
      glowColor: "indigo"
    },
  ];

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center min-h-[60vh]"
      >
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4 shadow-lg shadow-cyan-500/25"></div>
          <p className="text-slate-300">Loading your dashboard...</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full"
    >
      {/* Main Dashboard Card */}
      <div className="bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-cyan-500/20 shadow-2xl shadow-cyan-500/10 overflow-hidden">
        <div className="p-8 lg:p-12">
          {/* Welcome Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl lg:text-6xl font-bold mb-4 bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent drop-shadow-lg">
              Welcome to Smart Pill Advisor
            </h1>
            <p className="text-lg lg:text-xl text-slate-300 font-medium">
              Your intelligent companion for medication management and health guidance
            </p>
          </motion.div>

          {/* Stats Cards Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-slate-800/60 backdrop-blur-xl rounded-2xl p-6 border border-cyan-500/20 shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/25 transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="text-4xl">💊</div>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
                  className="text-right"
                >
                  <p className="text-3xl font-bold text-cyan-400 drop-shadow-lg">{stats.totalMedicines}</p>
                  <p className="text-sm text-slate-400">Total Medicines</p>
                </motion.div>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '80%' }}
                  transition={{ delay: 0.8, duration: 1 }}
                  className="h-full bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-full shadow-lg shadow-cyan-500/50"
                ></motion.div>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-slate-800/60 backdrop-blur-xl rounded-2xl p-6 border border-pink-500/20 shadow-lg shadow-pink-500/10 hover:shadow-pink-500/25 transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="text-4xl">⚡</div>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.7, type: "spring", stiffness: 200 }}
                  className="text-right"
                >
                  <p className="text-3xl font-bold text-pink-400 drop-shadow-lg">{stats.interactionsChecked}</p>
                  <p className="text-sm text-slate-400">Interactions Checked</p>
                </motion.div>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '65%' }}
                  transition={{ delay: 0.9, duration: 1 }}
                  className="h-full bg-gradient-to-r from-pink-500 to-pink-600 rounded-full shadow-lg shadow-pink-500/50"
                ></motion.div>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-slate-800/60 backdrop-blur-xl rounded-2xl p-6 border border-blue-500/20 shadow-lg shadow-blue-500/10 hover:shadow-blue-500/25 transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="text-4xl">🤖</div>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.8, type: "spring", stiffness: 200 }}
                  className="text-right"
                >
                  <p className="text-3xl font-bold text-blue-400 drop-shadow-lg">{stats.aiConsultations}</p>
                  <p className="text-sm text-slate-400">AI Consultations</p>
                </motion.div>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '75%' }}
                  transition={{ delay: 1.0, duration: 1 }}
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full shadow-lg shadow-blue-500/50"
                ></motion.div>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-slate-800/60 backdrop-blur-xl rounded-2xl p-6 border border-orange-500/20 shadow-lg shadow-orange-500/10 hover:shadow-orange-500/25 transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="text-4xl">⏰</div>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.9, type: "spring", stiffness: 200 }}
                  className="text-right"
                >
                  <p className="text-3xl font-bold text-orange-400 drop-shadow-lg">{stats.upcomingExpiries}</p>
                  <p className="text-sm text-slate-400">Upcoming Expiries</p>
                </motion.div>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '45%' }}
                  transition={{ delay: 1.1, duration: 1 }}
                  className="h-full bg-gradient-to-r from-orange-500 to-orange-600 rounded-full shadow-lg shadow-orange-500/50"
                ></motion.div>
              </div>
            </motion.div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.6 }}
            className="mb-12"
          >
            <h2 className="text-2xl lg:text-3xl font-bold text-center mb-8 bg-gradient-to-r from-cyan-400 to-pink-400 bg-clip-text text-transparent">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {quickActions.map((action, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.3 + idx * 0.1, duration: 0.5 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    href={action.href}
                    className="group bg-slate-800/60 backdrop-blur-xl rounded-2xl p-6 border border-slate-600/20 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-cyan-500/25 block"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${action.bgGradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-2xl`}></div>
                    <div className="relative z-10 text-center">
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        className="text-5xl lg:text-6xl mb-4 group-hover:drop-shadow-lg transition-all duration-300"
                      >
                        {action.icon}
                      </motion.div>
                      <h3 className={`text-lg lg:text-xl font-bold mb-2 bg-gradient-to-r ${action.gradient} bg-clip-text text-transparent`}>
                        {action.title}
                      </h3>
                      <p className="text-slate-400 text-sm mb-4">{action.description}</p>
                      <motion.div
                        className="flex items-center justify-center text-sm font-medium text-slate-500 group-hover:text-slate-300 transition-colors"
                        whileHover={{ x: 5 }}
                      >
                        <span>Get Started</span>
                        <svg className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </motion.div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Charts and Activity Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.8, duration: 0.6 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          >
            {/* Expiry Risk Overview */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-slate-800/60 backdrop-blur-xl rounded-2xl p-6 border border-cyan-500/20 shadow-lg shadow-cyan-500/10"
            >
              <h3 className="text-xl font-bold text-slate-200 mb-6 flex items-center">
                📊 Expiry Risk Overview
              </h3>
              <div className="h-80">
                <Bar
                  data={data}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        titleColor: '#e2e8f0',
                        bodyColor: '#e2e8f0',
                        borderColor: '#06b6d4',
                        borderWidth: 1,
                        callbacks: {
                          label: (context) => `${context.parsed.y} medicines`
                        }
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(100, 116, 139, 0.1)' },
                        ticks: { font: { size: 12, weight: 'bold' }, color: '#94a3b8' }
                      },
                      x: {
                        grid: { display: false },
                        ticks: { font: { size: 12, weight: 'bold' }, color: '#94a3b8' }
                      }
                    },
                    animation: {
                      duration: 1500,
                      easing: 'easeInOutQuart'
                    }
                  }}
                />
              </div>
            </motion.div>

            {/* Recent Activity */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-slate-800/60 backdrop-blur-xl rounded-2xl p-6 border border-pink-500/20 shadow-lg shadow-pink-500/10"
            >
              <h3 className="text-xl font-bold text-slate-200 mb-6 flex items-center">
                📝 Recent Activity
              </h3>
              <div className="space-y-4">
                {recentActivity.length > 0 ? recentActivity.map((activity, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 2.0 + idx * 0.1, duration: 0.5 }}
                    className="flex items-center gap-4 p-4 bg-slate-700/40 rounded-xl hover:bg-slate-700/60 transition-all duration-300 border border-slate-600/20"
                  >
                    <div className="text-3xl p-2 bg-slate-800/60 rounded-xl shadow-lg">{activity.icon}</div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-200">{activity.text}</p>
                      <p className="text-xs text-slate-400 mt-1">{activity.time}</p>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${
                      activity.type === 'success' ? 'bg-green-500 shadow-lg shadow-green-500/50' :
                      activity.type === 'warning' ? 'bg-yellow-500 shadow-lg shadow-yellow-500/50' : 'bg-blue-500 shadow-lg shadow-blue-500/50'
                    } animate-pulse`}></div>
                  </motion.div>
                )) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2.0, duration: 0.5 }}
                    className="text-center py-12"
                  >
                    <div className="text-6xl mb-4">📭</div>
                    <p className="text-slate-400 font-medium">No recent activity</p>
                    <p className="text-sm text-slate-500 mt-2">Start by adding medicines or chatting with AI</p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
