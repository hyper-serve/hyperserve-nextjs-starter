import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { errorResponse, missingKeyResponse } from "@/lib/api-errors";
import { readConfig } from "@/lib/config";
import { createClient } from "@/lib/hyperserve";
import { RECENT_VIDEOS_COOKIE, addRecentVideo } from "@/lib/recent-videos";

export async function POST(_request: Request, context: RouteContext<"/api/videos/[id]/complete">) {
	const config = readConfig();
	if (config === null) {
		return missingKeyResponse();
	}

	const { id } = await context.params;

	try {
		await createClient(config).completeUpload(id);
	} catch (error) {
		return errorResponse(error);
	}

	// Recorded only after the API accepts the upload, so a failed attempt leaves no ghost entry.
	const store = await cookies();
	store.set(RECENT_VIDEOS_COOKIE, addRecentVideo(store.get(RECENT_VIDEOS_COOKIE)?.value, id), {
		path: "/",
		sameSite: "lax",
		maxAge: 60 * 60 * 24 * 30,
	});

	return NextResponse.json({ id });
}
