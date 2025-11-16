import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Work from "@/models/Work";

export const GET = async () => {
  try {
    await connectDB();

    const users = await Work.find({}); // get all users
    return NextResponse.json({ users });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch users", details: err.message }, { status: 500 });
  }
};
