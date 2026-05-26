import { Groq } from "groq-sdk";

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

export interface MedicineInput {
    _id: string;
    name: string;
    dosage: string;
    frequency?: string;
    condition?: string;
    severity?: string;
    price?: number;
    duration?: number;
    createdAt: Date;
    expiryDate?: Date;
    purchaseDate?: Date;
}

export interface TimeSlot {
    id: string;
    label: string;
    time: string;
    hour: number;
    period: "morning" | "mid-morning" | "afternoon" | "evening" | "bedtime";
    foodRequirement: "before_meal" | "with_meal" | "after_meal" | "empty_stomach" | "any";
}

export interface ScheduledMedicine {
    medicineId: string;
    medicineName: string;
    dosage: string;
    timeSlot: TimeSlot;
    reason: string;
    foodInstruction: string;
    priority: "critical" | "high" | "medium" | "low";
    category: string;
}

export interface ScheduleConflict {
    medicines: string[];
    type: "interaction" | "timing" | "absorption";
    severity: "critical" | "warning" | "info";
    description: string;
    resolution: string;
}

export interface ScheduleWarning {
    medicine: string;
    type: "timing" | "food" | "spacing" | "general";
    message: string;
    severity: "critical" | "warning" | "info";
}

export interface OptimizedSchedule {
    timeline: ScheduledMedicine[];
    conflicts: ScheduleConflict[];
    warnings: ScheduleWarning[];
    insights: string[];
    score: number;
}

interface DrugRule {
    keywords: string[];
    category: string;
    preferredPeriod: string[];
    foodRequirement: "before_meal" | "with_meal" | "after_meal" | "empty_stomach" | "any";
    conflictGroups: string[];
    minSpacingHours: number;
    reason: string;
    priority: "critical" | "high" | "medium" | "low";
    foodInstruction: string;
}

const TIME_SLOTS: TimeSlot[] = [
    { id: "early_morning", label: "Early Morning", time: "6:00 AM", hour: 6, period: "morning", foodRequirement: "empty_stomach" },
    { id: "morning", label: "Morning", time: "8:00 AM", hour: 8, period: "morning", foodRequirement: "with_meal" },
    { id: "mid_morning", label: "Mid-Morning", time: "10:00 AM", hour: 10, period: "mid-morning", foodRequirement: "any" },
    { id: "afternoon", label: "Afternoon", time: "12:30 PM", hour: 12, period: "afternoon", foodRequirement: "with_meal" },
    { id: "late_afternoon", label: "Late Afternoon", time: "3:00 PM", hour: 15, period: "afternoon", foodRequirement: "any" },
    { id: "evening", label: "Evening", time: "6:30 PM", hour: 18, period: "evening", foodRequirement: "with_meal" },
    { id: "bedtime", label: "Bedtime", time: "9:30 PM", hour: 21, period: "bedtime", foodRequirement: "any" },
];

