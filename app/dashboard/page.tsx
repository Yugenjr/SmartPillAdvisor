"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
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
      // Fetch medicines
      const medicinesQuery = query(
        collection(db, 'medicines'),
        where('userId', '==', user.uid)
      );
      const medicinesSnapshot = await getDocs(medicinesQuery);
      const medicines = medicinesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

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

      // Fetch chat sessions
      const chatQuery = query(
        collection(db, 'chatSessions'),
        where('userId', '==', user.uid)
      );
      const chatSnapshot = await getDocs(chatQuery);

      // Fetch interaction checks (from a hypothetical interactions collection)
      const interactionsQuery = query(
        collection(db, 'interactionChecks'),
        where('userId', '==', user.uid)
      );
      const interactionsSnapshot = await getDocs(interactionsQuery);

      setStats({
        totalMedicines: medicines.length,
        interactionsChecked: interactionsSnapshot.size,
        aiConsultations: chatSnapshot.size,
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
      chatSnapshot.docs.slice(0, 1).forEach(doc => {
        const data = doc.data();
        activities.push({
          icon: "🤖",
          text: "AI Consultation",
          time: getTimeAgo(data.createdAt || new Date().toISOString()),
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
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-pink-600 rounded-3xl p-8 text-white shadow-xl">
        <h1 className="text-3xl font-bold mb-2">Welcome to Your Dashboard! 👋</h1>
        <p className="text-purple-100">Manage your medications and health with ease</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="text-4xl">💊</div>
            <div className="text-right">
              <p className="text-3xl font-bold text-purple-600">{stats.totalMedicines}</p>
              <p className="text-sm text-gray-600">Total Medicines</p>
            </div>
          </div>
          <div className="h-2 bg-purple-100 rounded-full overflow-hidden">
            <div className="h-full w-3/4 bg-gradient-to-r from-purple-500 to-blue-500"></div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="text-4xl">⚡</div>
            <div className="text-right">
              <p className="text-3xl font-bold text-blue-600">{stats.interactionsChecked}</p>
              <p className="text-sm text-gray-600">Interactions Checked</p>
            </div>
          </div>
          <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
            <div className="h-full w-1/2 bg-gradient-to-r from-blue-500 to-cyan-500"></div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="text-4xl">🤖</div>
            <div className="text-right">
              <p className="text-3xl font-bold text-pink-600">{stats.aiConsultations}</p>
              <p className="text-sm text-gray-600">AI Consultations</p>
            </div>
          </div>
          <div className="h-2 bg-pink-100 rounded-full overflow-hidden">
            <div className="h-full w-2/3 bg-gradient-to-r from-pink-500 to-purple-500"></div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="text-4xl">⏰</div>
            <div className="text-right">
              <p className="text-3xl font-bold text-orange-600">{stats.upcomingExpiries}</p>
              <p className="text-sm text-gray-600">Upcoming Expiries</p>
            </div>
          </div>
          <div className="h-2 bg-orange-100 rounded-full overflow-hidden">
            <div className="h-full w-1/4 bg-gradient-to-r from-orange-500 to-red-500"></div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action, idx) => (
            <Link
              key={idx}
              href={action.href}
              className="group relative overflow-hidden bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-1 duration-300"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${action.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
              <div className="relative p-6">
                <div className="text-5xl mb-4">{action.icon}</div>
                <h3 className={`text-xl font-bold mb-2 bg-gradient-to-r ${action.gradient} bg-clip-text text-transparent`}>
                  {action.title}
                </h3>
                <p className="text-gray-600 text-sm">{action.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Expiry Risk Overview</h3>
          <div className="h-64">
            <Bar
              data={data}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                },
                scales: {
                  y: { beginAtZero: true, grid: { color: 'rgba(0, 0, 0, 0.05)' } },
                  x: { grid: { display: false } }
                }
              }}
            />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {recentActivity.map((activity, idx) => (
              <div key={idx} className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <div className="text-3xl">{activity.icon}</div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">{activity.text}</p>
                  <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
