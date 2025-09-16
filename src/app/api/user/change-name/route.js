import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Work from "@/models/Work";

export const PUT = async (req) => {
  try {
    await connectDB();
    const { usn, newName } = await req.json();

    if (!usn || !newName) {
      return NextResponse.json(
        { error: "USN and new name are required" },
        { status: 400 }
      );
    }

    const user = await Work.findOne({ usn: usn.toUpperCase() });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    user.name = newName;
    await user.save();

    return NextResponse.json({
      message: "Name updated successfully",
      user: { usn: user.usn, name: user.name },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to update name", details: err.message },
      { status: 500 }
    );
  }
};
