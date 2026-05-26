"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User } from "firebase/auth";

interface TimeSlot {
    id: string;
    label: string;
    time: string;
    hour: number;
    period: string;
    foodRequirement: string;
}

interface ScheduledMedicine {
    medicineId: string;
    medicineName: string;
    dosage: string;
    timeSlot: TimeSlot;
    reason: string;
    foodInstruction: string;
    priority: "critical" | "high" | "medium" | "low";
    category: string;
}

interface ScheduleConflict {
    medicines: string[];
    type: string;
    severity: "critical" | "warning" | "info";
    description: string;
    resolution: string;
}

interface ScheduleWarning {
    medicine: string;
    type: string;
    message: string;
    severity: "critical" | "warning" | "info";
}

interface ScheduleData {
    timeline: ScheduledMedicine[];
    conflicts: ScheduleConflict[];
    warnings: ScheduleWarning[];
    insights: string[];
    score: number;
    calendarSynced: boolean;
    medicineCount: number;
}

interface ScheduleOptimizerComponentProps {
    userId: string;
    user: User;
}

const PRIORITY_CONFIG: Record<string, { gradient: string; border: string; text: string; glow: string; badge: string }> = {
    critical: {
        gradient: "from-red-500/20 to-rose-500/20",
        border: "border-red-500/40",
        text: "text-red-300",
        glow: "shadow-red-500/20",
        badge: "bg-red-500/20 text-red-300 border-red-500/30",
    },
    high: {
        gradient: "from-orange-500/20 to-amber-500/20",
        border: "border-orange-500/30",
        text: "text-orange-300",
        glow: "shadow-orange-500/15",
        badge: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    },
    medium: {
        gradient: "from-blue-500/20 to-cyan-500/20",
        border: "border-blue-500/30",
        text: "text-blue-300",
        glow: "shadow-blue-500/15",
        badge: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    },
    low: {
        gradient: "from-emerald-500/20 to-teal-500/20",
        border: "border-emerald-500/30",
        text: "text-emerald-300",
        glow: "shadow-emerald-500/15",
        badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    },
};

const PERIOD_ICONS: Record<string, string> = {
    morning: "🌅",
    "mid-morning": "☀️",
    afternoon: "🌤️",
    evening: "🌆",
    bedtime: "🌙",
};

const CATEGORY_ICONS: Record<string, string> = {
    Thyroid: "🦋",
    Statin: "❤️",
    PPI: "🫁",
    Diabetes: "💉",
    "Blood Pressure": "🫀",
    "Iron Supplement": "🔴",
    "Calcium Supplement": "🦴",
    Antacid: "🟢",
    Antibiotic: "💊",
    "Blood Thinner": "🩸",
    NSAID: "💚",
    "Sleep Aid": "😴",
    "Vitamin D": "☀️",
    "Vitamin/Supplement": "🌿",
    Corticosteroid: "⚡",
    Insulin: "💉",
    Analgesic: "💊",
    General: "💊",
};

