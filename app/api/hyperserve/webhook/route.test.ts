import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearWebhookLog, listWebhookLogEntries } from "@/lib/webhook-log";

const SECRET = "test-secret";

function sign(body: string, timestamp: number = Date.now()): string {
	const hmac = createHmac("sha256", SECRET).update(`${timestamp}.${body}`).digest("hex");
	return `${timestamp}.${hmac}`;
}

function post(body: string, signature: string | null): Request {
	const headers = new Headers({ "content-type": "application/json" });
	if (signature !== null) {
		headers.set("x-hyperserve-signature", signature);
	}
	return new Request("http://localhost/api/hyperserve/webhook", { method: "POST", body, headers });
}

const payload = JSON.stringify({
	webhookName: "starter",
	event: "video-processing-success",
	videoId: "vid-1",
	data: { id: "vid-1", isPublic: true, resolutions: {} },
});

beforeEach(() => {
	clearWebhookLog();
	vi.stubEnv("HYPERSERVE_API_KEY", "key");
	vi.stubEnv("HYPERSERVE_WEBHOOK_SECRET", SECRET);
});

afterEach(() => {
	vi.unstubAllEnvs();
});

describe("POST /api/hyperserve/webhook", () => {
	it("accepts a correctly signed payload and logs it as verified", async () => {
		const { POST } = await import("./route");
		const response = await POST(post(payload, sign(payload)));

		expect(response.status).toBe(200);
		const [entry] = listWebhookLogEntries();
		expect(entry).toMatchObject({ verified: true, event: "video-processing-success", videoId: "vid-1", note: null });
	});

	it("rejects a tampered body with 401 and logs the rejection", async () => {
		const { POST } = await import("./route");
		const signature = sign(payload);
		const response = await POST(post(payload.replace("vid-1", "vid-2"), signature));

		expect(response.status).toBe(401);
		expect(listWebhookLogEntries()[0]).toMatchObject({ verified: false });
	});

	it("rejects a signature made with the wrong secret", async () => {
		const { POST } = await import("./route");
		const timestamp = Date.now();
		const wrong = createHmac("sha256", "not-the-secret").update(`${timestamp}.${payload}`).digest("hex");
		const response = await POST(post(payload, `${timestamp}.${wrong}`));

		expect(response.status).toBe(401);
	});

	it("rejects a timestamp outside the five minute tolerance", async () => {
		const { POST } = await import("./route");
		const stale = Date.now() - 6 * 60 * 1000;
		const response = await POST(post(payload, sign(payload, stale)));

		expect(response.status).toBe(401);
	});

	it("rejects a malformed signature header", async () => {
		const { POST } = await import("./route");
		expect((await POST(post(payload, "garbage"))).status).toBe(401);
	});

	it("rejects a request with no signature header at all", async () => {
		const { POST } = await import("./route");
		expect((await POST(post(payload, null))).status).toBe(401);
	});

	it("returns 500 and logs a clear note when the secret is not configured", async () => {
		vi.stubEnv("HYPERSERVE_WEBHOOK_SECRET", "");
		const { POST } = await import("./route");
		const response = await POST(post(payload, sign(payload)));

		expect(response.status).toBe(500);
		expect(listWebhookLogEntries()[0]).toMatchObject({ verified: false, note: expect.stringContaining("HYPERSERVE_WEBHOOK_SECRET") });
	});

	it("logs the raw body verbatim, since that is what the signature covers", async () => {
		const { POST } = await import("./route");
		await POST(post(payload, sign(payload)));
		expect(listWebhookLogEntries()[0].rawBody).toBe(payload);
	});
});
