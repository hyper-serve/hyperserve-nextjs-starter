import { afterEach, describe, expect, it, vi } from "vitest";

const createVideo = vi.fn();

vi.mock("@hyperserve/hyperserve-js", () => ({
	HyperserveClient: function HyperserveClientMock() {
		return { createVideo };
	},
	HyperserveValidationError: class extends Error {
		statusCode: number;
		constructor(message: string, statusCode: number) {
			super(message);
			this.statusCode = statusCode;
		}
	},
}));

function post(body: unknown): Request {
	return new Request("http://localhost/api/videos", {
		method: "POST",
		body: JSON.stringify(body),
		headers: { "content-type": "application/json" },
	});
}

afterEach(() => {
	vi.unstubAllEnvs();
	createVideo.mockReset();
});

describe("POST /api/videos", () => {
	it("returns 500 with a clear message when no API key is configured", async () => {
		vi.stubEnv("HYPERSERVE_API_KEY", "");
		const { POST } = await import("./route");
		const response = await POST(post({ filename: "a.mov", fileSizeBytes: 10 }));
		expect(response.status).toBe(500);
		await expect(response.json()).resolves.toMatchObject({ error: expect.stringContaining("HYPERSERVE_API_KEY") });
		expect(createVideo).not.toHaveBeenCalled();
	});

	it("rejects an unsupported file before calling the API", async () => {
		vi.stubEnv("HYPERSERVE_API_KEY", "key");
		const { POST } = await import("./route");
		const response = await POST(post({ filename: "notes.pdf", fileSizeBytes: 10 }));
		expect(response.status).toBe(400);
		expect(createVideo).not.toHaveBeenCalled();
	});

	it("rejects a malformed body", async () => {
		vi.stubEnv("HYPERSERVE_API_KEY", "key");
		const { POST } = await import("./route");
		const response = await POST(post({ filename: 123 }));
		expect(response.status).toBe(400);
		expect(createVideo).not.toHaveBeenCalled();
	});

	it("passes the requested resolutions through and returns the presign fields", async () => {
		vi.stubEnv("HYPERSERVE_API_KEY", "key");
		createVideo.mockResolvedValue({
			id: "vid-1",
			uploadUrl: "https://storage.example/put",
			contentType: "video/quicktime",
			isPublic: true,
			resolutions: {},
		});
		const { POST } = await import("./route");
		const response = await POST(post({ filename: "a.mov", fileSizeBytes: 10, resolutions: ["720p"] }));

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual({
			id: "vid-1",
			uploadUrl: "https://storage.example/put",
			contentType: "video/quicktime",
		});
		expect(createVideo).toHaveBeenCalledWith({
			filename: "a.mov",
			fileSizeBytes: 10,
			resolutions: ["720p"],
			isPublic: true,
			thumbnailTimestampsSeconds: [1],
		});
	});

	it("falls back to the default resolutions when none are supplied", async () => {
		vi.stubEnv("HYPERSERVE_API_KEY", "key");
		createVideo.mockResolvedValue({ id: "vid-1", uploadUrl: "u", contentType: "c", isPublic: true, resolutions: {} });
		const { POST } = await import("./route");
		await POST(post({ filename: "a.mov", fileSizeBytes: 10 }));
		expect(createVideo).toHaveBeenCalledWith(expect.objectContaining({ resolutions: ["480p", "720p"] }));
	});

	it("ignores unknown resolution strings rather than sending them to the API", async () => {
		vi.stubEnv("HYPERSERVE_API_KEY", "key");
		createVideo.mockResolvedValue({ id: "vid-1", uploadUrl: "u", contentType: "c", isPublic: true, resolutions: {} });
		const { POST } = await import("./route");
		await POST(post({ filename: "a.mov", fileSizeBytes: 10, resolutions: ["720p", "9000p"] }));
		expect(createVideo).toHaveBeenCalledWith(expect.objectContaining({ resolutions: ["720p"] }));
	});

	it("surfaces a rejected API key as a 401 with a dashboard-facing message", async () => {
		vi.stubEnv("HYPERSERVE_API_KEY", "key");
		const { HyperserveValidationError } = await import("@hyperserve/hyperserve-js");
		// The mocked class is typed as the real SDK export, whose constructor tsc cannot
		// see through the vi.mock factory. Cast to a plain constructor signature.
		const ValidationError = HyperserveValidationError as unknown as new (
			message: string,
			statusCode: number,
		) => Error;
		createVideo.mockRejectedValue(new ValidationError("Unauthorized", 401));
		const { POST } = await import("./route");
		const response = await POST(post({ filename: "a.mov", fileSizeBytes: 10 }));
		expect(response.status).toBe(401);
		await expect(response.json()).resolves.toMatchObject({ error: expect.stringContaining("API key") });
	});
});
