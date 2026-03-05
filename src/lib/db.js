import mongoose from "mongoose";

let isConnected = false;

export async function connectDB() {
  if (isConnected) return;

  // Support both common env var names: MONGO_URI and MONGODB_URI
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!mongoUri) {
    console.warn(
      "connectDB: no MongoDB URI found in environment (checked MONGO_URI and MONGODB_URI). Skipping connection."
    );
    return;
  }

  try {
    await mongoose.connect(mongoUri);
    isConnected = true;
    console.log("MongoDB connected");
  } catch (error) {
    console.log("MongoDB connection error:", error);
  }
}
