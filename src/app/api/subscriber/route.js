import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Subscriber from "@/models/Subscriber";

export async function GET(req){
try {
    await connectDB();

    const res= await Subscriber.find();
    return NextResponse.json(res,{status:200});
} catch (error) {
    return NextResponse.json({error:"error"},{status:400});
    
}
};