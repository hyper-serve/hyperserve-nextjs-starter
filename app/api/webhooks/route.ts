import { NextResponse } from "next/server";
import { clearLastWebhook, lastWebhook } from "@/lib/last-webhook";

// Demo only. You would read the video row your receiver updated, not this.
export async function GET() {
	return NextResponse.json(lastWebhook());
}

// Demo only. The uploader calls this when a new upload starts.
export async function DELETE() {
	clearLastWebhook();
	return new NextResponse(null, { status: 204 });
}
