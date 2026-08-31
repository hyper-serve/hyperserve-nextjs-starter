import { afterEach, describe, expect, it, vi } from "vitest";

const completeUpload = vi.fn();
const cookieSet = vi.fn();

vi.mock("@hyperserve/hyperserve-js", () => ({
	HyperserveClient: function HyperserveClientMock() {
		return { completeUpload };
	},
	HyperserveValidationError: class extends Error {
		statusCode: number;
		constructor(message: string, statusCode: number) {
			super(message);
			this.statusCode = statusCode;
		}
	},
}));

vi.mock("next/headers", () => ({
	cookies: async () => ({
		get: (name: string) => (name === "hyperserve_recent_videos" ? { value: '["old"]' } : undefined),
		set: cookieSet,
	}),
}));

function post(id: string) {
	return {
		request: new Request(`http://localhost/api/videos/${id}/complete`, { method: "POST" }),
		context: { params: Promise.resolve({ id }) },
	};
}

afterEach(() => {
	vi.unstubAllEnvs();
	completeUpload.mockReset();
	cookieSet.mockReset();
});

describe("POST /api/videos/[id]/complete", () => {
	it("completes the upload and records the id in the cookie, newest first", async () => {
		vi.stubEnv("HYPERSERVE_API_KEY", "key");
		completeUpload.mockResolvedValue({ id: "vid-1", isPublic: true, resolutions: { "480p": { status: "processing" } } });
		const { POST } = await import("./route");
		const { request, context } = post("vid-1");

		const response = await POST(request, context);

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual({ id: "vid-1" });
		expect(completeUpload).toHaveBeenCalledWith("vid-1");
		expect(cookieSet).toHaveBeenCalledWith(
			"hyperserve_recent_videos",
			'["vid-1","old"]',
			expect.objectContaining({ path: "/", sameSite: "lax" }),
		);
	});

	it("does not record the id when the API call fails", async () => {
		vi.stubEnv("HYPERSERVE_API_KEY", "key");
		completeUpload.mockRejectedValue(new Error("boom"));
		const { POST } = await import("./route");
		const { request, context } = post("vid-1");

		const response = await POST(request, context);

		expect(response.status).toBe(502);
		expect(cookieSet).not.toHaveBeenCalled();
	});

	it("returns 500 when no API key is configured", async () => {
		vi.stubEnv("HYPERSERVE_API_KEY", "");
		const { POST } = await import("./route");
		const { request, context } = post("vid-1");
		expect((await POST(request, context)).status).toBe(500);
		expect(completeUpload).not.toHaveBeenCalled();
	});
});
