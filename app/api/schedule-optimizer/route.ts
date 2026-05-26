import { NextRequest, NextResponse } from "next/server";
import { getAdminApp } from "@/lib/firebaseAdmin";
import { connectToDatabase } from "@/lib/mongodb";
import { getCalendarClient } from "@/lib/google";
import { scheduleOptimizerEngine, MedicineInput } from "@/lib/scheduleOptimizer";

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get("authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const idToken = authHeader.split("Bearer ")[1];
        if (!idToken) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const adminApp = getAdminApp();
        if (!adminApp) {
            return NextResponse.json({ error: "Authentication service unavailable" }, { status: 500 });
        }

        let decodedToken;
        try {
            decodedToken = await adminApp.auth().verifyIdToken(idToken);
        } catch {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 });
        }

        const userId = decodedToken.uid;

        const { db } = await connectToDatabase();
        const rawMedicines = await db
            .collection("medicines")
            .find({ userId })
            .sort({ createdAt: -1 })
            .toArray();

        const medicines: MedicineInput[] = rawMedicines.map((doc: any) => ({
            _id: doc._id.toString(),
            name: doc.name,
            dosage: doc.dosage || "As prescribed",
            price: doc.price,
            frequency: doc.frequency,
            duration: doc.duration,
            condition: doc.condition,
            severity: doc.severity,
            createdAt: new Date(doc.createdAt),
            expiryDate: doc.expiryDate ? new Date(doc.expiryDate) : undefined,
            purchaseDate: doc.purchaseDate ? new Date(doc.purchaseDate) : undefined,
        }));

        if (medicines.length === 0) {
            return NextResponse.json(
                {
                    error: "No medicines found",
                    message: "Add your medications to generate an optimized schedule",
                },
                { status: 400 }
            );
        }

        const scheduleData = await scheduleOptimizerEngine.generateOptimalSchedule(medicines);

        let calendarSynced = false;
        const body = await req.json().catch(() => ({}));

        if (body.syncToCalendar) {
            try {
                const { calendar, calendarId } = getCalendarClient();
                const today = new Date();

                for (const item of scheduleData.timeline) {
                    const startTime = new Date(
                        today.getFullYear(),
                        today.getMonth(),
                        today.getDate(),
                        item.timeSlot.hour,
                        0,
                        0
                    );
                    const endTime = new Date(startTime.getTime() + 30 * 60000);

                    await calendar.events.insert({
                        calendarId,
                        requestBody: {
                            summary: `💊 ${item.medicineName} (${item.dosage})`,
                            description: `${item.foodInstruction}\n\nCategory: ${item.category}\nPriority: ${item.priority}\nReason: ${item.reason}`,
                            start: { dateTime: startTime.toISOString() },
                            end: { dateTime: endTime.toISOString() },
                            reminders: {
                                useDefault: false,
                                overrides: [{ method: "popup", minutes: 10 }],
                            },
                            recurrence: ["RRULE:FREQ=DAILY"],
                        },
                    });
                }
                calendarSynced = true;
            } catch {
                calendarSynced = false;
            }
        }

        return NextResponse.json({
            success: true,
            timeline: scheduleData.timeline,
            conflicts: scheduleData.conflicts,
            warnings: scheduleData.warnings,
            insights: scheduleData.insights,
            score: scheduleData.score,
            calendarSynced,
            medicineCount: medicines.length,
        });
    } catch (error: any) {
        console.error("Schedule optimizer error:", error);
        return NextResponse.json(
            {
                error: "Failed to generate optimized schedule",
                message: error.message,
            },
            { status: 500 }
        );
    }
}