const PHARMACOKINETICS_RULES: DrugRule[] = [
    {
        keywords: ["levothyroxine", "thyroid", "synthroid", "eltroxin", "thyroxine"],
        category: "Thyroid",
        preferredPeriod: ["morning"],
        foodRequirement: "empty_stomach",
        conflictGroups: ["calcium", "iron", "antacid"],
        minSpacingHours: 4,
        reason: "Thyroid medications require empty stomach for optimal absorption",
        priority: "critical",
        foodInstruction: "Take on empty stomach, 30-60 minutes before breakfast"
    },
    {
        keywords: ["atorvastatin", "rosuvastatin", "simvastatin", "statin", "lovastatin", "pravastatin"],
        category: "Statin",
        preferredPeriod: ["bedtime", "evening"],
        foodRequirement: "any",
        conflictGroups: ["grapefruit"],
        minSpacingHours: 0,
        reason: "Cholesterol synthesis peaks at night, statins are most effective at bedtime",
        priority: "high",
        foodInstruction: "Can be taken with or without food"
    },
    {
        keywords: ["omeprazole", "pantoprazole", "esomeprazole", "lansoprazole", "rabeprazole", "ppi", "proton pump"],
        category: "PPI",
        preferredPeriod: ["morning"],
        foodRequirement: "before_meal",
        conflictGroups: [],
        minSpacingHours: 0,
        reason: "PPIs work best when taken 30 minutes before breakfast",
        priority: "high",
        foodInstruction: "Take 30 minutes before meals"
    },
    {
        keywords: ["metformin", "glucophage"],
        category: "Diabetes",
        preferredPeriod: ["morning", "evening"],
        foodRequirement: "with_meal",
        conflictGroups: [],
        minSpacingHours: 0,
        reason: "Taking with meals reduces GI side effects",
        priority: "high",
        foodInstruction: "Take with meals to reduce stomach upset"
    },
    {
        keywords: ["amlodipine", "lisinopril", "enalapril", "losartan", "valsartan", "ramipril", "telmisartan"],
        category: "Blood Pressure",
        preferredPeriod: ["morning"],
        foodRequirement: "any",
        conflictGroups: ["potassium"],
        minSpacingHours: 0,
        reason: "Morning dosing aligns with natural blood pressure rhythm",
        priority: "high",
        foodInstruction: "Can be taken with or without food"
    },
    {
        keywords: ["iron", "ferrous", "ferric", "fer-in-sol"],
        category: "Iron Supplement",
        preferredPeriod: ["mid-morning"],
        foodRequirement: "empty_stomach",
        conflictGroups: ["calcium", "antacid", "thyroid", "dairy"],
        minSpacingHours: 2,
        reason: "Iron is best absorbed on empty stomach, must be separated from calcium and antacids",
        priority: "high",
        foodInstruction: "Take on empty stomach with vitamin C for better absorption"
    },
    {
        keywords: ["calcium", "caltrate", "citracal", "oscal"],
        category: "Calcium Supplement",
        preferredPeriod: ["afternoon", "evening"],
        foodRequirement: "with_meal",
        conflictGroups: ["iron", "thyroid"],
        minSpacingHours: 2,
        reason: "Calcium must be separated from iron and thyroid medications by at least 2 hours",
        priority: "medium",
        foodInstruction: "Take with meals for better absorption"
    },
    {
        keywords: ["antacid", "tums", "maalox", "ranitidine", "famotidine"],
        category: "Antacid",
        preferredPeriod: ["afternoon", "evening"],
        foodRequirement: "after_meal",
        conflictGroups: ["iron", "thyroid", "antibiotic"],
        minSpacingHours: 2,
        reason: "Antacids can reduce absorption of many other medications",
        priority: "medium",
        foodInstruction: "Take after meals or when symptoms occur"
    },
    {
        keywords: ["amoxicillin", "azithromycin", "ciprofloxacin", "levofloxacin", "antibiotic", "cephalexin", "doxycycline"],
        category: "Antibiotic",
        preferredPeriod: ["morning", "evening"],
        foodRequirement: "any",
        conflictGroups: ["antacid", "dairy", "calcium"],
        minSpacingHours: 2,
        reason: "Antibiotics need consistent spacing and must avoid antacids/dairy",
        priority: "critical",
        foodInstruction: "Space doses evenly throughout the day"
    },
    {
        keywords: ["aspirin", "ecosprin"],
        category: "Blood Thinner",
        preferredPeriod: ["morning"],
        foodRequirement: "with_meal",
        conflictGroups: ["ibuprofen", "nsaid"],
        minSpacingHours: 0,
        reason: "Low-dose aspirin is typically taken in the morning with food to reduce GI irritation",
        priority: "high",
        foodInstruction: "Take with food to reduce stomach irritation"
    },
    {
        keywords: ["ibuprofen", "naproxen", "diclofenac", "nsaid", "piroxicam"],
        category: "NSAID",
        preferredPeriod: ["afternoon"],
        foodRequirement: "after_meal",
        conflictGroups: ["aspirin", "blood_thinner"],
        minSpacingHours: 0,
        reason: "NSAIDs should be taken after meals to minimize GI side effects",
        priority: "medium",
        foodInstruction: "Take after meals with a full glass of water"
    },
    {
        keywords: ["melatonin", "sleep", "zolpidem", "eszopiclone"],
        category: "Sleep Aid",
        preferredPeriod: ["bedtime"],
        foodRequirement: "empty_stomach",
        conflictGroups: [],
        minSpacingHours: 0,
        reason: "Sleep medications should be taken 30 minutes before bedtime",
        priority: "medium",
        foodInstruction: "Take 30 minutes before bedtime on empty stomach"
    },
    {
        keywords: ["vitamin d", "cholecalciferol", "ergocalciferol", "d3"],
        category: "Vitamin D",
        preferredPeriod: ["morning", "afternoon"],
        foodRequirement: "with_meal",
        conflictGroups: [],
        minSpacingHours: 0,
        reason: "Fat-soluble vitamins absorb better with meals containing some fat",
        priority: "low",
        foodInstruction: "Take with a meal containing healthy fats"
    },
    {
        keywords: ["multivitamin", "vitamin", "supplement", "b-complex", "b12", "folic"],
        category: "Vitamin/Supplement",
        preferredPeriod: ["morning"],
        foodRequirement: "with_meal",
        conflictGroups: [],
        minSpacingHours: 0,
        reason: "Vitamins are best absorbed with breakfast",
        priority: "low",
        foodInstruction: "Take with breakfast for optimal absorption"
    },
    {
        keywords: ["prednisone", "prednisolone", "methylprednisolone", "corticosteroid", "steroid", "dexamethasone"],
        category: "Corticosteroid",
        preferredPeriod: ["morning"],
        foodRequirement: "with_meal",
        conflictGroups: ["nsaid"],
        minSpacingHours: 0,
        reason: "Morning dosing mimics the body's natural cortisol rhythm",
        priority: "high",
        foodInstruction: "Take with breakfast to reduce stomach irritation"
    },
    {
        keywords: ["insulin", "glargine", "lispro", "aspart"],
        category: "Insulin",
        preferredPeriod: ["morning", "evening"],
        foodRequirement: "before_meal",
        conflictGroups: [],
        minSpacingHours: 0,
        reason: "Insulin timing is critical and must align with meals",
        priority: "critical",
        foodInstruction: "Inject 15-30 minutes before meals"
    },
    {
        keywords: ["paracetamol", "acetaminophen", "tylenol", "crocin", "dolo"],
        category: "Analgesic",
        preferredPeriod: ["morning", "afternoon", "evening"],
        foodRequirement: "any",
        conflictGroups: [],
        minSpacingHours: 4,
        reason: "Space doses evenly with minimum 4-6 hour gap",
        priority: "medium",
        foodInstruction: "Can be taken with or without food"
    },
];

