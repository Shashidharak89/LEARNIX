// api/auth/route.js
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Work from "@/models/Work";
import bcrypt from "bcryptjs";

const DEFAULT_PROFILE_IMG =
  "https://res.cloudinary.com/dihocserl/image/upload/v1758109403/profile-blue-icon_w3vbnt.webp";

export async function POST(req) {
  try {
    await connectDB();
    const { name, usn, password } = await req.json();

    if (!usn || !password) {
      return NextResponse.json(
        { error: "USN and password are required" },
        { status: 400 }
      );
    }

    const usnUpper = usn.toUpperCase();
    let user = await Work.findOne({ usn: usnUpper });

    if (user) {
      if (!user.password) {
        // First time password setup
        const hashedPassword = await bcrypt.hash(password, 10);
        user.password = hashedPassword;
        if (!user.profileimg) {
          user.profileimg = DEFAULT_PROFILE_IMG; // ensure it exists
        }
        await user.save();

        return NextResponse.json({
          message: "Password set successfully. You are now logged in.",
          user: { name: user.name, usn: user.usn, profileimg: user.profileimg }
        });
      } else {
        // Login with existing password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return NextResponse.json({ error: "Invalid password" }, { status: 401 });
        }

        return NextResponse.json({
          message: "Logged in successfully",
          user: { name: user.name, usn: user.usn, profileimg: user.profileimg }
        });
      }
    } else {
      // Create new account with password
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = new Work({
        name,
        usn: usnUpper,
        password: hashedPassword,
        subjects: [],
        profileimg: DEFAULT_PROFILE_IMG, // explicitly set
      });
      await newUser.save();

      return NextResponse.json({
        message: "Account created",
        user: { name: newUser.name, usn: newUser.usn, profileimg: newUser.profileimg }
      });
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
