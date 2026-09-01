import "server-only";

export interface WebhookLogEntry {
	id: string;
	receivedAt: string;
	verified: boolean;
	event: string | null;
	videoId: string | null;
	rawBody: string;
	/** Why an entry was rejected, or null when it verified. */
	note: string | null;
}

export const MAX_WEBHOOK_LOG_ENTRIES = 50;

/**
 * In memory on purpose: adding a datastore would put a provisioning step in front
 * of a template whose value is a five-minute path. The log resets on restart, and
 * on a serverless deployment the receiver and the page may not share an instance.
 */
let entries: WebhookLogEntry[] = [];

export function appendWebhookLogEntry(input: Omit<WebhookLogEntry, "id" | "receivedAt">): WebhookLogEntry {
	const entry: WebhookLogEntry = {
		...input,
		id: crypto.randomUUID(),
		receivedAt: new Date().toISOString(),
	};
	entries = [entry, ...entries].slice(0, MAX_WEBHOOK_LOG_ENTRIES);
	return entry;
}

export function listWebhookLogEntries(): WebhookLogEntry[] {
	return entries;
}

export function clearWebhookLog(): void {
	entries = [];
}
