import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";

const DEFAULT_PROFILE_IMG =
  "https://res.cloudinary.com/dihocserl/image/upload/v1758109403/profile-blue-icon_w3vbnt.webp";

export async function POST(req) {
  try {
    await connectDB();
    const { name, usn, password } = await req.json();

    if (!name || !usn || !password) {
      return NextResponse.json({ error: "Name, USN and password are required" }, { status: 400 });
    }

    const usnUpper = usn.toUpperCase();
    let user = await User.findOne({ usn: usnUpper });

    if (user) {
      if (user.password) {
        return NextResponse.json({ error: "Account already exists. Please login." }, { status: 409 });
      }
      // user exists but password not set - set password and name if missing
      const hashedPassword = await bcrypt.hash(password, 10);
      user.password = hashedPassword;
      user.name = user.name || name;
      if (!user.profileimg) user.profileimg = DEFAULT_PROFILE_IMG;
      await user.save();

      return NextResponse.json({ message: "Account created", user: { name: user.name, usn: user.usn, profileimg: user.profileimg } });
    }

    // create new user
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      name,
      usn: usnUpper,
      password: hashedPassword,
      profileimg: DEFAULT_PROFILE_IMG,
    });
    await newUser.save();

    return NextResponse.json({ message: "Account created", user: { name: newUser.name, usn: newUser.usn, profileimg: newUser.profileimg } });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
