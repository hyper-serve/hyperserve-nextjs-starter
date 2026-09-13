import { NextResponse } from "next/server";
import { hyperserve } from "@/lib/hyperserve";
import { RESOLUTIONS } from "@/lib/resolutions";

export async function POST(request: Request) {
	const { filename } = await request.json();

	/*
	* Step 1 of 3. Creates the video in Hyperserve and returns an id, a presigned
	* upload URL, and the Content-Type to send with it. The API key never leaves the server.
	* You decide what resolutions and thumbnails you want created at this point, as well
	* as any custom metadata you want associated with the video. We pass that back
	* in the webhook so you can link it to a user for instance.
	*/
	const created = await hyperserve.createVideo({
		filename,
		resolutions: RESOLUTIONS,
		isPublic: true,
		thumbnailTimestampsSeconds: [1],
	});

	return NextResponse.json(created);
}
