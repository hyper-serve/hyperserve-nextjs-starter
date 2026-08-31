import "server-only";
import type { VideoResolution, VideoResolutionResult, VideoResult } from "@hyperserve/hyperserve-js";
import { readConfig } from "@/lib/config";
import { createClient } from "@/lib/hyperserve";
import { ALL_RESOLUTIONS } from "@/lib/upload-validation";

export type VideoLoad = { ok: true; video: VideoResult } | { ok: false; message: string };

export async function loadVideo(id: string): Promise<VideoLoad> {
	const config = readConfig();
	if (config === null) {
		return { ok: false, message: "HYPERSERVE_API_KEY is not set." };
	}
	try {
		return { ok: true, video: await createClient(config).getVideo(id) };
	} catch (error) {
		return { ok: false, message: error instanceof Error ? error.message : "Unexpected error." };
	}
}

/** Never rejects: one dead ID should not blank the whole list. */
export async function loadVideos(ids: string[]): Promise<Array<{ id: string } & VideoLoad>> {
	return Promise.all(
		ids.map(async (id) => ({ id, ...(await loadVideo(id)) })),
	);
}

export function bestReadyResolution(
	video: VideoResult,
): { label: VideoResolution; result: VideoResolutionResult } | null {
	// ALL_RESOLUTIONS is ordered smallest to largest, so walk it backwards for the best one.
	for (let index = ALL_RESOLUTIONS.length - 1; index >= 0; index -= 1) {
		const label = ALL_RESOLUTIONS[index];
		const result = video.resolutions[label];
		if (result && result.status === "ready" && result.videoUrl) {
			return { label, result };
		}
	}
	return null;
}

export function isSettled(video: VideoResult): boolean {
	return video.status === "ready" || video.status === "fail";
}
