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
 *
 * Held on globalThis rather than a plain module-scoped variable. Next loads the
 * route handler and the server component through separate module graphs, so a
 * `let entries = []` here gives each graph its own array, and the page never
 * sees what the receiver logged. Stashing the array on globalThis under a
 * clearly namespaced key (the same trick used for a shared Prisma client)
 * makes every load of this module in the same process share one array. Do not
 * "simplify" this back to a plain module variable, it will silently break the
 * page within a single process, not just across serverless instances.
 */
const GLOBAL_KEY = "__hyperserveWebhookLogEntries";

type GlobalWithWebhookLog = typeof globalThis & {
	[GLOBAL_KEY]?: WebhookLogEntry[];
};

const globalStore = globalThis as GlobalWithWebhookLog;

function getEntries(): WebhookLogEntry[] {
	if (globalStore[GLOBAL_KEY] === undefined) {
		globalStore[GLOBAL_KEY] = [];
	}
	return globalStore[GLOBAL_KEY];
}

export function appendWebhookLogEntry(input: Omit<WebhookLogEntry, "id" | "receivedAt">): WebhookLogEntry {
	const entry: WebhookLogEntry = {
		...input,
		id: crypto.randomUUID(),
		receivedAt: new Date().toISOString(),
	};
	globalStore[GLOBAL_KEY] = [entry, ...getEntries()].slice(0, MAX_WEBHOOK_LOG_ENTRIES);
	return entry;
}

export function listWebhookLogEntries(): WebhookLogEntry[] {
	return getEntries();
}

export function clearWebhookLog(): void {
	globalStore[GLOBAL_KEY] = [];
}
