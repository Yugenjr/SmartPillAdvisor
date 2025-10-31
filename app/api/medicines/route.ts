import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebaseAdmin";
import { getCalendarClient } from "@/lib/google";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      code,
      purchaseDate,
      expiryDate,
      company,
      dosage,
      userEmail,
      userId,
      addCalendar = true,
    } = body;

    if (!name || !expiryDate) {
      return NextResponse.json({ error: "name and expiryDate are required" }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const db = getDb();

    const doc = {
      name,
      code: code || null,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
      expiryDate: new Date(expiryDate),
      company: company || null,
      dosage: dosage || null,
      userEmail: userEmail || null,
      userId,
      createdAt: new Date(),
    };

    let storedId: string | null = null;
    if (db) {
      const ref = await db.collection("medicines").add({
        ...doc,
        purchaseDate: doc.purchaseDate ? (doc.purchaseDate as Date).toISOString() : null,
        expiryDate: (doc.expiryDate as Date).toISOString(),
        createdAt: (doc.createdAt as Date).toISOString(),
      });
      storedId = ref.id;
    }

    let calendarEvent: any = null;
    if (addCalendar) {
      try {
        const { calendar, calendarId } = getCalendarClient();
        const exp = new Date(expiryDate);
        const start = new Date(exp.getFullYear(), exp.getMonth(), exp.getDate(), 9, 0, 0);
        const end = new Date(exp.getFullYear(), exp.getMonth(), exp.getDate(), 10, 0, 0);
        const ev = await calendar.events.insert({
          calendarId,
          requestBody: {
            summary: `${name} expiring today`,
            description: `Expiry reminder for ${name}`,
            start: { dateTime: start.toISOString() },
            end: { dateTime: end.toISOString() },
            attendees: userEmail ? [{ email: userEmail }] : undefined,
          },
        });
        calendarEvent = { id: ev.data.id };
      } catch (err) {
        // Calendar is optional; continue if misconfigured
        calendarEvent = { error: "calendar not configured" };
      }
    }

    return NextResponse.json({ id: storedId, calendarEvent }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
