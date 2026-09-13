import { NextResponse } from "next/server";
import { hyperserve } from "@/lib/hyperserve";

export async function POST(_request: Request, context: RouteContext<"/api/videos/[id]/complete">) {
	const { id } = await context.params;

	// Step 3 of 3. Tells Hyperserve the file completed uploading, which queues transcoding.
	await hyperserve.completeUpload(id);

	return NextResponse.json({ id });
}
