"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { motion } from "framer-motion";
import ScheduleOptimizerComponent from "@/components/ScheduleOptimizerComponent";

export default function SchedulePage() {
    const { user } = useAuth();
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        if (user) {
            setIsReady(true);
        }
    }, [user]);

    if (!user || !isReady) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-center min-h-[60vh]"
            >
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4 shadow-lg shadow-teal-500/25"></div>
                    <p className="text-slate-300">Loading Schedule Optimizer...</p>
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
            <div className="bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-teal-500/20 shadow-2xl shadow-teal-500/10 overflow-hidden">
                <div className="p-8 lg:p-12">
                    <ScheduleOptimizerComponent userId={user.uid} user={user} />
                </div>
            </div>
        </motion.div>
    );
}
