"use client";

import { useEffect, useState } from "react";
import { RawResponse, type Rendition, VideoPlayer } from "@/components/video-player";
import { RESOLUTIONS } from "@/lib/resolutions";
import type { WebhookEvent } from "@/lib/last-webhook";

/** The shape Hyperserve POSTs on video-processing-success. */
interface WebhookBody {
	event?: string;
	videoId?: string;
	customMetadata?: Record<string, unknown> | null;
	data?: { resolutions?: Partial<Record<string, Rendition & { status?: string }>> };
}

/**
 * The production way. Hyperserve POSTs when transcoding finishes and the payload
 * already carries a playable videoUrl per resolution, so nothing here ever calls
 * getVideo. In your own app the receiver would write these URLs to a database row
 * and this panel would read that row; the in-memory log stands in for it.
 */
export function WebhookVideoPanel({ id }: { id: string }) {
	const [body, setBody] = useState<WebhookBody | null>(null);
	const [rejected, setRejected] = useState(false);

	useEffect(() => {
		if (body !== null) {
			return;
		}
		let cancelled = false;

		async function check() {
			const response = await fetch("/api/webhooks");
			if (!response.ok || cancelled) {
				return;
			}
			const event = (await response.json()) as WebhookEvent | null;
			if (event === null) {
				return;
			}
			if (event.verified) {
				const parsed = parse(event);
				if (parsed?.videoId === id) {
					setBody(parsed);
				}
				return;
			}
			// A rejected delivery means the signature did not check out, which
			// otherwise looks identical to nothing arriving. Its body is never
			// parsed: it failed verification, so none of it is trustworthy.
			setRejected(true);
		}

		void check();
		const timer = setInterval(check, 1500);
		return () => {
			cancelled = true;
			clearInterval(timer);
		};
	}, [id, body]);

	const resolutions = body?.data?.resolutions;
	const ready = resolutions ? (RESOLUTIONS.map((label) => resolutions[label]).find((it) => it?.videoUrl) ?? null) : null;

	return (
		<section className="border-t border-neutral-800 py-10">
			<h2 className="text-xs uppercase tracking-wide text-neutral-500">Your video</h2>
			<p className="mt-2 text-sm text-neutral-400">
				{body === null
					? "Waiting for the webhook. Nothing is polling Hyperserve; this page is waiting for the event to arrive."
					: "Played from the URL in the webhook payload. No getVideo call was made."}
			</p>

			{body === null && rejected ? (
				<p className="mt-3 rounded-lg border border-amber-900 bg-amber-950/30 px-4 py-3 text-sm text-amber-200">
					A webhook arrived but its signature did not verify, so it was rejected. Check that
					HYPERSERVE_WEBHOOK_SECRET matches the secret shown when you created the webhook, then restart the dev
					server.
				</p>
			) : null}
			<div className="mt-4 grid gap-8 lg:grid-cols-[3fr_2fr]">
				<div className="min-w-0">
					<VideoPlayer rendition={ready} failed={body?.event === "video-processing-fail"} />
				</div>
				<RawResponse title="Webhook payload" value={body} />
			</div>
		</section>
	);
}

function parse(event: WebhookEvent): WebhookBody | null {
	try {
		return JSON.parse(event.body) as WebhookBody;
	} catch {
		return null;
	}
}