class ScheduleOptimizerEngine {
    private matchDrugRule(medicineName: string): DrugRule | null {
        const nameLower = medicineName.toLowerCase();
        for (const rule of PHARMACOKINETICS_RULES) {
            if (rule.keywords.some(keyword => nameLower.includes(keyword))) {
                return rule;
            }
        }
        return null;
    }

    private parseFrequency(frequency: string): number {
        const freq = frequency.toLowerCase();
        if (freq.includes("twice") || freq.includes("2")) return 2;
        if (freq.includes("three") || freq.includes("3")) return 3;
        if (freq.includes("four") || freq.includes("4")) return 4;
        if (freq.includes("weekly") || freq.includes("week")) return 0.14;
        return 1;
    }

    private getTimeSlotsForFrequency(frequency: number, preferredPeriods: string[]): TimeSlot[] {
        const allMatchingSlots = TIME_SLOTS.filter(slot =>
            preferredPeriods.includes(slot.period)
        );

        if (frequency <= 1) {
            return allMatchingSlots.length > 0 ? [allMatchingSlots[0]] : [TIME_SLOTS[1]];
        }

        if (frequency === 2) {
            const morningSlot = TIME_SLOTS.find(s => s.period === "morning") || TIME_SLOTS[1];
            const eveningSlot = TIME_SLOTS.find(s => s.period === "evening") || TIME_SLOTS[5];
            return [morningSlot, eveningSlot];
        }

        if (frequency === 3) {
            return [
                TIME_SLOTS.find(s => s.period === "morning") || TIME_SLOTS[1],
                TIME_SLOTS.find(s => s.period === "afternoon") || TIME_SLOTS[3],
                TIME_SLOTS.find(s => s.period === "bedtime") || TIME_SLOTS[6],
            ];
        }

        return [TIME_SLOTS[0], TIME_SLOTS[2], TIME_SLOTS[4], TIME_SLOTS[6]].slice(0, Math.min(frequency, 4));
    }

