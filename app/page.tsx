"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
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

type RiskData = { labels: string[]; values: number[] };

export default function HomePage() {
  const [risk, setRisk] = useState<RiskData>({ labels: [], values: [] });

  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => r.json())
      .then((d) => setRisk(d.risk))
      .catch(() => {});
  }, []);

  const data = {
    labels: risk.labels.length ? risk.labels : ['Safe', 'Warning', 'Critical'],
    datasets: [
      {
        label: "Expiry Risk (count)",
        data: risk.values.length ? risk.values : [0, 0, 0],
        backgroundColor: ["#22c55e", "#f59e0b", "#ef4444"],
        borderRadius: 8,
      },
    ],
  };

  const features = [
    {
      icon: "💊",
      title: "Drug Interaction Checker",
      description: "Check potential interactions between multiple medications",
      href: "/interactions",
      gradient: "from-purple-600 to-blue-600",
      bgGradient: "from-purple-50 to-blue-50"
    },
    {
      icon: "📱",
      title: "Medicine Scanner",
      description: "Scan medicine labels to track expiry dates automatically",
      href: "/scan",
      gradient: "from-emerald-600 to-teal-600",
      bgGradient: "from-emerald-50 to-teal-50"
    },
    {
      icon: "🤖",
      title: "AI Medical Assistant",
      description: "Get instant answers to your medical questions",
      href: "/chat",
      gradient: "from-pink-600 to-purple-600",
      bgGradient: "from-pink-50 to-purple-50"
    },
  ];

  const stats = [
    { label: "Medicines Tracked", value: "0", icon: "💊", color: "text-purple-600" },
    { label: "Interactions Checked", value: "0", icon: "⚡", color: "text-blue-600" },
    { label: "AI Consultations", value: "0", icon: "🤖", color: "text-pink-600" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-blue-600 to-pink-600 text-white py-20 px-6">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-7xl mx-auto">
          <div className="text-center space-y-6">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
              Smart Pill Advisory
            </h1>
            <p className="text-xl md:text-2xl text-purple-100 max-w-3xl mx-auto">
              Your intelligent companion for medication management, drug interactions, and medical guidance
            </p>
            <div className="flex flex-wrap justify-center gap-4 pt-4">
              <Link
                href="/interactions"
                className="px-8 py-4 bg-white text-purple-600 rounded-full font-semibold text-lg hover:bg-purple-50 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                Check Interactions →
              </Link>
              <Link
                href="/chat"
                className="px-8 py-4 bg-purple-500 bg-opacity-30 backdrop-blur-sm text-white rounded-full font-semibold text-lg hover:bg-opacity-40 transition-all border-2 border-white border-opacity-30"
              >
                Ask AI Assistant
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="max-w-7xl mx-auto px-6 -mt-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat, idx) => (
            <div key={idx} className="bg-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">{stat.label}</p>
                  <p className={`text-4xl font-bold ${stat.color} mt-2`}>{stat.value}</p>
                </div>
                <div className="text-5xl">{stat.icon}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Powerful Features
          </h2>
          <p className="text-gray-600 mt-3 text-lg">Everything you need for safe medication management</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, idx) => (
            <Link
              key={idx}
              href={feature.href}
              className="group relative overflow-hidden bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-2 duration-300"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
              <div className="relative p-8 space-y-4">
                <div className="text-6xl">{feature.icon}</div>
                <h3 className={`text-2xl font-bold bg-gradient-to-r ${feature.gradient} bg-clip-text text-transparent`}>
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                <div className={`inline-flex items-center gap-2 text-sm font-semibold bg-gradient-to-r ${feature.gradient} bg-clip-text text-transparent`}>
                  Explore <span className="group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Analytics Section */}
      <section className="max-w-7xl mx-auto px-6 pb-16">
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-6">
            Medicine Expiry Overview
          </h2>
          <div className="h-80">
            <Bar 
              data={data} 
              options={{ 
                responsive: true, 
                maintainAspectRatio: false,
                plugins: { 
                  legend: { 
                    position: "bottom",
                    labels: {
                      font: { size: 14 },
                      padding: 20
                    }
                  } 
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    grid: {
                      color: 'rgba(0, 0, 0, 0.05)'
                    }
                  },
                  x: {
                    grid: {
                      display: false
                    }
                  }
                }
              }} 
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-6 pb-20">
        <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-pink-600 rounded-3xl shadow-2xl p-12 text-center text-white">
          <h2 className="text-4xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
            Take control of your medication management with our intelligent platform
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/scan"
              className="px-8 py-4 bg-white text-purple-600 rounded-full font-semibold text-lg hover:bg-purple-50 transition-all shadow-lg hover:shadow-xl"
            >
              Scan Your First Medicine
            </Link>
            <Link
              href="/interactions"
              className="px-8 py-4 bg-purple-500 bg-opacity-30 backdrop-blur-sm text-white rounded-full font-semibold text-lg hover:bg-opacity-40 transition-all border-2 border-white border-opacity-30"
            >
              Check Drug Interactions
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
