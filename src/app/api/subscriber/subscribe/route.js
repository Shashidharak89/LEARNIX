import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Subscriber from "@/models/Subscriber";

export async function POST(req){
    try {
        await connectDB();
        const body=await req.json();
        const sub=await Subscriber.create(body);
        return NextResponse.json(sub,{status:201});

    } catch (error) {
        console.error("Insert failed");
        return NextResponse.json({error:"Failed"},{status:500});
    }

}