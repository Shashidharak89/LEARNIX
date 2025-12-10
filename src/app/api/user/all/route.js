// src/app/api/user/all/route.js
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Subject from "@/models/Subject";
import Topic from "@/models/Topic";

export const GET = async (req) => {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim().toLowerCase() || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const skip = (page - 1) * limit;

    let users;

    if (search) {
      // Search in users, subjects, and topics
      const userQuery = {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { usn: { $regex: search, $options: "i" } }
        ]
      };

      const matchingUsers = await User.find(userQuery)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("name usn profileimg createdAt")
        .lean();

      // Also search in subjects and topics
      const subjectsWithSearch = await Subject.find({
        subject: { $regex: search, $options: "i" }
      }).distinct("userId");

      const topicsWithSearch = await Topic.find({
        $or: [
          { topic: { $regex: search, $options: "i" } },
          { content: { $regex: search, $options: "i" } }
        ]
      }).distinct("userId");

      // Combine user IDs
      const userIds = [...new Set([
        ...matchingUsers.map(u => u._id.toString()),
        ...subjectsWithSearch.map(id => id.toString()),
        ...topicsWithSearch.map(id => id.toString())
      ])];

      // Fetch users by IDs if not already fetched
      if (subjectsWithSearch.length > 0 || topicsWithSearch.length > 0) {
        const additionalUsers = await User.find({
          _id: { $in: userIds },
          _id: { $nin: matchingUsers.map(u => u._id) }
        })
          .sort({ createdAt: -1 })
          .select("name usn profileimg createdAt")
          .lean();

        users = [...matchingUsers, ...additionalUsers].slice(skip, skip + limit);
      } else {
        users = matchingUsers;
      }
    } else {
      users = await User.find({})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("name usn profileimg createdAt")
        .lean();
    }

    return NextResponse.json({ users });
  } catch (err) {
    console.error("Error fetching users:", err);
    return NextResponse.json(
      { error: "Failed to fetch users", details: err.message },
      { status: 500 }
    );
  }
};
