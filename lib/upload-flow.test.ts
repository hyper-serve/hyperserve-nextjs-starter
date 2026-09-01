import { describe, expect, it, vi } from "vitest";
import type { UploadDeps, UploadPhase } from "./upload-flow";
import { runUpload } from "./upload-flow";

function file(name = "clip.mov", size = 1024): File {
	const blob = new File(["x".repeat(size)], name, { type: "video/quicktime" });
	Object.defineProperty(blob, "size", { value: size });
	return blob;
}

function deps(overrides: Partial<UploadDeps> = {}): UploadDeps {
	return {
		postJson: vi.fn(async (url: string) =>
			url === "/api/videos"
				? { id: "vid-1", uploadUrl: "https://storage.example/put?sig=abc", contentType: "video/quicktime" }
				: { id: "vid-1" },
		),
		putToStorage: vi.fn(async () => undefined),
		...overrides,
	};
}

describe("runUpload", () => {
	it("returns the new video id after all three calls", async () => {
		const d = deps();
		const id = await runUpload({ file: file(), resolutions: ["720p"], onPhase: () => {} }, d);
		expect(id).toBe("vid-1");
	});

	it("sends the filename, size, and chosen resolutions to the presign endpoint", async () => {
		const d = deps();
		await runUpload({ file: file("a.mov", 2048), resolutions: ["720p"], onPhase: () => {} }, d);
		expect(d.postJson).toHaveBeenCalledWith("/api/videos", {
			filename: "a.mov",
			fileSizeBytes: 2048,
			resolutions: ["720p"],
		});
	});

	it("passes uploadUrl and contentType to storage exactly as the server returned them", async () => {
		const d = deps();
		const source = file();
		await runUpload({ file: source, resolutions: ["720p"], onPhase: () => {} }, d);
		expect(d.putToStorage).toHaveBeenCalledWith(
			expect.objectContaining({
				uploadUrl: "https://storage.example/put?sig=abc",
				contentType: "video/quicktime",
				file: source,
			}),
		);
	});

	it("completes the upload against the id the presign step returned", async () => {
		const d = deps();
		await runUpload({ file: file(), resolutions: ["720p"], onPhase: () => {} }, d);
		expect(d.postJson).toHaveBeenLastCalledWith("/api/videos/vid-1/complete", {});
	});

	it("rejects an unsupported file before making any network call", async () => {
		const d = deps();
		await expect(
			runUpload({ file: file("notes.pdf"), resolutions: ["720p"], onPhase: () => {} }, d),
		).rejects.toThrow(/Unsupported/);
		expect(d.postJson).not.toHaveBeenCalled();
		expect(d.putToStorage).not.toHaveBeenCalled();
	});

	it("does not upload or complete when the presign call fails", async () => {
		const d = deps({ postJson: vi.fn(async () => { throw new Error("presign failed"); }) });
		await expect(runUpload({ file: file(), resolutions: ["720p"], onPhase: () => {} }, d)).rejects.toThrow("presign failed");
		expect(d.putToStorage).not.toHaveBeenCalled();
	});

	it("does not complete when the storage PUT fails", async () => {
		const d = deps({ putToStorage: vi.fn(async () => { throw new Error("put failed"); }) });
		await expect(runUpload({ file: file(), resolutions: ["720p"], onPhase: () => {} }, d)).rejects.toThrow("put failed");
		expect(d.postJson).toHaveBeenCalledTimes(1);
	});

	it("reports the phases in order, including upload progress", async () => {
		const phases: UploadPhase[] = [];
		const d = deps({
			putToStorage: vi.fn(async (options) => {
				options.onProgress?.(50);
			}),
		});
		await runUpload({ file: file(), resolutions: ["720p"], onPhase: (phase) => phases.push(phase) }, d);
		expect(phases.map((phase) => phase.name)).toEqual(["creating", "uploading", "uploading", "completing"]);
		expect(phases[2]).toEqual({ name: "uploading", percent: 50 });
	});
});
