import { afterEach, describe, expect, it, vi } from "vitest";
import type { VideoResult } from "@hyperserve/hyperserve-js";

const getVideo = vi.fn();

vi.mock("@hyperserve/hyperserve-js", () => ({
	HyperserveClient: function HyperserveClientMock() {
		return { getVideo };
	},
	HyperserveValidationError: class extends Error {},
}));

afterEach(() => {
	vi.unstubAllEnvs();
	getVideo.mockReset();
});

function video(overrides: Partial<VideoResult> = {}): VideoResult {
	return { id: "vid-1", status: "ready", isPublic: true, resolutions: {}, ...overrides } as VideoResult;
}

describe("loadVideo", () => {
	it("returns a failure result instead of throwing when the API errors", async () => {
		vi.stubEnv("HYPERSERVE_API_KEY", "key");
		getVideo.mockRejectedValue(new Error("nope"));
		const { loadVideo } = await import("./videos");
		expect(await loadVideo("vid-1")).toEqual({ ok: false, message: "nope" });
	});

	it("returns a failure result when no API key is configured", async () => {
		vi.stubEnv("HYPERSERVE_API_KEY", "");
		const { loadVideo } = await import("./videos");
		const result = await loadVideo("vid-1");
		expect(result.ok).toBe(false);
		expect(getVideo).not.toHaveBeenCalled();
	});

	it("resolves with the exact video object the client returned, not a reshaped copy", async () => {
		vi.stubEnv("HYPERSERVE_API_KEY", "key");
		const resolved = video({ id: "vid-1", status: "processing", customMetadata: { title: "clip" } });
		getVideo.mockResolvedValue(resolved);
		const { loadVideo } = await import("./videos");
		expect(await loadVideo("vid-1")).toEqual({ ok: true, video: resolved });
	});
});

describe("loadVideos", () => {
	it("preserves input order and keeps going when one id fails", async () => {
		vi.stubEnv("HYPERSERVE_API_KEY", "key");
		getVideo.mockImplementation(async (id: string) => {
			if (id === "bad") throw new Error("gone");
			return video({ id });
		});
		const { loadVideos } = await import("./videos");
		const results = await loadVideos(["a", "bad", "c"]);
		expect(results.map((entry) => entry.id)).toEqual(["a", "bad", "c"]);
		expect(results[1].ok).toBe(false);
		expect(results[0].ok).toBe(true);
	});
});

describe("bestReadyResolution", () => {
	it("picks the highest ready rendition, not the first one listed", async () => {
		const { bestReadyResolution } = await import("./videos");
		const result = bestReadyResolution(
			video({
				resolutions: {
					"480p": { id: "r1", status: "ready", videoUrl: "low", thumbnailImageUrls: [] },
					"1080p": { id: "r2", status: "ready", videoUrl: "high", thumbnailImageUrls: [] },
				},
			}),
		);
		expect(result?.label).toBe("1080p");
	});

	it("picks the last entry of ALL_RESOLUTIONS when every rendition is ready, proving it depends on that order", async () => {
		const { ALL_RESOLUTIONS } = await import("@/lib/upload-validation");
		const { bestReadyResolution } = await import("./videos");
		const resolutions = Object.fromEntries(
			ALL_RESOLUTIONS.map((label) => [
				label,
				{ id: label, status: "ready", videoUrl: `url-${label}`, thumbnailImageUrls: [] },
			]),
		) as VideoResult["resolutions"];
		const result = bestReadyResolution(video({ resolutions }));
		expect(result?.label).toBe(ALL_RESOLUTIONS[ALL_RESOLUTIONS.length - 1]);
	});

	it("ignores renditions that are not ready", async () => {
		const { bestReadyResolution } = await import("./videos");
		const result = bestReadyResolution(
			video({
				resolutions: {
					"480p": { id: "r1", status: "ready", videoUrl: "low", thumbnailImageUrls: [] },
					"1080p": { id: "r2", status: "processing", videoUrl: "", thumbnailImageUrls: [] },
				},
			}),
		);
		expect(result?.label).toBe("480p");
	});

	it("ignores a ready rendition with an empty videoUrl, independent of the not-ready rule", async () => {
		const { bestReadyResolution } = await import("./videos");
		const result = bestReadyResolution(
			video({
				resolutions: {
					"480p": { id: "r1", status: "ready", videoUrl: "low", thumbnailImageUrls: [] },
					"1080p": { id: "r2", status: "ready", videoUrl: "", thumbnailImageUrls: [] },
				},
			}),
		);
		expect(result?.label).toBe("480p");
	});

	it("returns null when nothing is ready", async () => {
		const { bestReadyResolution } = await import("./videos");
		expect(bestReadyResolution(video({ resolutions: {} }))).toBeNull();
	});
});

describe("isSettled", () => {
	it("is true for ready and fail, false for in-flight states", async () => {
		const { isSettled } = await import("./videos");
		expect(isSettled(video({ status: "ready" }))).toBe(true);
		expect(isSettled(video({ status: "fail" }))).toBe(true);
		expect(isSettled(video({ status: "processing" }))).toBe(false);
		expect(isSettled(video({ status: "pending_upload" }))).toBe(false);
	});
});
