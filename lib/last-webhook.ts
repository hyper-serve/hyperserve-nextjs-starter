export interface WebhookEvent {
	receivedAt: string;
	verified: boolean;
	body: string;
}

/** The most recent delivery, and nothing else. Stands in for the video row your
 *  own receiver would update. On globalThis because Next loads the receiver and
 *  the route that reads it through separate module graphs. */
const KEY = "__hyperserveLastWebhook";
const store = globalThis as typeof globalThis & { [KEY]?: WebhookEvent | null };

export function setLastWebhook(event: WebhookEvent): void {
	store[KEY] = event;
}

export function lastWebhook(): WebhookEvent | null {
	return store[KEY] ?? null;
}

/** Called when an upload starts, so a previous video's event cannot be mistaken
 *  for this one's. */
export function clearLastWebhook(): void {
	store[KEY] = null;
}
