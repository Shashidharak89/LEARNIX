// api/auth/route.js
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const DEFAULT_PROFILE_IMG =
  "https://res.cloudinary.com/dihocserl/image/upload/v1758109403/profile-blue-icon_w3vbnt.webp";

const SECRET_KEY = process.env.SECRET_KEY || "mysecretkey";

// Helper function to generate JWT token
const generateToken = (userId, usn) => {
  return jwt.sign(
    { userId, usn },
    SECRET_KEY,
    { expiresIn: "30d" } // Token expires in 30 days
  );
};

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
    let user = await User.findOne({ usn: usnUpper });

    if (user) {
      if (!user.password) {
        // First time password setup
        const hashedPassword = await bcrypt.hash(password, 10);
        user.password = hashedPassword;
        if (!user.profileimg) {
          user.profileimg = DEFAULT_PROFILE_IMG; // ensure it exists
        }
        
        const token = generateToken(user._id.toString(), user.usn);
        user.token = token;
        user.tokenCreatedAt = new Date();
        await user.save();

        return NextResponse.json({
          message: "Password set successfully. You are now logged in.",
          user: { name: user.name, usn: user.usn, profileimg: user.profileimg },
          token
        });
      } else {
        // Login with existing password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return NextResponse.json({ error: "Invalid password" }, { status: 401 });
        }

        const token = generateToken(user._id.toString(), user.usn);
        user.token = token;
        user.tokenCreatedAt = new Date();
        await user.save();

        return NextResponse.json({
          message: "Logged in successfully",
          user: { name: user.name, usn: user.usn, profileimg: user.profileimg },
          token
        });
      }
    } else {
      // Create new account with password
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = new User({
        name,
        usn: usnUpper,
        password: hashedPassword,
        profileimg: DEFAULT_PROFILE_IMG, // explicitly set
      });
      
      const token = generateToken(newUser._id.toString(), newUser.usn);
      newUser.token = token;
      newUser.tokenCreatedAt = new Date();
      await newUser.save();

      return NextResponse.json({
        message: "Account created",
        user: { name: newUser.name, usn: newUser.usn, profileimg: newUser.profileimg },
        token
      });
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