    private detectConflicts(scheduledMeds: ScheduledMedicine[], medicines: MedicineInput[]): ScheduleConflict[] {
        const conflicts: ScheduleConflict[] = [];
        const processedPairs = new Set<string>();

        for (let i = 0; i < scheduledMeds.length; i++) {
            for (let j = i + 1; j < scheduledMeds.length; j++) {
                const med1 = scheduledMeds[i];
                const med2 = scheduledMeds[j];

                const pairKey = [med1.medicineName, med2.medicineName].sort().join("|");
                if (processedPairs.has(pairKey)) continue;
                processedPairs.add(pairKey);

                const rule1 = this.matchDrugRule(med1.medicineName);
                const rule2 = this.matchDrugRule(med2.medicineName);

                if (rule1 && rule2) {
                    const hasConflict = rule1.conflictGroups.some(group =>
                        rule2.keywords.some(kw => kw.includes(group)) || rule2.category.toLowerCase().includes(group)
                    ) || rule2.conflictGroups.some(group =>
                        rule1.keywords.some(kw => kw.includes(group)) || rule1.category.toLowerCase().includes(group)
                    );

                    if (hasConflict) {
                        const timeDiff = Math.abs(med1.timeSlot.hour - med2.timeSlot.hour);
                        const requiredSpacing = Math.max(rule1.minSpacingHours, rule2.minSpacingHours, 2);

                        const severity: "critical" | "warning" | "info" = timeDiff < requiredSpacing
                            ? (rule1.priority === "critical" || rule2.priority === "critical" ? "critical" : "warning")
                            : "info";

                        conflicts.push({
                            medicines: [med1.medicineName, med2.medicineName],
                            type: "interaction",
                            severity,
                            description: `${med1.medicineName} and ${med2.medicineName} have absorption conflicts and should be taken at least ${requiredSpacing} hours apart`,
                            resolution: timeDiff >= requiredSpacing
                                ? `Currently scheduled ${timeDiff} hours apart — spacing is adequate`
                                : `Currently only ${timeDiff} hours apart — increase spacing to at least ${requiredSpacing} hours`
                        });
                    }
                }

                if (med1.timeSlot.id === med2.timeSlot.id) {
                    const rule1Check = this.matchDrugRule(med1.medicineName);
                    const rule2Check = this.matchDrugRule(med2.medicineName);
                    if (rule1Check && rule2Check && rule1Check.minSpacingHours > 0 && rule2Check.minSpacingHours > 0) {
                        if (!conflicts.some(c => c.medicines.includes(med1.medicineName) && c.medicines.includes(med2.medicineName))) {
                            conflicts.push({
                                medicines: [med1.medicineName, med2.medicineName],
                                type: "timing",
                                severity: "warning",
                                description: `${med1.medicineName} and ${med2.medicineName} are both scheduled at the same time but may benefit from spacing`,
                                resolution: `Consider moving one medication to a different time slot for better absorption`
                            });
                        }
                    }
                }
            }
        }

        return conflicts;
    }

