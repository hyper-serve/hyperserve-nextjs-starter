import { describe, expect, it } from "vitest";
import { DEFAULT_BASE_URL, readConfig } from "./config";

describe("readConfig", () => {
	it("returns null when the API key is absent", () => {
		expect(readConfig({})).toBeNull();
	});

	it("returns null when the API key is blank or whitespace", () => {
		expect(readConfig({ HYPERSERVE_API_KEY: "   " })).toBeNull();
	});

	it("defaults the base URL, including the /api suffix", () => {
		const config = readConfig({ HYPERSERVE_API_KEY: "abc123" });
		expect(config).toEqual({
			apiKey: "abc123",
			baseUrl: DEFAULT_BASE_URL,
			webhookSecret: null,
		});
		expect(DEFAULT_BASE_URL).toBe("https://api.hyperserve.io/api");
	});

	it("trims surrounding whitespace from the key, which paste often adds", () => {
		expect(readConfig({ HYPERSERVE_API_KEY: " abc123\n" })?.apiKey).toBe("abc123");
	});

	it("honours an overridden base URL and a webhook secret", () => {
		const config = readConfig({
			HYPERSERVE_API_KEY: "abc123",
			HYPERSERVE_API_URL: "http://localhost:3001/api",
			HYPERSERVE_WEBHOOK_SECRET: "shh",
		});
		expect(config?.baseUrl).toBe("http://localhost:3001/api");
		expect(config?.webhookSecret).toBe("shh");
	});

	it("treats a blank webhook secret as absent, so the receiver can say so", () => {
		expect(readConfig({ HYPERSERVE_API_KEY: "abc123", HYPERSERVE_WEBHOOK_SECRET: "" })?.webhookSecret).toBeNull();
	});
});