export default function ScheduleOptimizerComponent({ userId, user }: ScheduleOptimizerComponentProps) {
    const [scheduleData, setScheduleData] = useState<ScheduleData | null>(null);
    const [loading, setLoading] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeFilter, setActiveFilter] = useState<string>("all");
    const [expandedSlot, setExpandedSlot] = useState<string | null>(null);

    const fetchSchedule = useCallback(async (syncToCalendar = false) => {
        if (syncToCalendar) {
            setSyncing(true);
        } else {
            setLoading(true);
        }
        setError(null);

        try {
            const token = await user.getIdToken();
            const response = await fetch("/api/schedule-optimizer", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ syncToCalendar }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to generate schedule");
            }

            const data = await response.json();
            setScheduleData(data);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to generate optimized schedule");
        } finally {
            setLoading(false);
            setSyncing(false);
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            fetchSchedule();
        }
    }, [user, fetchSchedule]);

    const groupedTimeline = scheduleData?.timeline.reduce((acc, item) => {
        const key = item.timeSlot.id;
        if (!acc[key]) {
            acc[key] = {
                slot: item.timeSlot,
                medicines: [],
            };
        }
        acc[key].medicines.push(item);
        return acc;
    }, {} as Record<string, { slot: TimeSlot; medicines: ScheduledMedicine[] }>);

    const filteredGroups = groupedTimeline
        ? Object.entries(groupedTimeline).filter(([, group]) => {
            if (activeFilter === "all") return true;
            return group.medicines.some(m => m.priority === activeFilter);
        })
        : [];

    const getScoreColor = (score: number) => {
        if (score >= 80) return "text-emerald-400";
        if (score >= 60) return "text-amber-400";
        return "text-red-400";
    };

    const getScoreGradient = (score: number) => {
        if (score >= 80) return "from-emerald-500 to-teal-500";
        if (score >= 60) return "from-amber-500 to-orange-500";
        return "from-red-500 to-rose-500";
    };

    if (loading) {
        return (
            <div className="text-center py-16">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-20 h-20 border-4 border-teal-500 border-t-transparent rounded-full mx-auto mb-6"
                />
                <h3 className="text-2xl font-bold text-slate-200 mb-3">Optimizing Your Schedule</h3>
                <p className="text-slate-400 text-lg">Analyzing pharmacokinetics and resolving conflicts...</p>
                <div className="mt-6 flex justify-center gap-2">
                    {["💊", "⏰", "🧪", "✨"].map((emoji, idx) => (
                        <motion.span
                            key={idx}
                            animate={{ y: [0, -10, 0] }}
                            transition={{ delay: idx * 0.2, duration: 1, repeat: Infinity }}
                            className="text-2xl"
                        >
                            {emoji}
                        </motion.span>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-16">
                <div className="text-7xl mb-6">⚠️</div>
                <h3 className="text-2xl font-bold text-red-300 mb-3">Schedule Error</h3>
                <p className="text-slate-400 mb-8 text-lg">{error}</p>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => fetchSchedule()}
                    className="px-8 py-4 bg-gradient-to-r from-teal-500 to-cyan-600 text-white font-bold rounded-2xl hover:from-teal-600 hover:to-cyan-700 transition-all duration-300 shadow-xl hover:shadow-2xl"
                >
                    🔄 Retry
                </motion.button>
            </div>
        );
    }

    if (!scheduleData) {
        return (
            <div className="text-center py-16">
                <div className="text-7xl mb-6">⏰</div>
                <h3 className="text-2xl font-bold text-slate-200 mb-3">Schedule Optimizer</h3>
                <p className="text-slate-400 text-lg">No schedule data available</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6 }}
                className="text-center"
            >
                <h2 className="text-3xl lg:text-4xl font-bold mb-3 bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent drop-shadow-lg">
                    ⏰ Medication Schedule Optimizer
                </h2>
                <p className="text-lg text-slate-300 font-medium">
                    AI-Powered Pharmacokinetics-Based Daily Timeline
                </p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="grid grid-cols-1 md:grid-cols-4 gap-4"
            >
                <motion.div whileHover={{ scale: 1.05 }} className="bg-gradient-to-br from-teal-500/20 to-cyan-500/20 rounded-2xl p-5 border border-teal-500/30">
                    <div className={`text-3xl font-bold ${getScoreColor(scheduleData.score)} mb-1`}>
                        {scheduleData.score}/100
                    </div>
                    <div className="text-sm text-slate-300">Schedule Score</div>
                    <div className="mt-2 w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${scheduleData.score}%` }}
                            transition={{ delay: 0.5, duration: 1.2 }}
                            className={`h-full bg-gradient-to-r ${getScoreGradient(scheduleData.score)} rounded-full`}
                        />
                    </div>
                </motion.div>

                <motion.div whileHover={{ scale: 1.05 }} className="bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-2xl p-5 border border-blue-500/30">
                    <div className="text-3xl font-bold text-blue-300 mb-1">{scheduleData.medicineCount}</div>
                    <div className="text-sm text-slate-300">Medications</div>
                    <div className="text-xs text-slate-400 mt-1">Analyzed & scheduled</div>
                </motion.div>

                <motion.div whileHover={{ scale: 1.05 }} className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl p-5 border border-purple-500/30">
                    <div className="text-3xl font-bold text-purple-300 mb-1">{scheduleData.timeline.length}</div>
                    <div className="text-sm text-slate-300">Time Slots</div>
                    <div className="text-xs text-slate-400 mt-1">Daily dose events</div>
                </motion.div>

                <motion.div whileHover={{ scale: 1.05 }} className={`bg-gradient-to-br ${scheduleData.conflicts.length > 0 ? "from-amber-500/20 to-orange-500/20 border-amber-500/30" : "from-emerald-500/20 to-green-500/20 border-emerald-500/30"} rounded-2xl p-5 border`}>
                    <div className={`text-3xl font-bold ${scheduleData.conflicts.length > 0 ? "text-amber-300" : "text-emerald-300"} mb-1`}>
                        {scheduleData.conflicts.length}
                    </div>
                    <div className="text-sm text-slate-300">Conflicts</div>
                    <div className="text-xs text-slate-400 mt-1">
                        {scheduleData.conflicts.length > 0 ? "Review recommended" : "All clear"}
                    </div>
                </motion.div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="flex flex-wrap gap-2 justify-center"
            >
                {["all", "critical", "high", "medium", "low"].map(filter => (
                    <motion.button
                        key={filter}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setActiveFilter(filter)}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 border ${activeFilter === filter
                                ? "bg-teal-500/30 border-teal-400/50 text-teal-300 shadow-lg shadow-teal-500/20"
                                : "bg-slate-800/60 border-slate-600/30 text-slate-400 hover:border-slate-500/50 hover:text-slate-300"
                            }`}
                    >
                        {filter === "all" ? "📋 All" : filter === "critical" ? "🔴 Critical" : filter === "high" ? "🟠 High" : filter === "medium" ? "🔵 Medium" : "🟢 Low"}
                    </motion.button>
                ))}
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="relative"
            >
                <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-teal-500/50 via-cyan-500/30 to-purple-500/50 hidden md:block" />

                <div className="space-y-4">
                    <AnimatePresence>
                        {filteredGroups.map(([slotId, group], idx) => (
                            <motion.div
                                key={slotId}
                                initial={{ opacity: 0, x: -30 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 30 }}
                                transition={{ delay: 0.1 * idx, duration: 0.5 }}
                                className="relative"
                            >
                                <div className="absolute left-6 top-6 w-4 h-4 rounded-full bg-teal-500 border-2 border-slate-900 z-10 shadow-lg shadow-teal-500/50 hidden md:block" />

                                <div
                                    className="md:ml-16 bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-600/30 overflow-hidden hover:border-teal-500/30 transition-all duration-300 cursor-pointer"
                                    onClick={() => setExpandedSlot(expandedSlot === slotId ? null : slotId)}
                                >
                                    <div className="p-5 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="text-3xl">{PERIOD_ICONS[group.slot.period] || "⏰"}</div>
                                            <div>
                                                <div className="font-bold text-lg text-slate-200">{group.slot.label}</div>
                                                <div className="text-teal-400 font-semibold text-sm">{group.slot.time}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="bg-slate-700/60 px-3 py-1 rounded-full text-xs font-semibold text-slate-300">
                                                {group.medicines.length} {group.medicines.length === 1 ? "med" : "meds"}
                                            </div>
                                            <motion.div
                                                animate={{ rotate: expandedSlot === slotId ? 180 : 0 }}
                                                transition={{ duration: 0.3 }}
                                                className="text-slate-400"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </motion.div>
                                        </div>
                                    </div>

                                    <div className="px-5 pb-2 flex flex-wrap gap-2">
                                        {group.medicines.map((med, mIdx) => {
                                            const config = PRIORITY_CONFIG[med.priority] || PRIORITY_CONFIG.medium;
                                            return (
                                                <span
                                                    key={mIdx}
                                                    className={`px-3 py-1 rounded-lg text-xs font-semibold border ${config.badge}`}
                                                >
                                                    {CATEGORY_ICONS[med.category] || "💊"} {med.medicineName}
                                                </span>
                                            );
                                        })}
                                    </div>

                                    <AnimatePresence>
                                        {expandedSlot === slotId && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.3 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="px-5 pb-5 space-y-3 border-t border-slate-700/50 pt-4">
                                                    {group.medicines.map((med, mIdx) => {
                                                        const config = PRIORITY_CONFIG[med.priority] || PRIORITY_CONFIG.medium;
                                                        return (
                                                            <motion.div
                                                                key={mIdx}
                                                                initial={{ opacity: 0, y: 10 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                transition={{ delay: mIdx * 0.1 }}
                                                                className={`bg-gradient-to-br ${config.gradient} rounded-xl p-4 border ${config.border} shadow-lg ${config.glow}`}
                                                            >
                                                                <div className="flex items-start justify-between mb-2">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-xl">{CATEGORY_ICONS[med.category] || "💊"}</span>
                                                                        <div>
                                                                            <div className="font-bold text-slate-200">{med.medicineName}</div>
                                                                            <div className="text-xs text-slate-400">{med.dosage} · {med.category}</div>
                                                                        </div>
                                                                    </div>
                                                                    <span className={`px-2 py-0.5 rounded-md text-xs font-bold border ${config.badge} uppercase`}>
                                                                        {med.priority}
                                                                    </span>
                                                                </div>
                                                                <div className="space-y-1.5 text-sm">
                                                                    <div className="flex items-center gap-2 text-slate-300">
                                                                        <span className="text-amber-400">🍽️</span>
                                                                        <span>{med.foodInstruction}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2 text-slate-400">
                                                                        <span className="text-cyan-400">📋</span>
                                                                        <span>{med.reason}</span>
                                                                    </div>
                                                                </div>
                                                            </motion.div>
                                                        );
                                                    })}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </motion.div>

            {scheduleData.conflicts.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.6 }}
                    className="bg-slate-800/60 backdrop-blur-xl rounded-2xl p-6 border border-amber-500/30 shadow-lg shadow-amber-500/10"
                >
                    <h3 className="text-xl font-bold text-amber-300 mb-4 flex items-center gap-2">
                        ⚠️ Detected Conflicts
                    </h3>
                    <div className="space-y-3">
                        {scheduleData.conflicts.map((conflict, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.7 + idx * 0.1, duration: 0.5 }}
                                className={`p-4 rounded-xl border ${conflict.severity === "critical"
                                        ? "bg-red-500/10 border-red-500/30"
                                        : conflict.severity === "warning"
                                            ? "bg-amber-500/10 border-amber-500/30"
                                            : "bg-blue-500/10 border-blue-500/30"
                                    }`}
                            >
                                <div className="flex items-start gap-3">
                                    <span className="text-lg mt-0.5">
                                        {conflict.severity === "critical" ? "🔴" : conflict.severity === "warning" ? "🟡" : "🔵"}
                                    </span>
                                    <div className="flex-1">
                                        <div className="font-bold text-slate-200 mb-1">
                                            {conflict.medicines.join(" ↔ ")}
                                        </div>
                                        <div className="text-sm text-slate-300 mb-2">{conflict.description}</div>
                                        <div className="text-sm text-emerald-400 flex items-center gap-1">
                                            <span>✅</span> {conflict.resolution}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            )}

            {scheduleData.warnings.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7, duration: 0.6 }}
                    className="bg-slate-800/60 backdrop-blur-xl rounded-2xl p-6 border border-slate-600/30"
                >
                    <h3 className="text-xl font-bold text-slate-200 mb-4 flex items-center gap-2">
                        📌 Important Notes
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {scheduleData.warnings.slice(0, 6).map((warning, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.8 + idx * 0.05, duration: 0.4 }}
                                className={`p-3 rounded-xl border text-sm ${warning.severity === "critical"
                                        ? "bg-red-500/10 border-red-500/20 text-red-200"
                                        : warning.severity === "warning"
                                            ? "bg-amber-500/10 border-amber-500/20 text-amber-200"
                                            : "bg-slate-700/40 border-slate-600/20 text-slate-300"
                                    }`}
                            >
                                <span className="font-semibold">{warning.medicine}:</span> {warning.message}
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            )}

            {scheduleData.insights.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, duration: 0.6 }}
                    className="bg-slate-800/60 backdrop-blur-xl rounded-2xl p-6 border border-cyan-500/20 shadow-lg shadow-cyan-500/10"
                >
                    <h3 className="text-xl font-bold text-slate-200 mb-4 flex items-center gap-2">
                        🤖 AI Pharmacist Insights
                    </h3>
                    <div className="space-y-3">
                        {scheduleData.insights.map((insight, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.9 + idx * 0.1, duration: 0.5 }}
                                className="flex items-start gap-3 p-4 bg-slate-700/40 rounded-xl border border-slate-600/20"
                            >
                                <span className="text-cyan-400 font-bold mt-0.5">💡</span>
                                <p className="text-slate-300 text-sm leading-relaxed">{insight}</p>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            )}

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.0, duration: 0.6 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => fetchSchedule(false)}
                    disabled={loading}
                    className="px-8 py-4 bg-gradient-to-r from-teal-500 to-cyan-600 text-white font-bold rounded-2xl hover:from-teal-600 hover:to-cyan-700 transition-all duration-300 shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed border border-teal-400/20"
                >
                    {loading ? (
                        <div className="flex items-center gap-3">
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Recalculating...</span>
                        </div>
                    ) : (
                        <>🔄 Regenerate Schedule</>
                    )}
                </motion.button>

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => fetchSchedule(true)}
                    disabled={syncing}
                    className="px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-2xl hover:from-indigo-600 hover:to-purple-700 transition-all duration-300 shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed border border-indigo-400/20"
                >
                    {syncing ? (
                        <div className="flex items-center gap-3">
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Syncing...</span>
                        </div>
                    ) : (
                        <>📅 Sync to Google Calendar</>
                    )}
                </motion.button>
            </motion.div>

            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.1 }}
                className="text-center text-xs text-slate-500"
            >
                Schedule is generated based on pharmacokinetics guidelines. Always consult your healthcare provider before making changes to your medication routine.
            </motion.p>
        </div>
    );
}
