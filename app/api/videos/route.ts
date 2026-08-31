import type { VideoResolution } from "@hyperserve/hyperserve-js";
import { NextResponse } from "next/server";
import { errorResponse, missingKeyResponse } from "@/lib/api-errors";
import { readConfig } from "@/lib/config";
import { createClient } from "@/lib/hyperserve";
import { DEFAULT_RESOLUTIONS, checkFile, isVideoResolution } from "@/lib/upload-validation";

export async function POST(request: Request) {
	const config = readConfig();
	if (config === null) {
		return missingKeyResponse();
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return NextResponse.json({ error: "Expected a JSON body." }, { status: 400 });
	}

	const { filename, fileSizeBytes, resolutions } = (body ?? {}) as Record<string, unknown>;
	if (typeof filename !== "string" || typeof fileSizeBytes !== "number") {
		return NextResponse.json({ error: "filename and fileSizeBytes are required." }, { status: 400 });
	}

	const check = checkFile({ name: filename, size: fileSizeBytes });
	if (!check.ok) {
		return NextResponse.json({ error: check.message }, { status: 400 });
	}

	// Unknown strings are dropped rather than forwarded, so a stale client cannot
	// make the API reject the whole request.
	const requested = Array.isArray(resolutions) ? resolutions.filter(isVideoResolution) : [];
	const chosen: [VideoResolution, ...VideoResolution[]] =
		requested.length > 0 ? [requested[0], ...requested.slice(1)] : DEFAULT_RESOLUTIONS;

	try {
		const result = await createClient(config).createVideo({
			filename,
			fileSizeBytes,
			resolutions: chosen,
			isPublic: true,
			thumbnailTimestampsSeconds: [1],
		});
		return NextResponse.json({
			id: result.id,
			uploadUrl: result.uploadUrl,
			contentType: result.contentType,
		});
	} catch (error) {
		return errorResponse(error);
	}
}
