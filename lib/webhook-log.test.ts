import { beforeEach, describe, expect, it } from "vitest";
import {
	MAX_WEBHOOK_LOG_ENTRIES,
	appendWebhookLogEntry,
	clearWebhookLog,
	listWebhookLogEntries,
} from "./webhook-log";

function entry(overrides: Partial<Parameters<typeof appendWebhookLogEntry>[0]> = {}) {
	return appendWebhookLogEntry({
		verified: true,
		event: "video-processing-success",
		videoId: "vid-1",
		rawBody: "{}",
		note: null,
		...overrides,
	});
}

beforeEach(() => {
	clearWebhookLog();
});

describe("webhook log", () => {
	it("starts empty", () => {
		expect(listWebhookLogEntries()).toEqual([]);
	});

	it("returns newest first", () => {
		entry({ videoId: "first" });
		entry({ videoId: "second" });
		expect(listWebhookLogEntries().map((item) => item.videoId)).toEqual(["second", "first"]);
	});

	it("assigns a unique id and a timestamp to each entry", () => {
		const a = entry();
		const b = entry();
		expect(a.id).not.toBe(b.id);
		expect(Number.isNaN(Date.parse(a.receivedAt))).toBe(false);
	});

	it("keeps rejected entries, so a wrong secret is visible rather than silent", () => {
		entry({ verified: false, note: "signature did not verify" });
		expect(listWebhookLogEntries()[0]).toMatchObject({ verified: false, note: "signature did not verify" });
	});

	it("caps the log, dropping the oldest entries", () => {
		for (let index = 0; index < MAX_WEBHOOK_LOG_ENTRIES + 5; index += 1) {
			entry({ videoId: `vid-${index}` });
		}
		const entries = listWebhookLogEntries();
		expect(entries).toHaveLength(MAX_WEBHOOK_LOG_ENTRIES);
		expect(entries.at(-1)?.videoId).toBe("vid-5");
	});
});
