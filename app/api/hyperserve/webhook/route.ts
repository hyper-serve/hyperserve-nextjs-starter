import { verifyWebhookSignature } from "@hyperserve/hyperserve-js";
import { NextResponse } from "next/server";
import { readConfig } from "@/lib/config";
import { appendWebhookLogEntry } from "@/lib/webhook-log";

export async function POST(request: Request) {
	// Read the body as text, never request.json(). The signature covers these exact
	// bytes, so parsing and re-serializing would change them and fail verification.
	const rawBody = await request.text();
	const signature = request.headers.get("x-hyperserve-signature");

	const config = readConfig();
	if (config?.webhookSecret == null) {
		appendWebhookLogEntry({
			verified: false,
			event: null,
			videoId: null,
			rawBody,
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
		rawBody,
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
