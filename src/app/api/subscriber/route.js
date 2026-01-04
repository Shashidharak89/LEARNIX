import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Subscriber from "@/models/Subscriber";

export async function GET(req){
try {
    await connectDB();

    const body= await Subscriber.find();
    return NextResponse.json(body,{status:201});
} catch (error) {
    return NextResponse.json({error:"error"},{status:400});
    
}
};