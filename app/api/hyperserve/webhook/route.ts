import { verifyWebhookSignature } from "@hyperserve/hyperserve-js";
import { NextResponse } from "next/server";
import { readConfig } from "@/lib/config";
import { appendWebhookLogEntry } from "@/lib/webhook-log";

const MAX_LOGGED_BODY_LENGTH = 8192;

export async function POST(request: Request) {
	// Read the body as text, never request.json(). The signature covers these exact
	// bytes, so parsing and re-serializing would change them and fail verification.
	const rawBody = await request.text();
	const signature = request.headers.get("x-hyperserve-signature");

	// The log (and the public /webhooks page it feeds) only needs enough of the body to
	// show what arrived. `request.text()` has no size limit, so an unauthenticated caller
	// could otherwise post an arbitrarily large body and have all of it retained. This
	// truncation is for logging only: `rawBody` itself stays exact below, since the
	// signature covers every byte.
	const loggedBody = rawBody.length > MAX_LOGGED_BODY_LENGTH ? rawBody.slice(0, MAX_LOGGED_BODY_LENGTH) : rawBody;

	const config = readConfig();
	if (config === null) {
		appendWebhookLogEntry({
			verified: false,
			event: null,
			videoId: null,
			rawBody: loggedBody,
			note: "HYPERSERVE_API_KEY is not set, so this event could not be verified.",
		});
		return NextResponse.json({ error: "HYPERSERVE_API_KEY is not set." }, { status: 500 });
	}
	if (config.webhookSecret == null) {
		appendWebhookLogEntry({
			verified: false,
			event: null,
			videoId: null,
			rawBody: loggedBody,
			note: "HYPERSERVE_WEBHOOK_SECRET is not set, so this event could not be verified.",
		});
		return NextResponse.json({ error: "HYPERSERVE_WEBHOOK_SECRET is not set." }, { status: 500 });
	}

	const verified =
		signature !== null &&
		(await verifyWebhookSignature({
			signature,
			secret: config.webhookSecret,
			body: rawBody,
		}));

	const parsed = safeParse(rawBody);

	appendWebhookLogEntry({
		verified,
		event: typeof parsed?.event === "string" ? parsed.event : null,
		videoId: typeof parsed?.videoId === "string" ? parsed.videoId : null,
		rawBody: loggedBody,
		// Rejected events are logged rather than dropped, so a wrong secret is
		// visible on the page instead of looking like nothing ever arrived.
		note: verified ? null : "Signature did not verify. Check HYPERSERVE_WEBHOOK_SECRET matches the dashboard.",
	});

	if (!verified) {
		// Non-2xx makes Hyperserve retry, which is correct: a bad signature is not a success.
		return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
	}

	return NextResponse.json({ received: true });
}

function safeParse(body: string): Record<string, unknown> | null {
	try {
		const parsed: unknown = JSON.parse(body);
		return typeof parsed === "object" && parsed !== null ? (parsed as Record<string, unknown>) : null;
	} catch {
		return null;
	}
}
