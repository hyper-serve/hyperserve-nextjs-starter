import { verifyWebhookSignature } from "@hyperserve/hyperserve-js";
import { NextResponse } from "next/server";
import { setLastWebhook } from "@/lib/last-webhook";

export async function POST(request: Request) {
	// Read the body as text, the signature covers these exact bytes.
	const rawBody = await request.text();

	const verified = await verifyWebhookSignature({
		signature: request.headers.get("x-hyperserve-signature") ?? "",
		secret: process.env.HYPERSERVE_WEBHOOK_SECRET ?? "",
		body: rawBody,
	});

	// Demo only
	setLastWebhook({ receivedAt: new Date().toISOString(), verified, body: rawBody });

	if (!verified) {
		return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
	}

	// event is "video-processing-success" or "video-processing-fail".
	// data.resolutions holds a ready videoUrl per resolution, and customMetadata is
	// whatever you passed to createVideo, so you can tie the video back to a row.
	// For a public video, store these URLs here and you never need to call getVideo.
	const { event, videoId, data } = JSON.parse(rawBody);
	console.log(`${event} for ${videoId}`, data?.resolutions?.["720p"]?.videoUrl);

	return NextResponse.json({ received: true });
}
