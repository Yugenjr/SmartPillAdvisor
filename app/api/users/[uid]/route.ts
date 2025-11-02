import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

export async function GET(
  req: NextRequest,
  { params }: { params: { uid: string } }
) {
  try {
    const { db } = await connectToDatabase();
    const user = await db.collection("users").findOne({ uid: params.uid });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userData = await req.json();

    if (!userData.uid || !userData.email) {
      return NextResponse.json({ error: "uid and email are required" }, { status: 400 });
    }

    const { db } = await connectToDatabase();

    // Check if user already exists
    const existingUser = await db.collection("users").findOne({ uid: userData.uid });
    if (existingUser) {
      return NextResponse.json(existingUser);
    }

    // Create new user
    const newUser = {
      uid: userData.uid,
      name: userData.name || userData.email.split('@')[0],
      email: userData.email,
      createdAt: userData.createdAt || new Date().toISOString(),
    };

    await db.collection("users").insertOne(newUser);

    return NextResponse.json(newUser, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