    private generateWarnings(scheduledMeds: ScheduledMedicine[]): ScheduleWarning[] {
        const warnings: ScheduleWarning[] = [];

        scheduledMeds.forEach(med => {
            const rule = this.matchDrugRule(med.medicineName);
            if (!rule) {
                warnings.push({
                    medicine: med.medicineName,
                    type: "general",
                    message: `${med.medicineName} is not in our pharmacokinetics database — schedule is based on general guidelines. Consult your doctor for optimal timing.`,
                    severity: "info"
                });
                return;
            }

            if (rule.foodRequirement === "empty_stomach" && med.timeSlot.foodRequirement === "with_meal") {
                warnings.push({
                    medicine: med.medicineName,
                    type: "food",
                    message: `${med.medicineName} should be taken on an empty stomach but is scheduled at a mealtime slot. Take 30-60 minutes before eating.`,
                    severity: "warning"
                });
            }

            if (rule.category === "Thyroid") {
                warnings.push({
                    medicine: med.medicineName,
                    type: "spacing",
                    message: `${med.medicineName}: Wait at least 4 hours before taking calcium, iron, or antacids.`,
                    severity: "critical"
                });
            }

            if (rule.category === "Antibiotic") {
                warnings.push({
                    medicine: med.medicineName,
                    type: "food",
                    message: `${med.medicineName}: Avoid dairy products and antacids within 2 hours of taking this antibiotic.`,
                    severity: "warning"
                });
            }

            if (rule.category === "Insulin") {
                warnings.push({
                    medicine: med.medicineName,
                    type: "timing",
                    message: `${med.medicineName}: Ensure you eat within 15-30 minutes of injection to prevent hypoglycemia.`,
                    severity: "critical"
                });
            }
        });

        return warnings;
    }

    private buildSchedule(medicines: MedicineInput[]): ScheduledMedicine[] {
        const scheduled: ScheduledMedicine[] = [];
        const slotOccupancy: Record<string, string[]> = {};

        TIME_SLOTS.forEach(slot => {
            slotOccupancy[slot.id] = [];
        });

        const sortedMeds = [...medicines].sort((a, b) => {
            const ruleA = this.matchDrugRule(a.name);
            const ruleB = this.matchDrugRule(b.name);
            const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
            const pA = ruleA ? priorityOrder[ruleA.priority] : 3;
            const pB = ruleB ? priorityOrder[ruleB.priority] : 3;
            return pA - pB;
        });

        for (const med of sortedMeds) {
            const rule = this.matchDrugRule(med.name);
            const frequency = this.parseFrequency(med.frequency || "daily");

            if (frequency < 1) {
                const slot = rule ? TIME_SLOTS.find(s => rule.preferredPeriod.includes(s.period)) || TIME_SLOTS[1] : TIME_SLOTS[1];
                scheduled.push({
                    medicineId: med._id,
                    medicineName: med.name,
                    dosage: med.dosage,
                    timeSlot: slot,
                    reason: rule ? rule.reason : "Scheduled based on general guidelines",
                    foodInstruction: rule ? rule.foodInstruction : "Follow your doctor's instructions",
                    priority: rule ? rule.priority : "medium",
                    category: rule ? rule.category : "General",
                });
                slotOccupancy[slot.id].push(med.name);
                continue;
            }

            const preferredPeriods = rule ? rule.preferredPeriod : ["morning"];
            const slots = this.getTimeSlotsForFrequency(Math.round(frequency), preferredPeriods);

            for (const slot of slots) {
                let finalSlot = slot;

                if (rule && rule.conflictGroups.length > 0) {
                    const currentOccupants = slotOccupancy[slot.id] || [];
                    const hasConflict = currentOccupants.some(occupant => {
                        const occupantRule = this.matchDrugRule(occupant);
                        if (!occupantRule) return false;
                        return rule.conflictGroups.some(group =>
                            occupantRule.keywords.some(kw => kw.includes(group)) ||
                            occupantRule.category.toLowerCase().includes(group)
                        );
                    });

                    if (hasConflict) {
                        const alternativeSlot = TIME_SLOTS.find(s =>
                            s.id !== slot.id &&
                            !(slotOccupancy[s.id] || []).some(occupant => {
                                const oRule = this.matchDrugRule(occupant);
                                if (!oRule) return false;
                                return rule.conflictGroups.some(group =>
                                    oRule.keywords.some(kw => kw.includes(group)) ||
                                    oRule.category.toLowerCase().includes(group)
                                );
                            }) &&
                            Math.abs(s.hour - slot.hour) >= rule.minSpacingHours
                        );
                        if (alternativeSlot) {
                            finalSlot = alternativeSlot;
                        }
                    }
                }

                scheduled.push({
                    medicineId: med._id,
                    medicineName: med.name,
                    dosage: med.dosage,
                    timeSlot: finalSlot,
                    reason: rule ? rule.reason : "Scheduled based on general guidelines",
                    foodInstruction: rule ? rule.foodInstruction : "Follow your doctor's instructions",
                    priority: rule ? rule.priority : "medium",
                    category: rule ? rule.category : "General",
                });
                slotOccupancy[finalSlot.id] = [...(slotOccupancy[finalSlot.id] || []), med.name];
            }
        }

        scheduled.sort((a, b) => a.timeSlot.hour - b.timeSlot.hour);
        return scheduled;
    }

