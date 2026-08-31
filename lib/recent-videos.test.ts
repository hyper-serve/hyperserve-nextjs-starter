import { describe, expect, it } from "vitest";
import { MAX_RECENT_VIDEOS, addRecentVideo, parseRecentVideos } from "./recent-videos";

describe("parseRecentVideos", () => {
	it("returns an empty list when the cookie is absent", () => {
		expect(parseRecentVideos(undefined)).toEqual([]);
	});

	it("tolerates a malformed cookie rather than throwing", () => {
		expect(parseRecentVideos("not json")).toEqual([]);
	});

	it("tolerates a cookie holding the wrong shape", () => {
		expect(parseRecentVideos('{"a":1}')).toEqual([]);
	});

	it("drops non-string entries", () => {
		expect(parseRecentVideos('["a",1,null,"b"]')).toEqual(["a", "b"]);
	});
});

describe("addRecentVideo", () => {
	it("puts the newest id first", () => {
		expect(parseRecentVideos(addRecentVideo('["a"]', "b"))).toEqual(["b", "a"]);
	});

	it("moves an existing id to the front instead of duplicating it", () => {
		expect(parseRecentVideos(addRecentVideo('["a","b"]', "b"))).toEqual(["b", "a"]);
	});

	it("caps the list at MAX_RECENT_VIDEOS, dropping the oldest", () => {
		const ids = Array.from({ length: MAX_RECENT_VIDEOS }, (_, i) => `id-${i}`);
		const result = parseRecentVideos(addRecentVideo(JSON.stringify(ids), "newest"));
		expect(result).toHaveLength(MAX_RECENT_VIDEOS);
		expect(result[0]).toBe("newest");
		expect(result).not.toContain(`id-${MAX_RECENT_VIDEOS - 1}`);
	});
});
