export const RECENT_VIDEOS_COOKIE = "hyperserve_recent_videos";

/** The API has no "list my videos" endpoint for API keys, so the app remembers its own IDs. */
export const MAX_RECENT_VIDEOS = 20;

export function parseRecentVideos(raw: string | undefined): string[] {
	if (!raw) {
		return [];
	}
	try {
		const parsed: unknown = JSON.parse(raw);
		if (!Array.isArray(parsed)) {
			return [];
		}
		return parsed.filter((entry): entry is string => typeof entry === "string");
	} catch {
		return [];
	}
}

export function addRecentVideo(raw: string | undefined, id: string): string {
	const existing = parseRecentVideos(raw).filter((entry) => entry !== id);
	return JSON.stringify([id, ...existing].slice(0, MAX_RECENT_VIDEOS));
}