    private calculateScore(timeline: ScheduledMedicine[], conflicts: ScheduleConflict[], warnings: ScheduleWarning[]): number {
        let score = 100;
        conflicts.forEach(c => {
            if (c.severity === "critical") score -= 15;
            else if (c.severity === "warning") score -= 8;
            else score -= 3;
        });
        warnings.forEach(w => {
            if (w.severity === "critical") score -= 5;
            else if (w.severity === "warning") score -= 2;
        });
        const knownMeds = timeline.filter(m => this.matchDrugRule(m.medicineName)).length;
        const knownRatio = timeline.length > 0 ? knownMeds / timeline.length : 0;
        score = score * (0.5 + 0.5 * knownRatio);
        return Math.max(10, Math.min(100, Math.round(score)));
    }

    private async generateAIInsights(
        medicines: MedicineInput[],
        timeline: ScheduledMedicine[],
        conflicts: ScheduleConflict[]
    ): Promise<string[]> {
        try {
            const scheduleOverview = timeline.map(m =>
                `${m.timeSlot.time} — ${m.medicineName} (${m.dosage}) [${m.category}] — ${m.foodInstruction}`
            ).join("\n");

            const conflictSummary = conflicts.length > 0
                ? conflicts.map(c => `${c.medicines.join(" + ")}: ${c.description}`).join("\n")
                : "No conflicts detected.";

            const prompt = `You are a clinical pharmacist AI assistant. Analyze this optimized medication schedule and provide 3-4 concise, actionable insights.

MEDICATION SCHEDULE:
${scheduleOverview}

DETECTED CONFLICTS:
${conflictSummary}

NUMBER OF MEDICATIONS: ${medicines.length}

Provide practical tips about:
- Timing optimization
- Food interactions
- Lifestyle adjustments for better adherence
- Any safety considerations

Keep each insight to 1-2 sentences. Be professional but friendly. Do not use bullet point markers or numbering.`;

            const response = await groq.chat.completions.create({
                messages: [{ role: "user", content: prompt }],
                model: "mixtral-8x7b-32768",
                temperature: 0.3,
                max_tokens: 400,
            });

            const insightsText = response.choices[0]?.message?.content || "";
            return insightsText
                .split("\n")
                .map((line: string) => line.replace(/^[\d\-\*\.\)]+\s*/, "").trim())
                .filter((line: string) => line.length > 10)
                .slice(0, 4);
        } catch {
            return [
                `Your ${medicines.length} medications have been organized into an optimal daily schedule based on pharmacokinetics data.`,
                conflicts.length > 0
                    ? `${conflicts.length} potential interaction(s) detected — review the conflict details above.`
                    : "No major drug interactions detected in your current medication lineup.",
                "Consistency is key — try to take your medications at the same times each day for best results.",
            ];
        }
    }

    async generateOptimalSchedule(medicines: MedicineInput[]): Promise<OptimizedSchedule> {
        try {
            const timeline = this.buildSchedule(medicines);
            const conflicts = this.detectConflicts(timeline, medicines);
            const warnings = this.generateWarnings(timeline);
            const score = this.calculateScore(timeline, conflicts, warnings);
            const insights = await this.generateAIInsights(medicines, timeline, conflicts);

            return { timeline, conflicts, warnings, insights, score };
        } catch (error) {
            console.error("Schedule optimization error:", error);
            throw new Error("Failed to generate optimized schedule");
        }
    }
}

export const scheduleOptimizerEngine = new ScheduleOptimizerEngine();
