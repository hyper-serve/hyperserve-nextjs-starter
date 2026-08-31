import { describe, expect, it } from "vitest";
import { MAX_FILE_SIZE_BYTES, checkFile } from "./upload-validation";

describe("checkFile", () => {
	it("accepts every supported extension, case-insensitively", () => {
		for (const name of ["a.mov", "a.MOV", "a.mp4", "a.mkv", "a.webm", "a.avi", "a.m4v", "a.mpg", "a.wmv"]) {
			expect(checkFile({ name, size: 1000 })).toEqual({ ok: true });
		}
	});

	it("rejects an unsupported extension and names the supported ones", () => {
		const result = checkFile({ name: "notes.pdf", size: 1000 });
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.message).toContain("mov");
		}
	});

	it("rejects a file with no extension", () => {
		expect(checkFile({ name: "video", size: 1000 }).ok).toBe(false);
	});

	it("rejects a trailing-dot filename, which has no extension to read", () => {
		expect(checkFile({ name: "video.", size: 1000 }).ok).toBe(false);
	});

	it("rejects an empty file", () => {
		expect(checkFile({ name: "a.mov", size: 0 }).ok).toBe(false);
	});

	it("accepts a file exactly at the 5GB limit", () => {
		expect(checkFile({ name: "a.mov", size: MAX_FILE_SIZE_BYTES })).toEqual({ ok: true });
	});

	it("rejects a file one byte over the limit", () => {
		const result = checkFile({ name: "a.mov", size: MAX_FILE_SIZE_BYTES + 1 });
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.message).toContain("5 GB");
		}
	});
});
