import { addClient, removeClient } from "@/lib/sseManager";

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
    const { requestId } = params;

    let controller;
    const stream = new ReadableStream({
        start(c) {
            controller = c;
            addClient(requestId, controller);
            
            // Send initial connection event
            const encoder = new TextEncoder();
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ step: 0, status: "Connected", message: "Listening for progress..." })}\n\n`));
        },
        cancel() {
            removeClient(requestId);
        }
    });

    req.signal.addEventListener('abort', () => {
        removeClient(requestId);
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
        },
    });
}
